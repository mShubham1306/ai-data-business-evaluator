"""API Routes - Business Management"""
from flask import Blueprint, request, jsonify
from app.auth_helper import jwt_required_compat as jwt_required, get_jwt_identity_compat as get_jwt_identity
from app.models import Business, User, WorldModel
from app import db

business_bp = Blueprint('business', __name__, url_prefix='/api/business')


@business_bp.route('/', methods=['GET'])
@business_bp.route('', methods=['GET'])
@jwt_required()
def get_businesses():
    """Get all businesses for current user"""
    user_id = get_jwt_identity()
    businesses = Business.query.filter_by(user_id=user_id).all()
    if not businesses:
        businesses = Business.query.all()

    
    return jsonify({
        'businesses': [{
            'id': b.id,
            'name': b.name,
            'industry': b.industry,
            'country': b.country,
            'currency': b.currency,
            'size': b.size,
            'created_at': b.created_at.isoformat()
        } for b in businesses]
    }), 200


@business_bp.route('/', methods=['POST'])
@business_bp.route('', methods=['POST'])
@jwt_required()
def create_business():
    """Create a new business"""
    import uuid
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Business name required'}), 400
    
    biz_id = str(uuid.uuid4())
    business = Business(
        id=biz_id,
        user_id=user_id,
        name=data['name'],
        industry=data.get('industry'),
        country=data.get('country'),
        currency=data.get('currency', 'USD'),
        size=data.get('size'),
        founded_year=data.get('founded_year'),
        description=data.get('description'),
        goals=data.get('goals', {})
    )
    
    # Create world model
    world_model = WorldModel(business_id=biz_id)
    
    db.session.add(business)
    db.session.add(world_model)
    db.session.commit()
    
    return jsonify({
        'message': 'Business created successfully',
        'business': {
            'id': business.id,
            'name': business.name,
            'industry': business.industry,
            'currency': business.currency
        }
    }), 201


@business_bp.route('/<business_id>', methods=['GET'])
@jwt_required()
def get_business(business_id):
    """Get business details"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    world_model = WorldModel.query.filter_by(business_id=business_id).first()
    
    return jsonify({
        'id': business.id,
        'name': business.name,
        'industry': business.industry,
        'country': business.country,
        'currency': business.currency,
        'size': business.size,
        'founded_year': business.founded_year,
        'description': business.description,
        'goals': business.goals,
        'world_model': {
            'data_completeness': world_model.data_completeness if world_model else 0,
            'health_score': world_model.health_score if world_model else 0
        } if world_model else {},
        'created_at': business.created_at.isoformat()
    }), 200


@business_bp.route('/<business_id>', methods=['PUT'])
@jwt_required()
def update_business(business_id):
    """Update business details"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        business.name = data['name']
    if 'industry' in data:
        business.industry = data['industry']
    if 'country' in data:
        business.country = data['country']
    if 'currency' in data:
        business.currency = data['currency']
    if 'size' in data:
        business.size = data['size']
    if 'goals' in data:
        business.goals = data['goals']
    if 'description' in data:
        business.description = data['description']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Business updated successfully',
        'business': {
            'id': business.id,
            'name': business.name
        }
    }), 200


@business_bp.route('/<business_id>', methods=['DELETE'])
@jwt_required()
def delete_business(business_id):
    """Delete a business"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    db.session.delete(business)
    db.session.commit()
    
    return jsonify({'message': 'Business deleted successfully'}), 200


@business_bp.route('/<business_id>/world-model', methods=['GET'])
@jwt_required()
def get_world_model(business_id):
    """Get NOVA World Model for business"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    world_model = WorldModel.query.filter_by(business_id=business_id).first()
    
    if not world_model:
        return jsonify({'error': 'World model not found'}), 404
    
    return jsonify({
        'id': world_model.id,
        'business_id': world_model.business_id,
        'revenue': world_model.revenue,
        'profit': world_model.profit,
        'costs': world_model.costs,
        'customers': world_model.customers,
        'leads': world_model.leads,
        'conversion_rate': world_model.conversion_rate,
        'health_score': world_model.health_score,
        'data_completeness': world_model.data_completeness,
        'data_quality_score': world_model.data_quality_score,
        'last_updated_at': world_model.last_updated_at.isoformat() if world_model.last_updated_at else None
    }), 200


@business_bp.route('/<business_id>/world-model', methods=['POST', 'PUT'])
@jwt_required()
def update_world_model_data(business_id):
    """Update world model with monthly financial JSON array (Revenue, COGS, OPEX, Total Costs, Net Profit) and retrain ML model"""
    from app.services.data_service import DataProcessingService
    from datetime import datetime

    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    if not business:
        return jsonify({'error': 'Business not found'}), 404

    world_model = WorldModel.query.filter_by(business_id=business_id).first()
    if not world_model:
        world_model = WorldModel(business_id=business_id)
        db.session.add(world_model)

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data payload provided'}), 400

    # Support array of monthly objects or raw dictionary
    financials = data.get('monthly_financials', data) if isinstance(data, dict) else data

    if isinstance(financials, list):
        rev_dict = {}
        cost_dict = {}
        profit_dict = {}
        for item in financials:
            m = item.get('month')
            if m:
                if 'revenue' in item:
                    rev_dict[m] = float(item['revenue'])
                if 'total_costs' in item or 'costs' in item or 'expenses' in item or 'cogs' in item:
                    cost_dict[m] = float(item.get('total_costs', item.get('costs', item.get('expenses', item.get('cogs', 0) + item.get('opex', 0)))))
                if 'net_profit' in item:
                    profit_dict[m] = float(item['net_profit'])

        if rev_dict:
            world_model.revenue = rev_dict
        if cost_dict:
            world_model.costs = cost_dict
        if profit_dict:
            world_model.profit = profit_dict
    elif isinstance(data, dict):
        if 'revenue' in data:
            world_model.revenue = data['revenue']
        if 'costs' in data:
            world_model.costs = data['costs']
        if 'profit' in data:
            world_model.profit = data['profit']

    world_model.last_updated_at = datetime.utcnow()
    DataProcessingService.calculate_completeness(business_id)
    db.session.commit()

    # Trigger ML Model Retraining
    retrained = False
    try:
        from app.services.analytics_service import MLService
        retrained = MLService.retrain_models_on_user_input(business_id)
    except Exception as e:
        print(f"[ML Model Training Error]: {e}")

    return jsonify({
        'message': 'World model updated and ML model retrained successfully!',
        'business_id': business_id,
        'records_processed': len(world_model.revenue) if world_model.revenue else 0,
        'ml_model_retrained': retrained,
        'health_score': world_model.health_score,
        'data_completeness': world_model.data_completeness
    }), 200
