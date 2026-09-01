from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON, ARRAY
import uuid


class User(db.Model):
    """User model"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    company_name = db.Column(db.String(255))
    role = db.Column(db.String(50), default='user')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    businesses = db.relationship('Business', backref='owner', lazy=True, cascade='all, delete-orphan')
    uploads = db.relationship('DataUpload', backref='user', lazy=True, cascade='all, delete-orphan')


class Business(db.Model):
    """Business/Company model"""
    __tablename__ = 'businesses'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    industry = db.Column(db.String(100))
    country = db.Column(db.String(100))
    currency = db.Column(db.String(10), default='AED')
    size = db.Column(db.String(50))  # Small, Medium, Large
    founded_year = db.Column(db.Integer)
    description = db.Column(db.Text)
    goals = db.Column(JSON, default={})
    meta_data = db.Column(JSON, default={})
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    uploads = db.relationship('DataUpload', backref='business', lazy=True, cascade='all, delete-orphan')
    world_model = db.relationship('WorldModel', backref='business', lazy=True, uselist=False, cascade='all, delete-orphan')
    analytics = db.relationship('Analytics', backref='business', lazy=True, cascade='all, delete-orphan')
    predictions = db.relationship('Prediction', backref='business', lazy=True, cascade='all, delete-orphan')
    opportunities = db.relationship('Opportunity', backref='business', lazy=True, cascade='all, delete-orphan')
    scenarios = db.relationship('Scenario', backref='business', lazy=True, cascade='all, delete-orphan')
    actions = db.relationship('Action', backref='business', lazy=True, cascade='all, delete-orphan')


class DataUpload(db.Model):
    """Data upload tracking"""
    __tablename__ = 'data_uploads'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50))  # pdf, csv, xlsx, etc.
    file_size = db.Column(db.Integer)
    status = db.Column(db.String(50), default='pending')  # pending, processing, completed, failed
    data_type = db.Column(db.String(100))  # Revenue, Expenses, Customers, etc.
    rows_count = db.Column(db.Integer)
    validation_errors = db.Column(JSON, default=[])
    validation_warnings = db.Column(JSON, default=[])
    processed_data = db.Column(JSON)
    meta_data = db.Column(JSON, default={})
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WorldModel(db.Model):
    """NOVA World Model - Central source of truth"""
    __tablename__ = 'world_models'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=False, unique=True)
    
    # Financial Data
    revenue = db.Column(JSON, default={})  # {period: value}
    profit = db.Column(JSON, default={})
    costs = db.Column(JSON, default={})
    cash_flow = db.Column(JSON, default={})
    
    # Customer Data
    customers = db.Column(JSON, default={})
    leads = db.Column(JSON, default={})
    conversion_rate = db.Column(JSON, default={})
    churn_rate = db.Column(JSON, default={})
    
    # Operations
    products = db.Column(JSON, default=[])
    marketing_spend = db.Column(JSON, default={})
    employees = db.Column(JSON, default={})
    
    # Derived metrics
    health_score = db.Column(db.Float)
    growth_rate = db.Column(db.Float)
    profitability = db.Column(db.Float)
    efficiency = db.Column(db.Float)
    
    # Metadata
    last_updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    data_completeness = db.Column(db.Float, default=0)  # 0-100%
    data_quality_score = db.Column(db.Float, default=0)
    

class Analytics(db.Model):
    """Analytics and metrics"""
    __tablename__ = 'analytics'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=False)
    metric_name = db.Column(db.String(255), nullable=False)
    metric_type = db.Column(db.String(100))  # health_score, forecast, driver_analysis, anomaly
    
    # Values
    current_value = db.Column(db.Float)
    previous_value = db.Column(db.Float)
    trend = db.Column(db.String(20))  # up, down, stable
    change_percentage = db.Column(db.Float)
    
    # Details
    period_start = db.Column(db.Date)
    period_end = db.Column(db.Date)
    details = db.Column(JSON, default={})
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Prediction(db.Model):
    """ML Predictions"""
    __tablename__ = 'predictions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=False)
    prediction_type = db.Column(db.String(100), nullable=False)  # revenue, leads, conversion, etc.
    
    # Prediction values
    predicted_value = db.Column(db.Float, nullable=False)
    lower_bound = db.Column(db.Float)  # Prediction interval
    upper_bound = db.Column(db.Float)
    confidence = db.Column(db.Float)  # 0-100%
    
    # Timing
    prediction_period = db.Column(db.String(50))  # next_month, next_quarter, next_year
    prediction_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Model info
    model_version = db.Column(db.String(100))
    model_performance = db.Column(JSON, default={})  # backtest results, accuracy, etc.
    
    # Verification
    verification_status = db.Column(db.String(50))  # verified, flagged, needs_review
    verification_notes = db.Column(db.Text)
    business_rules_check = db.Column(JSON, default={})
    
    # Actual vs Predicted
    actual_value = db.Column(db.Float)
    is_outcome_tracked = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Opportunity(db.Model):
    """Detected opportunities"""
    __tablename__ = 'opportunities'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=False)
    
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    opportunity_type = db.Column(db.String(100))  # margin_improvement, upsell, cost_reduction, etc.
    
    # Impact estimation
    estimated_impact = db.Column(db.Float)  # Expected revenue/profit increase
    confidence = db.Column(db.Float)  # 0-100%
    
    # Metadata
    is_active = db.Column(db.Boolean, default=True)
    user_action = db.Column(db.String(50))  # viewed, simulated, acted, dismissed
    
    details = db.Column(JSON, default={})
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Scenario(db.Model):
    """What-if scenarios"""
    __tablename__ = 'scenarios'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=False)
    
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    
    # Scenario parameters
    assumptions = db.Column(JSON, default={})  # Changes from baseline
    baseline_metrics = db.Column(JSON, default={})
    
    # Simulated results
    results = db.Column(JSON, default={})  # Expected outcomes
    money_impact = db.Column(db.Float)  # Revenue/profit impact
    
    # Comparison
    vs_current = db.Column(JSON, default={})
    vs_baseline = db.Column(JSON, default={})
    
    # Status
    is_favorite = db.Column(db.Boolean, default=False)
    comparison_status = db.Column(db.String(50))  # active, archived, shared
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Action(db.Model):
    """AI-generated actions and recommendations"""
    __tablename__ = 'actions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=False)
    
    recommendation = db.Column(db.Text, nullable=False)
    action_type = db.Column(db.String(100))  # campaign, email, sop, script, etc.
    priority = db.Column(db.String(20))  # high, medium, low
    
    # AI Generated Content
    campaign_content = db.Column(JSON)
    whatsapp_message = db.Column(db.Text)
    email_content = db.Column(db.Text)
    sales_script = db.Column(db.Text)
    sop = db.Column(db.Text)
    
    # Status
    status = db.Column(db.String(50), default='pending')  # pending, approved, rejected, executed
    approval_date = db.Column(db.DateTime)
    execution_date = db.Column(db.DateTime)
    
    # Outcome
    outcome = db.Column(JSON)  # Results after execution
    is_outcome_tracked = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class VerificationLog(db.Model):
    """Verification and validation logs"""
    __tablename__ = 'verification_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = db.Column(db.String(36), db.ForeignKey('businesses.id'), nullable=False)
    
    verification_type = db.Column(db.String(100))  # data_validation, model_check, rule_check
    item_id = db.Column(db.String(36))  # ID of the item being verified
    item_type = db.Column(db.String(100))  # Upload, Prediction, Action, etc.
    
    # Results
    status = db.Column(db.String(50))  # passed, flagged, warning, error
    errors = db.Column(JSON, default=[])
    warnings = db.Column(JSON, default=[])
    flags = db.Column(JSON, default=[])
    
    # Details
    verification_details = db.Column(JSON, default={})
    human_review_required = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SystemHealth(db.Model):
    """System health and performance metrics"""
    __tablename__ = 'system_health'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Data quality
    upload_failure_rate = db.Column(db.Float)
    missing_data_rate = db.Column(db.Float)
    suspicious_data_frequency = db.Column(db.Float)
    
    # ML health
    forecast_error = db.Column(db.Float)
    prediction_accuracy = db.Column(db.Float)
    model_drift_detected = db.Column(db.Boolean, default=False)
    anomaly_frequency = db.Column(db.Float)
    
    # Product health
    feature_usage = db.Column(JSON, default={})
    recommendation_acceptance_rate = db.Column(db.Float)
    action_success_rate = db.Column(db.Float)
    
    # Alerts
    alerts = db.Column(JSON, default=[])
    
    checked_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
