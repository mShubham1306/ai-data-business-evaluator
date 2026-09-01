"""API Routes - Data Upload and Verification"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.models import Business, DataUpload
from app.services.data_service import DataProcessingService, DataValidationService
from app.services.verification_service import VerificationEngine, LLMPlausibilityCheck
from app import db
import os
import pandas as pd

verification_bp = Blueprint('verification', __name__, url_prefix='/api/verification')

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'pdf'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@verification_bp.route('/<business_id>/uploads', methods=['GET'])
@jwt_required()
def get_uploads(business_id):
    """Get data uploads for business"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    uploads = DataUpload.query.filter_by(business_id=business_id).all()
    
    return jsonify({
        'uploads': [{
            'id': u.id,
            'file_name': u.file_name,
            'file_type': u.file_type,
            'data_type': u.data_type,
            'status': u.status,
            'rows_count': u.rows_count,
            'created_at': u.created_at.isoformat()
        } for u in uploads]
    }), 200


@verification_bp.route('/<business_id>/upload', methods=['POST'])
@jwt_required()
def upload_data(business_id):
    """Upload business data"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    # Check if file is present
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': f'File type not allowed. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
    
    # Get data type from form
    data_type = request.form.get('data_type', 'general')
    
    # Save file
    filename = secure_filename(file.filename)
    file_ext = filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{business_id}_{int(__import__('time').time())}.{file_ext}"
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
    
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
    file.save(file_path)
    
    # Create upload record
    upload = DataUpload(
        user_id=user_id,
        business_id=business_id,
        file_name=filename,
        file_path=file_path,
        file_type=file_ext,
        file_size=os.path.getsize(file_path),
        data_type=data_type,
        status='processing'
    )
    
    db.session.add(upload)
    db.session.commit()
    
    # Process file
    try:
        df, errors, warnings, features = DataProcessingService.process_upload(
            file_path, file_ext, data_type, business_id
        )
        
        if errors:
            upload.status = 'failed'
            upload.validation_errors = errors
            db.session.commit()
            
            return jsonify({
                'error': 'Data validation failed',
                'errors': errors
            }), 400
        
        # Store processed data
        upload.rows_count = len(df)
        upload.validation_warnings = warnings
        upload.processed_data = features
        
        # Check plausibility with LLM
        plausibility_flags = LLMPlausibilityCheck.flag_suspicious_patterns(
            df.to_dict(), data_type, {'industry': business.industry}
        )
        
        if plausibility_flags:
            upload.validation_warnings.extend([f['message'] for f in plausibility_flags])
        
        # Update world model
        data_dict = df.to_dict(orient='list')
        DataProcessingService.update_world_model(business_id, data_type, data_dict)
        
        # Calculate completeness
        completeness = DataProcessingService.calculate_completeness(business_id)
        
        upload.status = 'completed'
        
        # Verify upload
        VerificationEngine.verify_data_upload(upload.id)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Data uploaded successfully',
            'upload': {
                'id': upload.id,
                'file_name': upload.file_name,
                'rows_count': upload.rows_count,
                'status': upload.status,
                'warnings': upload.validation_warnings,
                'data_completeness': completeness
            }
        }), 201
    
    except Exception as e:
        upload.status = 'failed'
        upload.validation_errors = [str(e)]
        db.session.commit()
        
        return jsonify({
            'error': 'Failed to process file',
            'message': str(e)
        }), 500


@verification_bp.route('/<business_id>/uploads/<upload_id>', methods=['GET'])
@jwt_required()
def get_upload_details(business_id, upload_id):
    """Get upload details"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    upload = DataUpload.query.filter_by(id=upload_id, business_id=business_id).first()
    
    if not upload:
        return jsonify({'error': 'Upload not found'}), 404
    
    return jsonify({
        'id': upload.id,
        'file_name': upload.file_name,
        'file_type': upload.file_type,
        'data_type': upload.data_type,
        'status': upload.status,
        'rows_count': upload.rows_count,
        'validation_errors': upload.validation_errors,
        'validation_warnings': upload.validation_warnings,
        'processed_data': upload.processed_data,
        'created_at': upload.created_at.isoformat()
    }), 200


@verification_bp.route('/<business_id>/data-quality', methods=['GET'])
@jwt_required()
def get_data_quality(business_id):
    """Get data quality assessment"""
    user_id = get_jwt_identity()
    business = Business.query.filter_by(id=business_id, user_id=user_id).first()
    
    if not business:
        return jsonify({'error': 'Business not found'}), 404
    
    from app.models import WorldModel
    
    world_model = WorldModel.query.filter_by(business_id=business_id).first()
    
    if not world_model:
        return jsonify({
            'data_completeness': 0,
            'data_quality_score': 0,
            'assessment': 'No data available'
        }), 200
    
    return jsonify({
        'data_completeness': world_model.data_completeness,
        'data_quality_score': world_model.data_quality_score,
        'assessment': 'Good' if world_model.data_quality_score >= 70 else 'Fair' if world_model.data_quality_score >= 50 else 'Needs Improvement'
    }), 200
