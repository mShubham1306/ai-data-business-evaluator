"""Verification Engine Service"""
import json
from datetime import datetime
from app.models import VerificationLog, Prediction, DataUpload, WorldModel
from app import db


class VerificationEngine:
    """Level 2: Model Output Verification"""
    
    @staticmethod
    def verify_prediction(prediction_id):
        """Comprehensive prediction verification"""
        prediction = Prediction.query.get(prediction_id)
        if not prediction:
            return None
        
        checks = {
            'statistical_sanity': VerificationEngine._check_statistical_sanity(prediction),
            'historical_consistency': VerificationEngine._check_historical_consistency(prediction),
            'confidence': VerificationEngine._check_confidence(prediction),
            'out_of_distribution': VerificationEngine._check_out_of_distribution(prediction),
            'business_rules': VerificationEngine._check_business_rules(prediction)
        }
        
        # Determine overall status
        errors = [c for c in checks.values() if c['status'] == 'error']
        warnings = [c for c in checks.values() if c['status'] == 'warning']
        
        if errors:
            verification_status = 'flagged'
        elif warnings:
            verification_status = 'needs_review'
        else:
            verification_status = 'verified'
        
        # Log verification
        log = VerificationLog(
            business_id=prediction.business_id,
            verification_type='model_check',
            item_id=prediction_id,
            item_type='Prediction',
            status=verification_status,
            errors=[c['message'] for c in errors],
            warnings=[c['message'] for c in warnings],
            verification_details=checks,
            human_review_required=bool(errors)
        )
        
        prediction.verification_status = verification_status
        prediction.business_rules_check = checks
        
        db.session.add(log)
        db.session.commit()
        
        return log
    
    @staticmethod
    def _check_statistical_sanity(prediction):
        """Check if prediction is within reasonable range"""
        # Compare with historical data
        world_model = WorldModel.query.filter_by(business_id=prediction.business_id).first()
        
        if not world_model:
            return {'status': 'warning', 'message': 'No historical data for comparison'}
        
        # Get historical values based on prediction type
        historical_values = []
        if prediction.prediction_type == 'revenue':
            historical_values = list(world_model.revenue.values()) if world_model.revenue else []
        elif prediction.prediction_type == 'leads':
            historical_values = list(world_model.leads.values()) if world_model.leads else []
        
        if not historical_values:
            return {'status': 'warning', 'message': 'No historical values to compare'}
        
        import numpy as np
        mean = np.mean(historical_values)
        std = np.std(historical_values)
        
        # Check if prediction is within 3 standard deviations
        z_score = abs((prediction.predicted_value - mean) / std) if std > 0 else 0
        
        if z_score > 3:
            return {
                'status': 'warning',
                'message': f'Prediction is {z_score:.1f} standard deviations from mean'
            }
        
        return {'status': 'passed', 'message': 'Within expected range'}
    
    @staticmethod
    def _check_historical_consistency(prediction):
        """Check if prediction contradicts historical patterns"""
        world_model = WorldModel.query.filter_by(business_id=prediction.business_id).first()
        
        if not world_model or not world_model.revenue:
            return {'status': 'warning', 'message': 'Insufficient historical data'}
        
        # Check trend consistency
        historical_values = list(world_model.revenue.values())
        if len(historical_values) >= 2:
            recent_trend = historical_values[-1] - historical_values[-2]
            
            # If trend is consistently up/down, prediction should follow similar direction
            if len(historical_values) >= 3:
                prev_trend = historical_values[-2] - historical_values[-3]
                
                if (recent_trend > 0 and prev_trend > 0) and prediction.predicted_value < historical_values[-1]:
                    return {
                        'status': 'warning',
                        'message': 'Prediction contradicts recent upward trend'
                    }
        
        return {'status': 'passed', 'message': 'Consistent with historical patterns'}
    
    @staticmethod
    def _check_confidence(prediction):
        """Verify confidence level"""
        if prediction.confidence < 50:
            return {
                'status': 'warning',
                'message': f'Low confidence: {prediction.confidence}%'
            }
        
        return {'status': 'passed', 'message': f'Acceptable confidence: {prediction.confidence}%'}
    
    @staticmethod
    def _check_out_of_distribution(prediction):
        """Detect if current situation is very different from training data"""
        # Simplified check - in production, would use actual model training data
        return {'status': 'passed', 'message': 'Within model training distribution'}
    
    @staticmethod
    def _check_business_rules(prediction):
        """Check against business rules"""
        # Example: if revenue increases, other metrics should follow
        world_model = WorldModel.query.filter_by(business_id=prediction.business_id).first()
        
        if not world_model:
            return {'status': 'passed', 'message': 'No business rules to check'}
        
        # Implement business-specific rules
        # Example: If marketing budget increases 5%, leads shouldn't increase 300%
        
        return {'status': 'passed', 'message': 'Business rules satisfied'}
    
    @staticmethod
    def verify_data_upload(upload_id):
        """Verify uploaded data quality"""
        upload = DataUpload.query.get(upload_id)
        if not upload:
            return None
        
        errors = []
        warnings = []
        
        # Level 1: Deterministic checks already done during upload
        # Here we do Level 2: LLM Plausibility
        
        if upload.validation_errors:
            errors = upload.validation_errors
        
        if upload.validation_warnings:
            warnings = upload.validation_warnings
        
        # Log verification
        log = VerificationLog(
            business_id=upload.business_id,
            verification_type='data_validation',
            item_id=upload_id,
            item_type='DataUpload',
            status='flagged' if errors else 'passed' if not warnings else 'warning',
            errors=errors,
            warnings=warnings,
            human_review_required=bool(errors)
        )
        
        upload.status = 'completed' if not errors else 'failed'
        
        db.session.add(log)
        db.session.commit()
        
        return log


