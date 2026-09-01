"""NOVA ML Model Training Pipeline
Trains production-grade ML models using the 500x36 Synthetic UAE SME Dataset:
1. Revenue & Profit Forecast Models (RandomForestRegressor + HistGradientBoostingRegressor)
2. Anomaly Detection Model (IsolationForest)
3. Health Score & Financial Stability Model
"""

import os
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_percentage_error, mean_squared_error

def train_nova_models(data_dir='data', models_dir='models'):
    os.makedirs(models_dir, exist_ok=True)
    print("=" * 60)
    print("NOVA ML Model Training Pipeline Initializing...")
    print("=" * 60)

    # 1. Load Data
    biz_monthly_path = os.path.join(data_dir, 'business_monthly.csv')
    uae_market_path = os.path.join(data_dir, 'uae_market.csv')

    if not os.path.exists(biz_monthly_path):
        print(f"Error: {biz_monthly_path} not found. Running dataset generator first...")
        from generate_uae_sme_dataset import generate_dataset
        generate_dataset(data_dir)

    df_biz = pd.read_csv(biz_monthly_path)
    df_market = pd.read_csv(uae_market_path)

    # Merge Market Context
    df = pd.merge(df_biz, df_market, on='month', how='left')
    df['month_dt'] = pd.to_datetime(df['month'])
    df = df.sort_values(['business_id', 'month_dt']).reset_index(drop=True)

    print(f"Loaded dataset: {len(df)} monthly business observations across {df['business_id'].nunique()} UAE SMEs.")

    # 2. Feature Engineering (Lags, MoM Growth, Ratios)
    df['lag_1_revenue'] = df.groupby('business_id')['sales_revenue'].shift(1)
    df['lag_2_revenue'] = df.groupby('business_id')['sales_revenue'].shift(2)
    df['lag_3_revenue'] = df.groupby('business_id')['sales_revenue'].shift(3)

    df['lag_1_profit'] = df.groupby('business_id')['net_profit'].shift(1)
    df['lag_1_leads'] = df.groupby('business_id')['leads'].shift(1)
    df['lag_1_spend'] = df.groupby('business_id')['marketing_spend'].shift(1)

    df['mom_rev_growth'] = (df['sales_revenue'] - df['lag_1_revenue']) / (df['lag_1_revenue'] + 1e-5)
    df['profit_margin'] = df['net_profit'] / (df['sales_revenue'] + 1e-5)
    df['lead_conv_ratio'] = df['deals_closed'] / (df['leads'] + 1e-5)

    # Drop early lag rows
    df_clean = df.dropna(subset=['lag_3_revenue', 'lag_1_profit']).copy()

    feature_cols = [
        'employees', 'leads', 'qualified_leads', 'customers', 'conversion_rate',
        'marketing_spend', 'operating_cost', 'avg_order_value', 'customer_acquisition_cost',
        'churn_rate', 'oil_price', 'GDP_growth', 'inflation_rate',
        'lag_1_revenue', 'lag_2_revenue', 'lag_3_revenue', 'lag_1_profit',
        'lag_1_leads', 'lag_1_spend', 'mom_rev_growth', 'profit_margin', 'lead_conv_ratio'
    ]

    X = df_clean[feature_cols]
    y_rev = df_clean['sales_revenue']
    y_prof = df_clean['net_profit']

    # Time-based Split: Months 1-30 Train, Months 31-36 Test (Temporal Order Preserved)
    unique_months = sorted(df_clean['month'].unique())
    split_idx = int(len(unique_months) * 0.82)
    cutoff_month = unique_months[split_idx]

    train_mask = df_clean['month'] <= cutoff_month
    test_mask = df_clean['month'] > cutoff_month

    X_train, X_test = X[train_mask], X[test_mask]
    y_rev_train, y_rev_test = y_rev[train_mask], y_rev[test_mask]
    y_prof_train, y_prof_test = y_prof[train_mask], y_prof[test_mask]

    print(f"Time-series Split: Training months <= {cutoff_month} ({len(X_train)} samples), Testing months > {cutoff_month} ({len(X_test)} samples).")

    # 3. Scale Features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. Model 1: Revenue Forecast Model (Random Forest Regressor)
    print("\n[1/3] Training Revenue Forecast Model (RandomForestRegressor)...")
    rev_model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
    rev_model.fit(X_train_scaled, y_rev_train)
    
    rev_pred = rev_model.predict(X_test_scaled)
    rev_r2 = r2_score(y_rev_test, rev_pred)
    rev_mape = mean_absolute_percentage_error(y_rev_test, rev_pred)
    print(f" -> Revenue Model Trained. Test R² Score = {rev_r2:.4f}, MAPE = {rev_mape:.4f}")

    # 5. Model 2: Profit Forecast Model (HistGradientBoosting)
    print("\n[2/3] Training Profit Forecast Model (HistGradientBoostingRegressor)...")
    prof_model = HistGradientBoostingRegressor(max_iter=100, random_state=42)
    prof_model.fit(X_train_scaled, y_prof_train)

    prof_pred = prof_model.predict(X_test_scaled)
    prof_r2 = r2_score(y_prof_test, prof_pred)
    print(f" -> Profit Model Trained. Test R² Score = {prof_r2:.4f}")

    # 6. Model 3: Anomaly Detector (IsolationForest)
    print("\n[3/3] Training Anomaly Detector (IsolationForest)...")
    anomaly_model = IsolationForest(contamination=0.03, random_state=42)
    anomaly_model.fit(X_train_scaled)
    anomalies_detected = (anomaly_model.predict(X_test_scaled) == -1).sum()
    print(f" -> Anomaly Detector Trained. Flagged {anomalies_detected} test anomalies.")

    # 7. Save Model Artifacts
    print("\nSaving trained model artifacts to 'models/'...")
    joblib.dump(rev_model, os.path.join(models_dir, 'revenue_forecast_model.joblib'))
    joblib.dump(prof_model, os.path.join(models_dir, 'profit_forecast_model.joblib'))
    joblib.dump(anomaly_model, os.path.join(models_dir, 'anomaly_detector.joblib'))
    joblib.dump(scaler, os.path.join(models_dir, 'feature_scaler.joblib'))
    joblib.dump(feature_cols, os.path.join(models_dir, 'feature_cols.joblib'))

    metrics = {
        'revenue_model': {'r2': float(rev_r2), 'mape': float(rev_mape)},
        'profit_model': {'r2': float(prof_r2)},
        'anomaly_model': {'test_anomalies_flagged': int(anomalies_detected)},
        'train_samples': int(len(X_train)),
        'test_samples': int(len(X_test)),
        'num_features': len(feature_cols)
    }

    with open(os.path.join(models_dir, 'model_metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=2)

    print("=" * 60)
    print("SUCCESS: NOVA ML Models Trained & Saved Successfully!")
    print("=" * 60)

if __name__ == '__main__':
    train_nova_models()
