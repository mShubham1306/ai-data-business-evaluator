"""Action Engine and Feedback Service"""
from datetime import datetime
from app.models import Action, Prediction
from app import db
import json


class ActionEngineService:
    """AI Action Generation and Execution"""
    
    @staticmethod
    def generate_action(business_id, recommendation_text, action_type):
        """Generate AI-powered action from recommendation"""
        
        action = Action(
            business_id=business_id,
            recommendation=recommendation_text,
            action_type=action_type,
            priority='high',
            status='pending'
        )
        
        # Generate specific content based on action type
        if action_type == 'campaign':
            action.campaign_content = ActionEngineService._generate_campaign(recommendation_text)
        elif action_type == 'email':
            action.email_content = ActionEngineService._generate_email(recommendation_text)
        elif action_type == 'whatsapp':
            action.whatsapp_message = ActionEngineService._generate_whatsapp(recommendation_text)
        elif action_type == 'sales_script':
            action.sales_script = ActionEngineService._generate_sales_script(recommendation_text)
        elif action_type == 'sop':
            action.sop = ActionEngineService._generate_sop(recommendation_text)
        
        db.session.add(action)
        db.session.commit()
        
        return action
    
    @staticmethod
    def _generate_campaign(recommendation):
        """Generate campaign content"""
        return {
            'name': 'New Campaign',
            'objective': recommendation,
            'channels': ['email', 'social', 'whatsapp'],
            'duration_days': 14,
            'target_audience': 'existing_customers',
            'content': f"Campaign focused on: {recommendation}",
            'budget': 5000
        }
    
    @staticmethod
    def _generate_email(recommendation):
        """Generate email content"""
        return f"""
        Subject: Exclusive Opportunity for You

        Hi [Customer Name],

        We've identified an exclusive opportunity tailored to your business:

        {recommendation}

        This could help you achieve your goals more efficiently.

        Ready to explore this?

        Best regards,
        NOVA Team
        """
    
    @staticmethod
    def _generate_whatsapp(recommendation):
        """Generate WhatsApp message"""
        return f"Hi! 👋 We found an opportunity for you: {recommendation}\n\nWant to learn more? 🚀"
    
    @staticmethod
    def _generate_sales_script(recommendation):
        """Generate sales script"""
        return f"""
        Opening:
        "Hi [Customer], I wanted to share something exciting we discovered about your business."

        Value Prop:
        "{recommendation}"

        Benefit:
        "This could help you increase revenue by 20-30%."

        Call to Action:
        "Would you like a quick 15-minute call to explore this?"
        """
    
    @staticmethod
    def _generate_sop(recommendation):
        """Generate Standard Operating Procedure"""
        return f"""
        STANDARD OPERATING PROCEDURE
        Subject: {recommendation}

        Step 1: Assessment
        - Review current state
        - Identify gaps
        - Gather requirements

        Step 2: Planning
        - Create timeline
        - Assign resources
        - Set KPIs

        Step 3: Execution
        - Implement changes
        - Monitor progress
        - Adjust as needed

        Step 4: Review
        - Measure results
        - Document learnings
        - Optimize
        """
    
    @staticmethod
    def approve_action(action_id, approved_by_user_id):
        """Approve an action for execution"""
        action = Action.query.get(action_id)
        if not action:
            return None
        
        action.status = 'approved'
        action.approval_date = datetime.utcnow()
        
        db.session.commit()
        
        return action
    
    @staticmethod
    def reject_action(action_id, rejection_reason):
        """Reject an action"""
        action = Action.query.get(action_id)
        if not action:
            return None
        
        action.status = 'rejected'
        
        db.session.commit()
        
        return action
    
    @staticmethod
    def execute_action(action_id):
        """Execute an approved action"""
        action = Action.query.get(action_id)
        if not action or action.status != 'approved':
            return None
        
        action.status = 'executed'
        action.execution_date = datetime.utcnow()
        
        db.session.commit()
        
        return action


class FeedbackEngineService:
    """Track outcomes and feedback for continuous learning"""
    
    @staticmethod
    def record_prediction_outcome(prediction_id, actual_value, outcome_notes=""):
        """Record actual outcome vs prediction"""
        prediction = Prediction.query.get(prediction_id)
        if not prediction:
            return None
        
        prediction.actual_value = actual_value
        prediction.is_outcome_tracked = True
        
        # Calculate error
        error = abs(prediction.predicted_value - actual_value)
        error_percentage = (error / actual_value * 100) if actual_value > 0 else 0
        
        prediction.updated_at = datetime.utcnow()
        
        # Log feedback
        feedback_log = {
            'prediction_id': prediction_id,
            'predicted': prediction.predicted_value,
            'actual': actual_value,
            'error': error,
            'error_percentage': error_percentage,
            'notes': outcome_notes,
            'recorded_at': datetime.utcnow().isoformat()
        }
        
        db.session.commit()
        
        return feedback_log
    
    @staticmethod
    def record_action_outcome(action_id, outcome_data):
        """Record actual outcome of executed action"""
        action = Action.query.get(action_id)
        if not action:
            return None
        
        action.outcome = outcome_data
        action.is_outcome_tracked = True
        action.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return action
    
    @staticmethod
    def calculate_model_drift(business_id):
        """Detect if model performance is degrading"""
        predictions = Prediction.query.filter_by(
            business_id=business_id,
            is_outcome_tracked=True
        ).all()
        
        if len(predictions) < 10:
            return {'drift_detected': False, 'reason': 'Insufficient outcome data'}
        
        # Calculate recent and older error rates
        recent_predictions = predictions[-5:]
        older_predictions = predictions[-20:-5]
        
        recent_error = sum(abs(p.predicted_value - p.actual_value) for p in recent_predictions) / len(recent_predictions)
        older_error = sum(abs(p.predicted_value - p.actual_value) for p in older_predictions) / len(older_predictions)
        
        # Detect drift if recent error is significantly higher
        drift_threshold = older_error * 1.3  # 30% increase
        drift_detected = recent_error > drift_threshold
        
        return {
            'drift_detected': drift_detected,
            'recent_error': recent_error,
            'older_error': older_error,
            'drift_percentage': ((recent_error - older_error) / older_error * 100) if older_error > 0 else 0
        }
    
    @staticmethod
    def get_system_performance_summary():
        """Get overall system health summary"""
        from app.models import Prediction, Action, SystemHealth
        
        # Count predictions with outcomes
        total_predictions = Prediction.query.count()
        tracked_predictions = Prediction.query.filter_by(is_outcome_tracked=True).count()
        
        # Calculate forecast accuracy
        accurate_predictions = 0
        if tracked_predictions > 0:
            predictions = Prediction.query.filter_by(is_outcome_tracked=True).all()
            for p in predictions:
                error_percentage = abs(p.predicted_value - p.actual_value) / p.actual_value * 100
                if error_percentage < 10:
                    accurate_predictions += 1
        
        forecast_accuracy = (accurate_predictions / tracked_predictions * 100) if tracked_predictions > 0 else 0
        
        # Count actions
        total_actions = Action.query.count()
        executed_actions = Action.query.filter_by(status='executed').count()
        
        return {
            'total_predictions': total_predictions,
            'tracked_predictions': tracked_predictions,
            'forecast_accuracy': forecast_accuracy,
            'total_actions': total_actions,
            'executed_actions': executed_actions,
            'execution_rate': (executed_actions / total_actions * 100) if total_actions > 0 else 0,
            'system_status': 'healthy'
        }
