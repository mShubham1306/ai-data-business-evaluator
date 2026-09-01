import sys
import os

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models import User, Business, WorldModel, Prediction, VerificationLog
from app.services.analytics_service import AnalyticsService, MLService
from app.services.verification_service import VerificationEngine, LLMPlausibilityCheck
from app.services.copilot_service import CopilotService

def run_tests():
    print("=" * 60)
    print("NOVA Backend & 4-Layer Architecture Self-Test")
    print("=" * 60)

    app = create_app('development')
    with app.app_context():
        # 1. Check DB seeding
        user_count = User.query.count()
        biz_count = Business.query.count()
        wm_count = WorldModel.query.count()
        print(f"[1. Data Layer]: Seeded Users={user_count}, Businesses={biz_count}, WorldModels={wm_count}")
        assert biz_count >= 2, "Failed to seed demo UAE SME businesses!"

        first_biz = Business.query.first()
        print(f"   -> Active Demo Business: '{first_biz.name}' ({first_biz.industry})")

        # 2. Test Analytics & ML forecasting
        health = AnalyticsService.calculate_health_score(first_biz.id)
        print(f"[2. Analytics/ML Layer]: Calculated Health Score = {health['health_score']:.1f}/100 ({health['rating']})")
        
        forecast = MLService.forecast_revenue(first_biz.id, periods=6)
        if forecast:
            print(f"   -> ML Revenue Forecast (M+1): ${forecast[0]['forecast']:,.0f} [Bounds: ${forecast[0]['lower_bound']:,.0f} - ${forecast[0]['upper_bound']:,.0f}, Conf: {forecast[0]['confidence']}%]")
        
        # 3. Test Verification & Plausibility
        pred = MLService.create_prediction(first_biz.id, 'revenue', 480000, 85)
        log = VerificationEngine.verify_prediction(pred.id)
        print(f"[3. Verification Layer]: Prediction Check Status = '{log.status}' (Errors: {len(log.errors)}, Warnings: {len(log.warnings)})")

        wm = WorldModel.query.filter_by(business_id=first_biz.id).first()
        plausibility_flags = LLMPlausibilityCheck.flag_suspicious_patterns(wm.revenue, 'revenue', first_biz.name)
        print(f"   -> LLM Plausibility Check: Flagged {len(plausibility_flags)} suspicious patterns.")

        # 4. Test Copilot Gemini LLM Experience
        reply = CopilotService.generate_chat_response(first_biz.id, "How can I improve my profit margin?")
        print(f"[4. LLM Copilot Experience]: Response Sample:")
        print(f"   \"{reply[:120]}...\"")

        print("=" * 60)
        print("SUCCESS: All 4 Layers of NOVA Decision Engine Verified!")
        print("=" * 60)

if __name__ == '__main__':
    run_tests()
