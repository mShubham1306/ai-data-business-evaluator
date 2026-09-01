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
            except Exception as e:
                errors.append(f"Invalid dates in {date_col} column: {str(e)}")
        
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
        # Read file based on type
            if file_type == 'csv':
                df = pd.read_csv(file_path)
            elif file_type in ['xlsx', 'xls']:
                df = pd.read_excel(file_path)
            elif file_type == 'pdf':
                df = DataProcessingService.parse_pdf_to_dataframe(file_path, data_type)
            else:
                return None, ["Unsupported file type: " + file_type], [], {}

            if df is None or df.empty:
                return None, ["Could not extract tabular data from this file. Please check it has readable rows and columns."], [], {}

            # Validate
            errors, warnings = DataValidationService.validate_data(df, data_type)
            if errors:
                return None, errors, warnings, {}

            # Clean
            df = DataValidationService.clean_data(df)

            # Extract features
            features = DataValidationService.extract_features(df, data_type)

            return df, errors, warnings, features

        except Exception as e:
            return None, [f"File processing error: {str(e)}"], [], {}

    @staticmethod
    def parse_pdf_to_dataframe(file_path, data_type):
        """Parse text and tables from PDF file into structured DataFrame"""
        import re
        extracted_text = ""
        
        # 1. Try PyPDF2 / pypdf
        try:
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                for page in reader.pages:
                    txt = page.extract_text()
                    if txt:
                        extracted_text += txt + "\n"
            except ImportError:
                import PyPDF2
                reader = PyPDF2.PdfReader(file_path)
                for page in reader.pages:
                    txt = page.extract_text()
                    if txt:
                        extracted_text += txt + "\n"
        except Exception as e:
            print(f"[PDF Reader Error]: {e}")
            
        rows = []
        months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
        
        lines = extracted_text.split('\n')
        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue
            
            # Match lines with month/date and numeric amount
            # e.g., "2024-01, 150000" or "Jan 2024: 120000" or "Month 1 - 45000"
            numbers = re.findall(r'[\$€£]?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)', line_clean)
            has_month = any(m in line_clean.lower() for m in months) or re.search(r'\d{4}[-/]\d{2}', line_clean) or 'month' in line_clean.lower()
            
            if numbers and (has_month or len(numbers) >= 2):
                # Clean numeric values
                clean_nums = [float(n.replace(',', '')) for n in numbers if n.replace(',', '').replace('.', '').isdigit()]
                if clean_nums:
                    # Find date / period string
                    period_match = re.search(r'([A-Za-z]{3}\s*\d{2,4}|\d{4}[-/]\d{2}|Month\s*\d+)', line_clean, re.IGNORECASE)
                    period_str = period_match.group(0) if period_match else f"Period_{len(rows)+1}"
                    rows.append({'period': period_str, data_type: clean_nums[-1]})
        
        # Fallback: if line parsing didn't find rows, extract all numbers sequentially
        if not rows:
            all_numbers = re.findall(r'[\$€£]?\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]+)?|[0-9]{4,}(?:\.[0-9]+)?)', extracted_text)
            clean_nums = [float(n.replace(',', '')) for n in all_numbers if float(n.replace(',', '')) > 0]
            for idx, num in enumerate(clean_nums[:36]):  # Max 36 periods
                rows.append({'period': f'Month_{idx+1}', data_type: num})
                
        if rows:
            return pd.DataFrame(rows)
        return None

    
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
