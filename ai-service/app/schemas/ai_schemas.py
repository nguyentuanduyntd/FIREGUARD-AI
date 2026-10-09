from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# ==================== CHAT ====================
class ChatMessage(BaseModel):
    role: str = Field(..., description="Either 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text content")

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user query message")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation history")

class ChatbotEquipment(BaseModel):
    item_code: str = Field(..., description="Unique equipment code in database")
    quantity: int = Field(..., description="Estimated quantity")

class ChatResponse(BaseModel):
    response_text: str = Field(..., description="Text response from assistant")
    followup_questions: List[str] = Field(default=[], description="Follow-up questions regarding building details")
    preliminary_recommendations: List[str] = Field(default=[], description="Initial fire safety suggestions")
    suggested_equipment: List[ChatbotEquipment] = Field(default=[], description="Suggested equipment and estimated counts")
    can_convert_to_survey: bool = Field(default=False, description="Whether conversation can be converted to an onsite survey request")


# ==================== QUOTATION SUGGEST ====================
class QuotationSuggestRequest(BaseModel):
    building_type: str = Field(..., description="Loại công trình")
    area_sqm: float = Field(..., gt=0, description="Diện tích mặt bằng")
    floor_count: int = Field(..., ge=1, description="Số tầng")
    room_count: int = Field(..., ge=1, description="Số phòng")
    risk_level: str = Field(..., description="Mức độ rủi ro: Thấp, Trung bình, Cao")
    existing_equipment: Optional[str] = Field(default="", description="Hệ thống/thiết bị PCCC hiện có")
    expected_budget: Optional[float] = Field(default=None, description="Ngân sách dự kiến")
    special_requirements: Optional[str] = Field(default="", description="Yêu cầu đặc biệt")

class SuggestedQuotationItem(BaseModel):
    item_code: str = Field(..., description="Mã thiết bị từ danh mục database")
    quantity: int = Field(..., gt=0, description="Số lượng đề xuất")
    rationale: str = Field(..., description="Lý do đề xuất")

class QuotationSuggestResponse(BaseModel):
    suggested_items: List[SuggestedQuotationItem] = Field(..., description="Danh sách loại thiết bị đề xuất")
    equipment_cost: float = Field(..., description="Chi phí thiết bị dự kiến")
    installation_cost: float = Field(..., description="Chi phí lắp đặt")
    survey_cost: float = Field(..., description="Chi phí khảo sát thực địa")
    min_price_range: float = Field(..., description="Khoảng giá thấp nhất")
    max_price_range: float = Field(..., description="Khoảng giá cao nhất")
    assumptions: List[str] = Field(..., description="Các giả định hệ thống đặt ra")
    missing_info: List[str] = Field(..., description="Các thông tin còn thiếu cần xác minh")
    confidence_level: float = Field(..., description="Mức độ tin cậy từ 0.0 đến 1.0")


# ==================== DIAGNOSIS ====================
class DiagnosisRequest(BaseModel):
    equipment_model: str = Field(..., description="Model thiết bị cần chẩn đoán")
    equipment_age: float = Field(..., description="Tuổi thiết bị (số năm hoạt động)")
    symptoms: str = Field(..., description="Các triệu chứng hoặc hành vi lỗi")
    repair_history: Optional[str] = Field(default="", description="Lịch sử sửa chữa thiết bị")
    last_maintenance: Optional[str] = Field(default="", description="Thông tin bảo trì gần nhất")
    error_code: Optional[str] = Field(default="", description="Mã lỗi hiển thị (nếu có)")
    image_url: Optional[str] = Field(default="", description="Đường dẫn ảnh chụp lỗi thiết bị")

class DiagnosisResponse(BaseModel):
    likely_causes: List[str] = Field(..., description="Các nguyên nhân lỗi có khả năng xảy ra nhất")
    confidence_level: float = Field(..., description="Mức độ tin cậy từ 0.0 đến 1.0")
    safety_check_steps: List[str] = Field(..., description="Các bước kiểm tra an toàn kỹ thuật bắt buộc")
    parts_to_replace: List[str] = Field(..., description="Các linh kiện/phụ kiện cần thay thế")
    urgency_level: str = Field(..., description="Mức độ khẩn cấp: Thấp, Trung bình, Cao, Rất cao")
    should_stop_using: bool = Field(..., description="Có cần ngừng sử dụng thiết bị ngay lập tức không")
    should_escalate: bool = Field(..., description="Có cần chuyển tiếp lên chuyên gia kỹ thuật cấp cao không")


# ==================== DISPATCH RANKING ====================
class TechnicianCandidate(BaseModel):
    technician_id: str = Field(..., description="Unique ID of the candidate technician")
    name: str = Field(..., description="Full name of technician")
    distance_km: float = Field(..., description="Travel distance to site in kilometers")
    skill_list: List[str] = Field(..., description="List of skills the technician possesses")
    current_workload: int = Field(..., description="Number of currently active jobs assigned to this technician")

class DispatchRankRequest(BaseModel):
    job_description: str = Field(..., description="Description of the dispatch task")
    required_skills: List[str] = Field(..., description="Skills required for the job")
    candidates: List[TechnicianCandidate] = Field(..., description="List of technicians available for evaluation")

class RankedTechnician(BaseModel):
    technician_id: str = Field(..., description="Technician ID")
    name: str = Field(..., description="Technician Name")
    score: float = Field(..., description="Evaluation score out of 100")
    reasons: List[str] = Field(..., description="Key reasons for this rank/score")

class DispatchRankResponse(BaseModel):
    ranked_technicians: List[RankedTechnician] = Field(..., description="Sorted candidates descending by suitability score")


# ==================== KPI CALCULATION ====================
class KPICalculateRequest(BaseModel):
    technician_id: str = Field(..., description="ID of the technician")
    period: str = Field(..., description="Evaluation period (e.g. Month 05/2026)")
    completed_jobs_count: int = Field(..., ge=0, description="Total jobs completed")
    average_sla_minutes: float = Field(..., ge=0, description="Average time to complete a job in minutes")
    rating_5_stars_count: int = Field(..., ge=0, description="Number of 5-star reviews received")

class KPICalculateResponse(BaseModel):
    score: float = Field(..., description="Calculated performance score out of 10")
    rating: str = Field(..., description="Performance tier: EXCELLENT, GOOD, AVERAGE, POOR")
    analysis: Dict[str, Any] = Field(..., description="Detailed analytical metrics")
    feedback: str = Field(..., description="Qualitative feedback and appreciation text")
    improvement_areas: List[str] = Field(..., description="Areas recommended for training/improvement")
