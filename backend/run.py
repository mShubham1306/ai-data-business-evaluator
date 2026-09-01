#!/usr/bin/env python
"""NOVA Backend Application Entry Point"""
import os
from dotenv import load_dotenv
from app import create_app

# Load environment variables
load_dotenv()

# Create Flask app
app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    port = int(os.getenv('PORT', os.getenv('FLASK_PORT', 5000)))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    
    print(f"""
    ===========================================================
               NOVA - AI Business Analyst Backend               
                        Starting Server...                      
    ===========================================================
    
    Environment: {os.getenv('FLASK_ENV', 'development')}
    Host: 0.0.0.0
    Port: {port}
    Debug: {debug}
    
    Available Endpoints:
    
    Authentication:
      POST   /api/auth/register          - Register new user
      POST   /api/auth/login             - Login
      GET    /api/auth/me                - Get current user
      POST   /api/auth/refresh           - Refresh token
    
    Business Management:
      GET    /api/business/              - List businesses
      POST   /api/business/              - Create business
      GET    /api/business/<id>          - Get business details
      PUT    /api/business/<id>          - Update business
      DELETE /api/business/<id>          - Delete business
      GET    /api/business/<id>/world-model - Get world model
    
    Analytics:
      GET    /api/analytics/<id>/health-score      - Health score
      GET    /api/analytics/<id>/drivers           - Performance drivers
      GET    /api/analytics/<id>/anomalies         - Anomalies
    
    ML & Forecasting:
      GET    /api/ml/<id>/forecast/revenue         - Revenue forecast
      GET    /api/ml/<id>/predictions              - Get predictions
      POST   /api/ml/<id>/predictions              - Create prediction
      GET    /api/ml/<id>/segments                 - Customer segments
    
    Copilot & Scenarios:
      GET    /api/copilot/<id>/scenarios           - Get scenarios
      POST   /api/copilot/<id>/scenarios           - Create scenario
      GET    /api/copilot/<id>/opportunities       - Get opportunities
      POST   /api/copilot/<id>/opportunities/scan  - Scan for opportunities
      GET    /api/copilot/<id>/actions             - Get actions
      POST   /api/copilot/<id>/actions             - Generate action
    
    Data & Verification:
      GET    /api/verification/<id>/uploads        - Get uploads
      POST   /api/verification/<id>/upload         - Upload data
      GET    /api/verification/<id>/data-quality   - Data quality
      GET    /api/verification/<id>/system-health  - System health
    
    """)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
