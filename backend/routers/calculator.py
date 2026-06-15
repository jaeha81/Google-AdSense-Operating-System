from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/calculator", tags=["calculator"])

CPC_PRESETS = {
    "low": 200,
    "mid": 800,
    "high": 3000,
    "action": 8000,
}


class CalcInput(BaseModel):
    daily_visitors: int
    ctr_percent: float
    cpc_krw: int
    days: int = 30


@router.post("/estimate")
def estimate(data: CalcInput):
    daily_clicks = data.daily_visitors * (data.ctr_percent / 100)
    daily_rev = daily_clicks * data.cpc_krw
    monthly_rev = daily_rev * data.days
    annual_rev = daily_rev * 365

    action_monthly = daily_clicks * CPC_PRESETS["action"] * data.days
    multiplier = round(CPC_PRESETS["action"] / data.cpc_krw, 1) if data.cpc_krw > 0 else 0

    return {
        "daily_clicks": round(daily_clicks, 1),
        "daily_revenue_krw": round(daily_rev),
        "monthly_revenue_krw": round(monthly_rev),
        "annual_revenue_krw": round(annual_rev),
        "action_monthly_krw": round(action_monthly),
        "upside_multiplier": multiplier,
        "cpc_presets": CPC_PRESETS,
    }
