from fastapi import APIRouter, Depends
from app.core.security import verify_api_key
from app.services.ai_tasks import AIServiceOrchestrator
from app.schemas.ai_schemas import (
    ChatRequest, ChatResponse,
    QuotationSuggestRequest, QuotationSuggestResponse,
    DiagnosisRequest, DiagnosisResponse,
    DispatchRankRequest, DispatchRankResponse,
    KPICalculateRequest, KPICalculateResponse
)

router = APIRouter(prefix="/api/ai", tags=["AI Operations"])
orchestrator = AIServiceOrchestrator()

@router.post("/chat", response_model=ChatResponse)
async def chat_completion(request: ChatRequest, _ = Depends(verify_api_key)):
    """
    General purpose Q&A conversational assistant with chat history.
    """
    return orchestrator.chat(request)

@router.post("/quotation/suggest", response_model=QuotationSuggestResponse)
async def suggest_quotation(request: QuotationSuggestRequest, _ = Depends(verify_api_key)):
    """
    Analyzes space layout and suggests fire protection equipment, quantities and prices.
    """
    return orchestrator.suggest_quotation(request)

@router.post("/diagnosis", response_model=DiagnosisResponse)
async def diagnose_fault(request: DiagnosisRequest, _ = Depends(verify_api_key)):
    """
    Diagnoses fire safety system errors and suggests remedial repair actions.
    """
    return orchestrator.diagnose_fault(request)

@router.post("/dispatch/rank", response_model=DispatchRankResponse)
async def rank_dispatch(request: DispatchRankRequest, _ = Depends(verify_api_key)):
    """
    Evaluates availability, distance, workload and skills to rank technicians for service request dispatch.
    """
    return orchestrator.rank_dispatch(request)

@router.post("/kpi/calculate", response_model=KPICalculateResponse)
async def calculate_kpi(request: KPICalculateRequest, _ = Depends(verify_api_key)):
    """
    Evaluates technician productivity, reviews and SLA performance to calculate overall monthly KPIs.
    """
    return orchestrator.calculate_kpi(request)
