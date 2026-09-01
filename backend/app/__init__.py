import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from app.auth_helper import init_jwt
from app.config import config

db = SQLAlchemy()


def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.url_map.strict_slashes = False
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    init_jwt(app)
    # Always allow all origins and headers so Vercel frontend can reach Render backend
    CORS(app, resources={r"/*": {"origins": "*", "allow_headers": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}})
    
    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Max-Age'] = '86400'  # Cache preflight for 24h
        return response
    
    # Create upload folder
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['MODEL_REGISTRY_PATH'], exist_ok=True)
    
    # Register blueprints
    from app.routes import auth_bp, business_bp, analytics_bp, ml_bp, copilot_bp, verification_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(business_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(ml_bp)
    app.register_blueprint(copilot_bp)
    app.register_blueprint(verification_bp)
    
    # Create database tables & seed sample data
    with app.app_context():
        db.create_all()
        seed_demo_data()
    
    # Health check endpoint
    @app.route('/health', methods=['GET', 'OPTIONS'])
    def health():
        return {'status': 'healthy', 'service': 'NOVA Backend'}, 200
    
    return app


def seed_demo_data():
    """Seed demo user, businesses, and world models if database is empty"""
    from app.models import User, Business, WorldModel
    from app.sample_data import DEFAULT_UAE_BUSINESSES
    import werkzeug.security as security
    
    # Check if demo user exists
    demo_user = User.query.filter_by(email='demo@nova.ai').first()
    if not demo_user:
        demo_user = User(
            email='demo@nova.ai',
            password_hash=security.generate_password_hash('password123'),
            name='NOVA Demo Founder',
            company_name='Apex Group'
        )
        db.session.add(demo_user)
        db.session.commit()
    
    # Seed businesses if none exist
    if Business.query.count() == 0:
        for biz_data in DEFAULT_UAE_BUSINESSES:
            wm_data = biz_data.pop('world_model')
            biz = Business(
                user_id=demo_user.id,
                name=biz_data['name'],
                industry=biz_data['industry'],
                country=biz_data['country'],
                currency=biz_data['currency'],
                size=biz_data['size'],
                founded_year=biz_data['founded_year'],
                description=biz_data['description'],
                goals=biz_data['goals']
            )
            db.session.add(biz)
            db.session.flush()
            
            wm = WorldModel(
                business_id=biz.id,
                revenue=wm_data.get('revenue', {}),
                costs=wm_data.get('costs', {}),
                profit=wm_data.get('profit', {}),
                leads=wm_data.get('leads', {}),
                customers=wm_data.get('customers', {}),
                products=wm_data.get('products', []),
                marketing_spend=wm_data.get('marketing_spend', {}),
                employees=wm_data.get('employees', {}),
                health_score=84.5,
                data_completeness=92.0,
                data_quality_score=95.0
            )
            db.session.add(wm)
        db.session.commit()
