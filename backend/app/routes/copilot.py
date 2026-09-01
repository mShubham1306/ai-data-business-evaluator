"""API Routes - Copilot and Decision Engine"""
from flask import Blueprint, request, jsonify
from app.auth_helper import jwt_required_compat as jwt_required, get_jwt_identity_compat as get_jwt_identity
from app.models import Business, Scenario, Opportunity, Action
from app.services.copilot_service import CopilotService, DecisionEngineService, OpportunityRadarService
from app.services.action_service import ActionEngineService, FeedbackEngineService
from app import db

copilot_bp = Blueprint('copilot', __name__, url_prefix='/api/copilot')


def get_target_business(business_id):
    if business_id == 'default':
        return Business.query.first()
    b = Business.query.get(business_id)
    return b or Business.query.first()


@copilot_bp.route('/<business_id>/chat', methods=['POST'])
@jwt_required()
def chat(business_id):
    """Interactive Gemini Copilot endpoint"""
    business = get_target_business(business_id)
    if not business:
        return jsonify({'error': 'No business profile found'}), 404
        
    data = request.get_json() or {}
    user_message = data.get('message', '')
    if not user_message:
        return jsonify({'error': 'Message required'}), 400
        
    context = f"Business: {business.name}, Industry: {business.industry}, Currency: {business.currency}"
    response_text = CopilotService.generate_chat_response(business.id, user_message, context)
    
    return jsonify({
        'message': response_text,
        'business_id': business.id,
        'model': 'gemini-2.0-flash'
    }), 200



@copilot_bp.route('/<business_id>/scenarios', methods=['GET'])
@jwt_required()
def get_scenarios(business_id):
    """Get all scenarios for business"""
    business = get_target_business(business_id)
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    scenarios = Scenario.query.filter_by(business_id=business.id).all()
    
    return jsonify({
        'scenarios': [{
            'id': s.id,
            'name': s.name,
            'description': s.description,
            'money_impact': s.money_impact,
            'is_favorite': s.is_favorite,
            'created_at': s.created_at.isoformat()
        } for s in scenarios]
    }), 200


@copilot_bp.route('/<business_id>/scenarios', methods=['POST'])
@jwt_required()
def create_scenario(business_id):
    """Create a new what-if scenario"""
    business = get_target_business(business_id)
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    data = request.get_json() or {}
    if not data or not data.get('name') or not data.get('assumptions'):
        return jsonify({'error': 'name and assumptions required'}), 400
    
    scenario = DecisionEngineService.create_scenario(
        business_id=business.id,
        scenario_name=data['name'],
        assumptions=data['assumptions']
    )
    
    return jsonify({
        'id': scenario.id,
        'name': scenario.name,
        'money_impact': scenario.money_impact,
        'results': scenario.results
    }), 201


@copilot_bp.route('/<business_id>/scenarios/<scenario_id>', methods=['GET'])
@jwt_required()
def get_scenario(business_id, scenario_id):
    """Get scenario details"""
    business = get_target_business(business_id)
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    scenario = Scenario.query.filter_by(id=scenario_id).first()
    if not scenario:
        return jsonify({'error': 'Scenario not found'}), 404
    
    return jsonify({
        'id': scenario.id,
        'name': scenario.name,
        'description': scenario.description,
        'assumptions': scenario.assumptions,
        'results': scenario.results,
        'money_impact': scenario.money_impact,
        'is_favorite': scenario.is_favorite
    }), 200


@copilot_bp.route('/<business_id>/scenarios/<scenario_id>/favorite', methods=['PUT'])
@jwt_required()
def toggle_favorite_scenario(business_id, scenario_id):
    """Toggle favorite status"""
    business = get_target_business(business_id)
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    scenario = Scenario.query.filter_by(id=scenario_id).first()
    if not scenario:
        return jsonify({'error': 'Scenario not found'}), 404
    
    scenario.is_favorite = not scenario.is_favorite
    db.session.commit()
    
    return jsonify({'is_favorite': scenario.is_favorite}), 200


@copilot_bp.route('/<business_id>/opportunities', methods=['GET'])
@jwt_required()
def get_opportunities(business_id):
    """Get detected opportunities"""
    business = get_target_business(business_id)
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    opportunities = Opportunity.query.filter_by(business_id=business.id, is_active=True).all()
    if not opportunities:
        opportunities = OpportunityRadarService.scan_for_opportunities(business.id)
    
    return jsonify({
        'opportunities': [{
            'id': o.id,
            'title': o.title,
            'description': o.description,
            'type': o.opportunity_type,
            'estimated_impact': o.estimated_impact,
            'confidence': o.confidence,
            'created_at': o.created_at.isoformat()
        } for o in opportunities]
    }), 200



@copilot_bp.route('/<business_id>/opportunities/scan', methods=['POST'])
@jwt_required()
def scan_opportunities(business_id):
    """Scan for new opportunities"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    opportunities = OpportunityRadarService.scan_for_opportunities(business_id)
    
    return jsonify({
        'message': f'Found {len(opportunities)} opportunities',
        'opportunities': [{
            'id': o.id,
            'title': o.title,
            'type': o.opportunity_type,
            'estimated_impact': o.estimated_impact,
            'confidence': o.confidence
        } for o in opportunities]
    }), 200


@copilot_bp.route('/<business_id>/actions', methods=['GET'])
@jwt_required()
def get_actions(business_id):
    """Get AI-generated actions"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    actions = Action.query.filter_by(business_id=business_id).all()
    
    return jsonify({
        'actions': [{
            'id': a.id,
            'recommendation': a.recommendation,
            'type': a.action_type,
            'priority': a.priority,
            'status': a.status,
            'created_at': a.created_at.isoformat()
        } for a in actions]
    }), 200


@copilot_bp.route('/<business_id>/actions', methods=['POST'])
@jwt_required()
def generate_action(business_id):
    """Generate AI action"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    data = request.get_json()
    
    if not data or not data.get('recommendation') or not data.get('action_type'):
        return jsonify({'error': 'recommendation and action_type required'}), 400
    
    action = ActionEngineService.generate_action(
        business_id=business_id,
        recommendation_text=data['recommendation'],
        action_type=data['action_type']
    )
    
    return jsonify({
        'id': action.id,
        'recommendation': action.recommendation,
        'type': action.action_type,
        'status': action.status
    }), 201


@copilot_bp.route('/<business_id>/actions/<action_id>/approve', methods=['PUT'])
@jwt_required()
def approve_action(business_id, action_id):
    """Approve an action"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    action = Action.query.filter_by(id=action_id, business_id=business_id).first()
    
    if not action:
        return jsonify({'error': 'Action not found'}), 404
    
    action = ActionEngineService.approve_action(action_id, user_id)
    
    return jsonify({
        'id': action.id,
        'status': action.status,
        'approval_date': action.approval_date.isoformat()
    }), 200


@copilot_bp.route('/<business_id>/actions/<action_id>/execute', methods=['PUT'])
@jwt_required()
def execute_action(business_id, action_id):
    """Execute an action"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    action = Action.query.filter_by(id=action_id, business_id=business_id).first()
    
    if not action:
        return jsonify({'error': 'Action not found'}), 404
    
    action = ActionEngineService.execute_action(action_id)
    
    return jsonify({
        'id': action.id,
        'status': action.status,
        'execution_date': action.execution_date.isoformat()
    }), 200