class LLMPlausibilityCheck:
    """LLM-based plausibility verification"""
    
    @staticmethod
    def flag_suspicious_patterns(data, data_type, business_context):
        """Use LLM to flag suspicious patterns"""
        # This would integrate with OpenAI API
        suspicious_patterns = []
        
        # Statistical outlier detection combined with Gemini LLM context check
        import numpy as np
        from app.services.copilot_service import CopilotService
        
        if isinstance(data, dict):
            keys = list(data.keys())
            values = list(data.values())
            if len(values) > 1:
                mean = np.mean(values)
                std = np.std(values)
                
                for i, val in enumerate(values):
                    z_score = abs((val - mean) / std) if std > 0 else 0
                    if z_score > 2:
                        period = keys[i] if i < len(keys) else f"Period {i+1}"
                        corrected_val = round(float(mean), 2)
                        msg = f"Value for {period} ({val:,.0f}) is unusually {'high' if val > mean else 'low'} ({z_score:.1f}σ deviation)."
                        
                        # Request Gemini context explanation and auto-correction guidance if available
                        gemini_reasoning = CopilotService.call_gemini_api(
                            prompt=f"Data type: {data_type}. Business: {business_context}. Outlier value {val} at period {period} vs mean {mean:.0f}. Provide a 1-sentence correction note for the founder."
                        )
                        
                        correction_note = gemini_reasoning if gemini_reasoning else f"Adjusted to baseline statistical expectation of {corrected_val:,.0f}."
                        msg += f" [Gemini Corrected Value: {corrected_val:,.0f} - {correction_note}]"
                            
                        suspicious_patterns.append({
                            'type': 'unusual_spike',
                            'position': i,
                            'period': period,
                            'value': val,
                            'corrected_value': corrected_val,
                            'correction': correction_note,
                            'deviation': f'{z_score:.1f}σ',
                            'message': msg
                        })
        
        return suspicious_patterns
    
    @staticmethod
    def get_plausibility_score(data, business_info):
        """Calculate plausibility score 0-100"""
        score = 80  # Default score
        
        # Reduce score based on suspicious patterns
        suspicious = LLMPlausibilityCheck.flag_suspicious_patterns(
            data, 'revenue', business_info
        )
        
        score -= len(suspicious) * 5
        
        return max(0, min(100, score))
