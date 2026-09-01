"""Routes Package"""
from app.routes.auth import auth_bp
from app.routes.business import business_bp
from app.routes.analytics import analytics_bp, ml_bp
from app.routes.copilot import copilot_bp, verification_bp
from app.routes.verification import verification_bp as data_verification_bp

__all__ = [
    'auth_bp',
    'business_bp',
    'analytics_bp',
    'ml_bp',
    'copilot_bp',
    'verification_bp',
    'data_verification_bp'
]
