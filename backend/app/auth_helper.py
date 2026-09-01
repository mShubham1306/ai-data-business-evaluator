"""JWT Helper with fallback for demo environments"""
from functools import wraps
from flask import request, jsonify

try:
    from flask_jwt_extended import JWTManager, create_access_token, jwt_required as _jwt_required, get_jwt_identity as _get_jwt_identity
    HAS_JWT = True
except ImportError:
    HAS_JWT = False
    JWTManager = None

def init_jwt(app):
    if HAS_JWT:
        return JWTManager(app)
    return None

def create_demo_token(identity):
    if HAS_JWT:
        return create_access_token(identity=identity)
    return f"demo-jwt-token-for-{identity}"

def jwt_required_compat():
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if request.method == 'OPTIONS':
                return '', 200
            if HAS_JWT:
                return _jwt_required()(fn)(*args, **kwargs)
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def get_jwt_identity_compat():
    if HAS_JWT:
        try:
            return _get_jwt_identity()
        except Exception:
            pass
    from app.models import User
    demo_user = User.query.filter_by(email='demo@nova.ai').first()
    return demo_user.id if demo_user else 'demo-user-id'
