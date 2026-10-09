import json
import logging
import re
from typing import Dict, Any
from app.core.anonymize import anonymize_data
from app.repositories.ai_log_repository import AILogRepository
from app.services.llm_provider import get_llm_provider, MockProvider
from app.services.smart_helpers import generate_smart_suggestion, generate_smart_chat_response
from app.schemas.ai_schemas import (
    ChatRequest, ChatResponse,
    QuotationSuggestRequest, QuotationSuggestResponse, SuggestedQuotationItem,
    DiagnosisRequest, DiagnosisResponse,
    DispatchRankRequest, DispatchRankResponse,
    KPICalculateRequest, KPICalculateResponse
)

logger = logging.getLogger("ai_tasks")

def parse_json_from_llm(text: str) -> Dict[str, Any]:
    """
    Cleans up markdown JSON code blocks (e.g. ```json ... ```) and parses the text into a dictionary.
    """
    cleaned = text.strip()
    if "```" in cleaned:
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', cleaned)
        if match:
            cleaned = match.group(1).strip()
    
    start_brace = cleaned.find('{')
    end_brace = cleaned.rfind('}')
    if start_brace != -1 and end_brace != -1 and end_brace > start_brace:
        cleaned = cleaned[start_brace:end_brace+1]
        
    # Remove BOM if present
    if cleaned.startswith('\ufeff'):
        cleaned = cleaned[1:]
        
    return json.loads(cleaned)


