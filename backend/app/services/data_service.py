"""Data Processing and Validation Service"""
import pandas as pd
import numpy as np
from datetime import datetime
from app.models import DataUpload, WorldModel, VerificationLog
from app import db
import json


class DataValidationService:
    """Level 1: Deterministic Validation"""
    
    @staticmethod
    def validate_data(df, data_type):
        """Validate data for obvious errors"""
        errors = []
        warnings = []
        
        # Check for empty dataframe
        if df.empty:
            errors.append("Data frame is empty")
            return errors, warnings
        
        # Revenue/Finance validation
        if data_type in ['revenue', 'expenses', 'profit', 'costs']:
            # Check for negative values (except costs which can be negative profit)
            if data_type != 'costs':
                negative_rows = df[df.iloc[:, -1] < 0]
                if not negative_rows.empty:
                    errors.append(f"Found {len(negative_rows)} rows with negative {data_type}")
        
        # Check for invalid dates
        if 'date' in df.columns or 'period' in df.columns:
            date_col = 'date' if 'date' in df.columns else 'period'
            try:
                pd.to_datetime(df[date_col])
            except:
                errors.append(f"Invalid dates in {date_col} column")
        
        # Check for duplicates
        duplicates = df.duplicated().sum()
        if duplicates > 0:
            warnings.append(f"Found {duplicates} duplicate rows")
        
        # Check for missing required columns
        if len(df.columns) < 2:
            errors.append("Data must have at least 2 columns")
        
        # Check for data types
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            errors.append("No numeric columns found")
        
        # Check for invalid currency/percentage
        for col in df.columns:
            if 'percentage' in col.lower() or 'rate' in col.lower():
                if df[col].dtype in [np.float64, np.int64]:
                    if (df[col] < 0).any() or (df[col] > 100).any():
                        warnings.append(f"Column {col} has values outside 0-100 range")
        
        return errors, warnings
    
    @staticmethod
    def clean_data(df):
        """Clean and normalize data"""
        # Remove completely empty columns
        df = df.dropna(axis=1, how='all')
        
        # Fill missing values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
        
        # Normalize column names
        df.columns = [col.lower().replace(' ', '_') for col in df.columns]
        
        return df
    
    @staticmethod
    def extract_features(df, data_type):
        """Extract key features from data"""
        features = {
            'rows_count': len(df),
            'columns': list(df.columns),
            'data_types': df.dtypes.to_dict(),
            'missing_values': df.isnull().sum().to_dict(),
            'numeric_stats': df.describe().to_dict()
        }
        
        # Calculate trends
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            last_col = numeric_cols[-1]
            if len(df) > 1:
                trend = df[last_col].iloc[-1] - df[last_col].iloc[-2]
                features['trend'] = 'up' if trend > 0 else 'down' if trend < 0 else 'stable'
                features['trend_value'] = float(trend)
        
        return features


class DataProcessingService:
    """Data ingestion and processing"""
    
    @staticmethod
    def process_upload(file_path, file_type, data_type, business_id):
        """Process uploaded file"""
        try:
            # Read file based on type
            if file_type == 'csv':
                df = pd.read_csv(file_path)
            elif file_type in ['xlsx', 'xls']:
                df = pd.read_excel(file_path)
            elif file_type == 'pdf':
                # For PDF, would use PyPDF2 to extract tables
                import PyPDF2
                df = None  # Simplified for now
            else:
                return None, ["Unsupported file type"]
            
            # Validate
            errors, warnings = DataValidationService.validate_data(df, data_type)
            if errors:
                return None, errors
            
            # Clean
            df = DataValidationService.clean_data(df)
            
            # Extract features
            features = DataValidationService.extract_features(df, data_type)
            
            return df, errors, warnings, features
        
        except Exception as e:
            return None, [str(e)]
    
    @staticmethod
    def update_world_model(business_id, data_type, data):
        """Update NOVA World Model with processed data"""
        world_model = WorldModel.query.filter_by(business_id=business_id).first()
        if not world_model:
            world_model = WorldModel(business_id=business_id)
            db.session.add(world_model)
        
        # Map data to world model fields
        if data_type == 'revenue':
            world_model.revenue = data
        elif data_type == 'expenses' or data_type == 'costs':
            world_model.costs = data
        elif data_type == 'profit':
            world_model.profit = data
        elif data_type == 'customers':
            world_model.customers = data
        elif data_type == 'leads':
            world_model.leads = data
        # ... add more mappings
        
        world_model.last_updated_at = datetime.utcnow()
        db.session.commit()
        
        # Trigger ML Model Retraining Pipeline on Current Input Data
        try:
            from app.services.analytics_service import MLService
            MLService.retrain_models_on_user_input(business_id)
        except Exception as e:
            print(f"[ML Retraining Trigger Error]: {e}")
        
        return world_model
    
    @staticmethod
    def calculate_completeness(business_id):
        """Calculate data completeness percentage"""
        world_model = WorldModel.query.filter_by(business_id=business_id).first()
        if not world_model:
            return 0
        
        fields = [
            world_model.revenue,
            world_model.profit,
            world_model.costs,
            world_model.customers,
            world_model.leads
        ]
        
        filled = sum(1 for f in fields if f and len(f) > 0)
        completeness = (filled / len(fields)) * 100 if fields else 0
        
        world_model.data_completeness = completeness
        db.session.commit()
        
        return completeness
