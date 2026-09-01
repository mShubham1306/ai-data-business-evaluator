"""API Routes - Analytics and ML"""
from flask import Blueprint, request, jsonify
from app.auth_helper import jwt_required_compat as jwt_required, get_jwt_identity_compat as get_jwt_identity
from app.models import Business, Prediction, Analytics
from app.services.analytics_service import AnalyticsService, MLService
from app.services.verification_service import VerificationEngine
from app import db

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')
ml_bp = Blueprint('ml', __name__, url_prefix='/api/ml')


@analytics_bp.route('/<business_id>/health-score', methods=['GET'])
@jwt_required()
def get_health_score(business_id):
    """Get business health score"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    health_data = AnalyticsService.calculate_health_score(business_id)
    
    return jsonify(health_data), 200


@analytics_bp.route('/<business_id>/drivers', methods=['GET'])
@jwt_required()
def get_drivers(business_id):
    """Get key performance drivers"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    drivers = AnalyticsService.driver_analysis(business_id)
    
    return jsonify({'drivers': drivers}), 200


@analytics_bp.route('/<business_id>/anomalies', methods=['GET'])
@jwt_required()
def get_anomalies(business_id):
    """Detect anomalies in business data"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    anomalies = AnalyticsService.anomaly_detection(business_id)
    
    return jsonify({'anomalies': anomalies}), 200


@ml_bp.route('/<business_id>/forecast/revenue', methods=['GET'])
@jwt_required()
def forecast_revenue(business_id):
    """Forecast revenue"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    periods = request.args.get('periods', default=12, type=int)
    forecasts = MLService.forecast_revenue(business_id, periods)
    
    if not forecasts:
        return jsonify({'error': 'Insufficient data for forecast'}), 400
    
    return jsonify({'forecasts': forecasts}), 200


@ml_bp.route('/<business_id>/predictions', methods=['GET'])
@jwt_required()
def get_predictions(business_id):
    """Get all predictions for business"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    predictions = Prediction.query.filter_by(business_id=business_id).all()
    
    return jsonify({
        'predictions': [{
            'id': p.id,
            'type': p.prediction_type,
            'value': p.predicted_value,
            'lower_bound': p.lower_bound,
            'upper_bound': p.upper_bound,
            'confidence': p.confidence,
            'status': p.verification_status,
            'period': p.prediction_period,
            'created_at': p.created_at.isoformat()
        } for p in predictions]
    }), 200


@ml_bp.route('/<business_id>/predictions', methods=['POST'])
@jwt_required()
def create_prediction(business_id):
    """Create a new prediction"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    data = request.get_json()
    
    if not data or not data.get('prediction_type') or not data.get('predicted_value'):
        return jsonify({'error': 'prediction_type and predicted_value required'}), 400
    
    prediction = MLService.create_prediction(
        business_id=business_id,
        prediction_type=data['prediction_type'],
        predicted_value=data['predicted_value'],
        confidence=data.get('confidence', 80)
    )
    
    # Verify prediction
    VerificationEngine.verify_prediction(prediction.id)
    
    return jsonify({
        'id': prediction.id,
        'type': prediction.prediction_type,
        'value': prediction.predicted_value,
        'confidence': prediction.confidence,
        'status': prediction.verification_status
    }), 201


@ml_bp.route('/<business_id>/predictions/<prediction_id>', methods=['GET'])
@jwt_required()
def get_prediction(business_id, prediction_id):
    """Get prediction details"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    prediction = Prediction.query.filter_by(id=prediction_id, business_id=business_id).first()
    
    if not prediction:
        return jsonify({'error': 'Prediction not found'}), 404
    
    return jsonify({
        'id': prediction.id,
        'type': prediction.prediction_type,
        'predicted_value': prediction.predicted_value,
        'lower_bound': prediction.lower_bound,
        'upper_bound': prediction.upper_bound,
        'confidence': prediction.confidence,
        'verification_status': prediction.verification_status,
        'business_rules_check': prediction.business_rules_check,
        'model_version': prediction.model_version,
        'actual_value': prediction.actual_value,
        'created_at': prediction.created_at.isoformat()
    }), 200


@ml_bp.route('/<business_id>/segments', methods=['GET'])
@jwt_required()
def get_segments(business_id):
    """Get customer segments"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    segments = MLService.segment_customers(business_id)
    
    return jsonify({'segments': segments}), 200


@analytics_bp.route('/<business_id>/competitors', methods=['GET'])
@jwt_required()
def get_competitor_benchmarks(business_id):
    """Get Competitor AI Monitor & GCC Benchmarks (Requirement 18)"""
    benchmarks = AnalyticsService.get_competitor_benchmarks(business_id)
    return jsonify(benchmarks), 200


@ml_bp.route('/<business_id>/outcomes', methods=['POST'])
@jwt_required()
def record_outcome(business_id):
    """Record actual prediction outcome and trigger retraining loop (P5)"""
    data = request.get_json() or {}
    prediction_id = data.get('prediction_id')
    actual_value = data.get('actual_value')
    reason = data.get('reason')
    
    if not prediction_id or actual_value is None:
        return jsonify({'error': 'prediction_id and actual_value are required'}), 400
        
    result = AnalyticsService.record_outcome(prediction_id, actual_value, reason)
    if not result:
        return jsonify({'error': 'Prediction not found'}), 404
        
    return jsonify(result), 200


@ml_bp.route('/<business_id>/model-performance', methods=['GET'])
@jwt_required()
def get_model_performance(business_id):
    """Get real ML model performance metrics from recorded outcomes"""
    performance = MLService.get_model_performance('v1.0', business_id=business_id)
    return jsonify(performance), 200

