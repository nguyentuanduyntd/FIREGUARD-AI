import logging
import json
import re
from abc import ABC, abstractmethod
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings

logger = logging.getLogger("llm_provider")

class LLMProvider(ABC):
    @abstractmethod
    def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        """
        Sends a prompt to the LLM and returns the text response.
        """
        pass


class MockProvider(LLMProvider):
    def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        logger.info("Mock LLM Provider called.")
        
        # Analyze the prompt to return appropriate mock data
        full_text_lower = (prompt + " " + (system_instruction or "")).lower()
        
        if "quotation" in full_text_lower or "báo giá" in full_text_lower or "suggest" in full_text_lower:
            from app.services.smart_helpers import generate_smart_suggestion
            btype_match = re.search(r'Building Type:\s*(.+)', prompt)
            area_match = re.search(r'Area:\s*([\d.]+)', prompt)
            floor_match = re.search(r'Floor Count:\s*(\d+)', prompt)
            room_match = re.search(r'Room Count:\s*(\d+)', prompt)
            risk_match = re.search(r'Risk Level:\s*(.+)', prompt)
            
            req = {
                'building_type': btype_match.group(1).strip() if btype_match else 'Nhà ở gia đình',
                'area_sqm': float(area_match.group(1)) if area_match else 100.0,
                'floor_count': int(floor_match.group(1)) if floor_match else 1,
                'room_count': int(room_match.group(1)) if room_match else 1,
                'risk_level': risk_match.group(1).strip() if risk_match else 'Trung bình'
            }
            resp = generate_smart_suggestion(req)
            return json.dumps(resp.model_dump(), ensure_ascii=False)
            
        elif "diagnosis" in full_text_lower or "chẩn đoán" in full_text_lower or "diagnose" in full_text_lower:
            return json.dumps({
                "likely_causes": [
                    "Cảm biến bị bám bụi bẩn hoặc dị vật làm giảm độ nhạy quang học",
                    "Dây tín hiệu truyền thông trung tâm bị suy hao hoặc lỏng chân cắm",
                    "Điện áp pin nuôi dự phòng sụt giảm dưới ngưỡng danh định"
                ],
                "confidence_level": 0.91,
                "safety_check_steps": [
                    "Ngắt nguồn điện cấp trước khi tháo gỡ cụm thiết bị",
                    "Đo kiểm tra điện áp tiếp điểm và kiểm tra thông mạch đường dây",
                    "Vệ sinh khoang buồng cảm biến bằng khí nén áp lực thấp"
                ],
                "parts_to_replace": [
                    "Đế gài tiếp xúc đầu báo",
                    "Pin dự phòng Lithium 3V chuyên dụng"
                ],
                "urgency_level": "Trung bình",
                "should_stop_using": False,
                "should_escalate": False
            }, ensure_ascii=False)
            
        elif "dispatch" in full_text_lower or "điều động" in full_text_lower:
            return json.dumps({
                "ranked_technicians": [
                    {
                        "technician_id": "TECH-001",
                        "name": "Nguyễn Văn Hùng",
                        "score": 94.5,
                        "reasons": ["Khoảng cách di chuyển gần nhất (2.5 km)", "Có chứng chỉ chuyên môn 'Cơ khí bơm' bậc 4/7", "Đang trống lịch làm việc"]
                    },
                    {
                        "technician_id": "TECH-002",
                        "name": "Trần Thanh Sơn",
                        "score": 78.0,
                        "reasons": ["Khoảng cách trung bình (6.1 km)", "Kinh nghiệm sửa chữa bơm 3 năm", "Đang thực hiện 1 tác vụ khác (hoàn thành sau 30 phút)"]
                    }
                ]
            }, ensure_ascii=False)
            
        elif "kpi" in full_text_lower or "hiệu suất" in full_text_lower:
            return json.dumps({
                "score": 8.7,
                "rating": "EXCELLENT",
                "analysis": {
                    "completed_requests": "15/15 yêu cầu hoàn thành đúng hạn (100%)",
                    "average_response_time": "32 phút (nhanh hơn KPI mục tiêu 45 phút)",
                    "customer_feedback": "4.9/5.0 sao đánh giá hài lòng khách hàng"
                },
                "feedback": "Kỹ thuật viên hoàn thành xuất sắc nhiệm vụ. Đề xuất thưởng nóng tháng này.",
                "improvement_areas": ["Tối ưu hóa thời gian check-in thông qua app"]
            }, ensure_ascii=False)
            
        else:
            from app.services.smart_helpers import generate_smart_chat_response
            user_lines = [line for line in prompt.split('\n') if line.startswith('User:')]
            user_msg = user_lines[-1].replace('User:', '').strip() if user_lines else prompt
            resp = generate_smart_chat_response(user_msg)
            return json.dumps(resp.model_dump(), ensure_ascii=False)


class OpenAIProvider(LLMProvider):
    def __init__(self):
        import openai
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY must be configured to use OpenAI provider.")
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.mock_fallback = MockProvider()

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        reraise=False
    )
    def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        logger.info(f"Calling OpenAI API using model: {settings.OPENAI_MODEL}")
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                timeout=15.0 # 15 seconds timeout
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenAI API error: {e}. Falling back to MockProvider.")
            return self.mock_fallback.generate_text(prompt, system_instruction)


class GeminiProvider(LLMProvider):
    def __init__(self):
        import google.generativeai as genai
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY must be configured to use Gemini provider.")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL
        self.mock_fallback = MockProvider()

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        reraise=False
    )
    def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        logger.info(f"Calling Gemini API using model: {self.model_name}")
        import google.generativeai as genai
        
        try:
            config = genai.GenerationConfig(timeout=15.0)
            
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )
            
            response = model.generate_content(
                prompt,
                generation_config=config
            )
            return response.text or ""
        except Exception as e:
            logger.error(f"Gemini API error: {e}. Falling back to MockProvider.")
            return self.mock_fallback.generate_text(prompt, system_instruction)


def get_llm_provider() -> LLMProvider:
    provider_name = settings.LLM_PROVIDER
    gemini_key = settings.GEMINI_API_KEY.strip()
    openai_key = settings.OPENAI_API_KEY.strip()

    is_valid_gemini = bool(gemini_key and not gemini_key.startswith("your_"))
    is_valid_openai = bool(openai_key and not openai_key.startswith("your_"))

    if provider_name == "gemini" or (is_valid_gemini and provider_name != "openai"):
        try:
            logger.info("Initializing GeminiProvider with active GEMINI_API_KEY.")
            return GeminiProvider()
        except Exception as e:
            logger.warning(f"Fallback to MockProvider due to Gemini setup error: {e}")
            return MockProvider()
    elif provider_name == "openai" or (is_valid_openai and provider_name != "gemini"):
        try:
            logger.info("Initializing OpenAIProvider with active OPENAI_API_KEY.")
            return OpenAIProvider()
        except Exception as e:
            logger.warning(f"Fallback to MockProvider due to OpenAI setup error: {e}")
            return MockProvider()
    else:
        return MockProvider()