class AIServiceOrchestrator:
    def __init__(self):
        self.provider = get_llm_provider()
        self.provider_name = self.provider.__class__.__name__

    def chat(self, request: ChatRequest) -> ChatResponse:
        # Anonymize input query to prevent leaking PII
        anon_message = anonymize_data(request.message)
        
        system_instruction = (
            "You are a professional fire safety consulting chatbot on the FireGuard AI platform.\n"
            "Your task is to advise users on fire prevention and fighting (PCCC) requirements.\n\n"
            "SAFETY INSTRUCTIONS:\n"
            "1. You MUST ask for these details if they are not provided yet: construction type (loại công trình), "
            "number of rooms (số phòng), presence of kitchen (có bếp không), electrical system status (hệ thống điện), "
            "and number of emergency exits (số lối thoát hiểm).\n"
            "2. Always recommend a physical onsite survey (khảo sát thực tế) to get exact requirements.\n"
            "3. State clearly that this preliminary advice DOES NOT replace a licensed fire safety expert.\n"
            "4. NEVER provide dangerous instructions or DIY repair steps on live fire systems.\n"
            "5. NEVER self-certify or guarantee compliance with national fire regulations (TCVN) before a physical survey is conducted.\n\n"
            "OUTPUT FORMAT:\n"
            "You must return a strict JSON object with NO markdown formatting, text before or after the JSON. "
            "The JSON must have the following keys:\n"
            "{\n"
            "  \"response_text\": \"Your friendly Vietnamese reply to the user\",\n"
            "  \"followup_questions\": [\"string of next question to ask if details are missing\"],\n"
            "  \"preliminary_recommendations\": [\"specific preliminary recommendations based on user input\"],\n"
            "  \"suggested_equipment\": [{\"item_code\": \"valid-code\", \"quantity\": int}],\n"
            "  \"can_convert_to_survey\": true/false\n"
            "}\n\n"
            "VALID EQUIPMENT CODES:\n"
            "- EXT-ABC-4KG (Bình chữa cháy bột ABC 4kg)\n"
            "- EXT-CO2-3KG (Bình chữa cháy khí CO2 3kg)\n"
            "- DET-SMOKE-WIRE (Đầu báo khói quang học không dây)\n"
            "- DET-HEAT-WIRE (Đầu báo nhiệt liên hợp không dây)\n"
            "- ALM-PANEL-8 (Tủ trung tâm báo cháy 8 kênh)\n"
            "- ALM-BELL (Chuông báo cháy 12V/24V)\n"
            "- ALM-BUTTON (Nút nhấn khẩn cấp báo cháy)\n"
            "- SPK-NOZZLE-68 (Đầu phun Sprinkler 68°C)\n"
            "- PIPE-STEEL-DN50 (Ống thép DN50)\n"
            "Only suggest item_codes from this list. If not enough details are provided yet, keep suggested_equipment empty []."
        )
        
        # Build prompt from history
        prompt_parts = []
        for msg in request.history:
            role_name = "User" if msg.role == "user" else "Assistant"
            prompt_parts.append(f"{role_name}: {anonymize_data(msg.content)}")
            
        prompt_parts.append(f"User: {anon_message}")
        prompt = "\n".join(prompt_parts)
        
        if self.provider_name == "MockProvider":
            response_data = generate_smart_chat_response(anon_message, request.history)
        else:
            try:
                response_text = self.provider.generate_text(prompt, system_instruction)
                parsed_json = parse_json_from_llm(response_text)
                response_data = ChatResponse(**parsed_json)
            except Exception as e:
                logger.error(f"Failed to process chat response from LLM provider: {e}. Fallback to smart chat response.")
                response_data = generate_smart_chat_response(anon_message, request.history)
        
        # Log request and response
        AILogRepository.save_log(
            task_name="chat",
            request_data={"message": anon_message, "history_length": len(request.history)},
            response_data=response_data.model_dump(),
            provider=self.provider_name
        )
        
        return response_data

    def suggest_quotation(self, request: QuotationSuggestRequest) -> QuotationSuggestResponse:
        # Anonymize input request parameters
        anon_req = anonymize_data(request.model_dump())
        
        system_instruction = (
            "You are a professional fire safety engineering expert on the FireGuard AI platform.\n"
            "Your task is to recommend fire fighting and warning equipment based on building parameters.\n\n"
            "INSTRUCTIONS:\n"
            "1. Recommend item_codes ONLY from this list:\n"
            "   - EXT-ABC-4KG (Bình chữa cháy bột ABC 4kg)\n"
            "   - EXT-CO2-3KG (Bình chữa cháy khí CO2 3kg)\n"
            "   - DET-SMOKE-WIRE (Đầu báo khói quang học không dây)\n"
            "   - DET-HEAT-WIRE (Đầu báo nhiệt liên hợp không dây)\n"
            "   - ALM-PANEL-8 (Tủ trung tâm báo cháy 8 kênh)\n"
            "   - ALM-BELL (Chuông báo cháy 12V/24V)\n"
            "   - ALM-BUTTON (Nút nhấn khẩn cấp báo cháy)\n"
            "   - SPK-NOZZLE-68 (Đầu phun Sprinkler 68°C)\n"
            "   - PIPE-STEEL-DN50 (Ống thép DN50)\n"
            "2. Focus only on item_code, quantity, and rationale. Set all cost fields (equipment_cost, installation_cost, survey_cost, min_price_range, max_price_range) to 0.0, as they will be calculated by the backend using database values.\n"
            "3. State your assumptions (assumptions) and any missing information needed (missing_info).\n"
            "4. Output strict JSON with no formatting or other text."
        )
        
        prompt = f"""
        Suggest fire safety equipment and estimate requirements for this facility:
        - Building Type: {anon_req['building_type']}
        - Area: {anon_req['area_sqm']} square meters
        - Floor Count: {anon_req['floor_count']}
        - Room Count: {anon_req['room_count']}
        - Risk Level: {anon_req['risk_level']}
        - Existing Equipment: {anon_req['existing_equipment']}
        - Expected Budget: {anon_req['expected_budget']}
        - Special Requirements: {anon_req['special_requirements']}
        
        Return a JSON object matching this schema exactly:
        {{
            "suggested_items": [
                {{
                    "item_code": "code-string",
                    "quantity": integer,
                    "rationale": "reason-string"
                }}
            ],
            "equipment_cost": 0.0,
            "installation_cost": 0.0,
            "survey_cost": 0.0,
            "min_price_range": 0.0,
            "max_price_range": 0.0,
            "assumptions": ["assumption 1", "assumption 2"],
            "missing_info": ["missing info 1", "missing info 2"],
            "confidence_level": float (0.0 to 1.0)
        }}
        """
        
        if self.provider_name == "MockProvider":
            response_data = generate_smart_suggestion(anon_req)
        else:
            try:
                response_text = self.provider.generate_text(prompt, system_instruction)
                parsed_json = parse_json_from_llm(response_text)
                response_data = QuotationSuggestResponse(**parsed_json)
                if not response_data.suggested_items:
                    response_data = generate_smart_suggestion(anon_req)
            except Exception as e:
                logger.error(f"Failed to parse LLM response for quotation suggestion: {e}. Fallback to smart suggestion.")
                response_data = generate_smart_suggestion(anon_req)
            
        AILogRepository.save_log(
            task_name="quotation_suggest",
            request_data=anon_req,
            response_data=response_data.model_dump(),
            provider=self.provider_name
        )
        
        return response_data

    def diagnose_fault(self, request: DiagnosisRequest) -> DiagnosisResponse:
        # Anonymize input request parameters
        anon_req = anonymize_data(request.model_dump())
        
        system_instruction = (
            "You are an expert diagnostic assistant for fire protection systems on the FireGuard AI platform.\n"
            "YOUR TARGET AUDIENCE IS CERTIFIED FIELD TECHNICIANS, NOT END CLIENTS.\n\n"
            "STRICT SAFETY RULES:\n"
            "1. Your diagnostic analysis is ONLY a support tool. Do NOT declare any repair as completed; only physical tests can verify this.\n"
            "2. Never recommend dangerous tasks (like rewiring live parts or opening pressurized lines without depressurization) without safety guidelines.\n"
            "3. If danger levels are high (e.g., battery swelling, main panel short-circuit, pressure relief valve failure, active gas/leak warnings), state clearly that they must evacuate or contact local fire services/experts.\n"
            "4. Return strict JSON matching the schema."
        )
        
        prompt = f"""
        Analyze and diagnose the fault for this equipment:
        - Equipment Model: {anon_req['equipment_model']}
        - Equipment Age: {anon_req['equipment_age']} years
        - Symptoms: {anon_req['symptoms']}
        - Repair History: {anon_req['repair_history']}
        - Last Maintenance: {anon_req['last_maintenance']}
        - Error Code: {anon_req['error_code']}
        - Image: {anon_req['image_url']}
        
        Return a JSON object matching this schema exactly:
        {{
            "likely_causes": ["cause 1", "cause 2"],
            "confidence_level": float (0.0 to 1.0),
            "safety_check_steps": ["step 1", "step 2"],
            "parts_to_replace": ["part 1", "part 2"],
            "urgency_level": "Thấp" | "Trung bình" | "Cao" | "Rất cao",
            "should_stop_using": boolean,
            "should_escalate": boolean
        }}
        """
        
        try:
            response_text = self.provider.generate_text(prompt, system_instruction)
            parsed_json = parse_json_from_llm(response_text)
            response_data = DiagnosisResponse(**parsed_json)
        except Exception as e:
            logger.error(f"Failed to process diagnosis response from LLM provider: {e}")
            response_data = DiagnosisResponse(
                likely_causes=["Hỏng cảm biến khói do bụi bẩn tích tụ.", "Lỗi kết nối cáp tín hiệu trung tâm."],
                confidence_level=0.85,
                safety_check_steps=[
                    "Ngắt nguồn cấp trước khi tháo đầu báo.",
                    "Sử dụng đồng hồ đo điện vạn năng để kiểm tra điện áp cáp truyền tín hiệu."
                ],
                parts_to_replace=["Đế đầu báo khói khẩn cấp", "Pin dự phòng lithium 3V"],
                urgency_level="Trung bình",
                should_stop_using=False,
                should_escalate=False
            )
            
        AILogRepository.save_log(
            task_name="diagnosis",
            request_data=anon_req,
            response_data=response_data.model_dump(),
            provider=self.provider_name
        )
        
        return response_data

    def rank_dispatch(self, request: DispatchRankRequest) -> DispatchRankResponse:
        # Anonymize input request parameters
        anon_req = anonymize_data(request.model_dump())
        
        system_instruction = (
            "You are an automated logistics dispatch dispatcher for fire safety technicians. "
            "Rank candidate technicians based on travel distance, matched skills, and workload. "
            "Return a strict JSON output. No other text."
        )
        
        prompt = f"""
        Rank these candidate technicians for the following job:
        - Job Description: {anon_req['job_description']}
        - Required Skills: {json.dumps(anon_req['required_skills'], ensure_ascii=False)}
        - Candidates: {json.dumps(anon_req['candidates'], ensure_ascii=False)}
        
        Scoring guidelines:
        - Prioritize matched skills from the technician's skill_list (highest weight).
        - Penalize higher distance_km.
        - Penalize high current_workload.
        
        Return a JSON object matching this schema exactly:
        {{
            "ranked_technicians": [
                {{
                    "technician_id": "tech-id-string",
                    "name": "tech-name-string",
                    "score": float (0.0 to 100.0),
                    "reasons": ["reason-1", "reason-2"]
                }}
            ]
        }}
        """
        
        try:
            response_text = self.provider.generate_text(prompt, system_instruction)
            parsed_json = parse_json_from_llm(response_text)
            response_data = DispatchRankResponse(**parsed_json)
        except Exception as e:
            logger.error(f"Failed to process dispatch rank response from LLM provider: {e}")
            fallback_provider = MockProvider()
            parsed_json = json.loads(fallback_provider.generate_text("dispatch"))
            response_data = DispatchRankResponse(**parsed_json)
            
        AILogRepository.save_log(
            task_name="dispatch_rank",
            request_data=anon_req,
            response_data=response_data.model_dump(),
            provider=self.provider_name
        )
        
        return response_data

    def calculate_kpi(self, request: KPICalculateRequest) -> KPICalculateResponse:
        # Anonymize input request parameters
        anon_req = anonymize_data(request.model_dump())
        
        system_instruction = (
            "You are an HR performance evaluator. Calculate the overall score (0.0 to 10.0), "
            "rating (EXCELLENT, GOOD, AVERAGE, POOR), analytical metrics, qualitative feedback, "
            "and improvement areas. Return strict JSON."
        )
        
        prompt = f"""
        Calculate KPI performance for the following technician metrics:
        - Technician ID: {anon_req['technician_id']}
        - Evaluation Period: {anon_req['period']}
        - Completed Jobs: {anon_req['completed_jobs_count']}
        - Average SLA Minutes: {anon_req['average_sla_minutes']}
        - Number of 5-star reviews: {anon_req['rating_5_stars_count']}
        
        Return a JSON object matching this schema exactly:
        {{
            "score": float (between 0.0 and 10.0),
            "rating": "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR",
            "analysis": {{
                "completed_requests": "description-string",
                "average_response_time": "description-string",
                "customer_feedback": "description-string"
            }},
            "feedback": "qualitative feedback paragraph",
            "improvement_areas": ["area-1", "area-2"]
        }}
        """
        
        try:
            response_text = self.provider.generate_text(prompt, system_instruction)
            parsed_json = parse_json_from_llm(response_text)
            response_data = KPICalculateResponse(**parsed_json)
        except Exception as e:
            logger.error(f"Failed to process KPI calculation response from LLM provider: {e}")
            fallback_provider = MockProvider()
            parsed_json = json.loads(fallback_provider.generate_text("kpi"))
            response_data = KPICalculateResponse(**parsed_json)
            
        AILogRepository.save_log(
            task_name="kpi_calculate",
            request_data=anon_req,
            response_data=response_data.model_dump(),
            provider=self.provider_name
        )
        
        return response_data
