"""API Routes - Business Management"""
from flask import Blueprint, request, jsonify
from app.auth_helper import jwt_required_compat as jwt_required, get_jwt_identity_compat as get_jwt_identity
from app.models import Business, User, WorldModel
from app import db

business_bp = Blueprint('business', __name__, url_prefix='/api/business')


@business_bp.route('/', methods=['GET'])
@jwt_required()
def get_businesses():
    """Get all businesses for current user"""
    user_id = get_jwt_identity()
    businesses = Business.query.filter_by(user_id=user_id).all()
    
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
        currency=data.get('currency', 'AED'),
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
