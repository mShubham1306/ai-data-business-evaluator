"""Synthetic UAE SME Dataset Generator (500 Businesses x 36 Months)
Enforces realistic causal flow: Marketing Spend -> Leads -> Qualified Leads -> Customers -> Revenue -> Costs -> Net Profit
Emirate distribution: Dubai 50%, Abu Dhabi 30%, Sharjah 10%, Northern Emirates 10%
SME Industry breakdown: Retail/Trade 70%, Services 20%, Manufacturing/Construction 10%
"""

import os
import math
import numpy as np
import pandas as pd

def generate_dataset(output_dir='data', num_businesses=500, num_months=36):
    os.makedirs(output_dir, exist_ok=True)
    np.random.seed(42)

    print(f"Generating Synthetic UAE SME Dataset ({num_businesses} businesses x {num_months} months)...")

    # 1. Macro Market Data (uae_market.csv)
    months = [pd.Timestamp("2023-01-01") + pd.DateOffset(months=m) for m in range(num_months)]
    month_strs = [m.strftime("%Y-%m") for m in months]

    market_rows = []
    base_oil = 78.0
    for idx, m_str in enumerate(month_strs):
        oil_price = base_oil + 10 * math.sin(2 * math.pi * idx / 12) + np.random.normal(0, 3)
        gdp_growth = 3.2 + 0.5 * math.sin(2 * math.pi * idx / 12) + np.random.normal(0, 0.2)
        inflation = 3.8 + np.random.normal(0, 0.15)
        market_rows.append({
            "month": m_str,
            "GDP_growth": round(max(0.5, gdp_growth), 2),
            "inflation_rate": round(max(1.0, inflation), 2),
            "oil_price": round(max(40.0, oil_price), 2),
            "usd_aed_rate": 3.6725
        })
    df_market = pd.DataFrame(market_rows)
    df_market.to_csv(os.path.join(output_dir, "uae_market.csv"), index=False)
    print(" -> uae_market.csv created.")

    # 2. Businesses Profiles
    industries = ["Retail", "Services", "Manufacturing"]
    ind_probs = [0.70, 0.20, 0.10]

    emirates = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"]
    em_probs = [0.50, 0.30, 0.10, 0.05, 0.05]

    businesses = []
    for i in range(1, num_businesses + 1):
        biz_id = f"UAE_{i:03d}"
        ind = np.random.choice(industries, p=ind_probs)
        em = np.random.choice(emirates, p=em_probs)
        emp_count = int(np.random.choice([np.random.randint(2, 10), np.random.randint(11, 50), np.random.randint(51, 200)], p=[0.75, 0.20, 0.05]))
        
        # Base scale multiplier depending on size
        scale = max(0.5, emp_count / 10.0)
        businesses.append({
            "business_id": biz_id,
            "industry": ind,
            "emirate": em,
            "employees": emp_count,
            "scale": scale
        })

    # 3. Monthly Business Records (business_monthly.csv) & Sub-Tables
    biz_monthly_rows = []
    marketing_rows = []
    expense_rows = []
    pipeline_rows = []
    outcome_rows = []
    scenario_rows = []
    customer_rows = []
    product_rows = []

    mkt_channels = ["Google Search", "Meta Ads", "LinkedIn B2B", "Email Marketing"]

    cust_id_counter = 1000

    for biz in businesses:
        biz_id = biz["business_id"]
        ind = biz["industry"]
        em = biz["emirate"]
        emp = biz["employees"]
        scale = biz["scale"]

        # Generate products for business
        num_prods = np.random.randint(2, 5)
        for p_idx in range(1, num_prods + 1):
            p_id = f"P_{biz_id}_{p_idx}"
            price = int(np.random.uniform(200, 5000) * scale)
            cost = int(price * np.random.uniform(0.35, 0.70))
            product_rows.append({
                "business_id": biz_id,
                "product_id": p_id,
                "category": ind,
                "price": price,
                "cost": cost,
                "launch_date": "2022-01-01"
            })

        # Initial cash balance
        cash_balance = int(np.random.uniform(80000, 300000) * scale)

        for m_idx, m_str in enumerate(month_strs):
            seasonality = 1.0 + 0.18 * math.sin(2 * math.pi * (m_idx - 3) / 12)  # Peak in Q4 (Dec/Nov)
            trend = 1.0 + (m_idx * 0.008)  # Gradual MoM growth

            # Causal Flow 1: Marketing Spend -> Leads
            base_mkt_spend = int(np.random.uniform(4000, 20000) * scale * seasonality)
            
            # Channel breakdown
            channel_leads_total = 0
            for ch in mkt_channels:
                ch_spend = int(base_mkt_spend * np.random.uniform(0.15, 0.40))
                cpl = np.random.uniform(80, 250)
                ch_leads = max(0, int(ch_spend / cpl))
                ch_clicks = ch_leads * np.random.randint(8, 20)
                ch_impressions = ch_clicks * np.random.randint(15, 50)
                channel_leads_total += ch_leads
                
                marketing_rows.append({
                    "business_id": biz_id,
                    "month": m_str,
                    "campaign_id": f"MKT_{biz_id}_{m_idx}_{ch[:3].upper()}",
                    "channel": ch,
                    "impressions": ch_impressions,
                    "clicks": ch_clicks,
                    "leads": ch_leads,
                    "spend": ch_spend,
                    "cost_per_lead": round(ch_spend / max(1, ch_leads), 2)
                })

            leads = max(10, channel_leads_total)
            qual_leads = int(leads * np.random.uniform(0.30, 0.50))
            
            # Causal Flow 2: Conversion -> Customers
            conv_rate = np.random.uniform(0.015, 0.04)  # 1.5% - 4.0%
            new_customers = max(1, int(leads * conv_rate))
            repeat_cust = int(new_customers * np.random.uniform(0.20, 0.45))
            total_customers = new_customers + repeat_cust
            
            cac = round(base_mkt_spend / max(1, new_customers), 2)
            churn_rate = round(np.random.uniform(2.0, 8.0), 2)

            # Causal Flow 3: Customers -> Revenue & Order Value
            avg_order_val = round(np.random.uniform(1500, 6000) * scale, 2)
            sales_rev = int(total_customers * avg_order_val * trend * seasonality)

            # Causal Flow 4: Costs & Profit
            op_cost = int(sales_rev * np.random.uniform(0.55, 0.78)) + base_mkt_spend
            gross_prof = sales_rev - op_cost
            net_prof = int(gross_prof * np.random.uniform(0.75, 0.90))

            cash_balance += net_prof

            # Add expense breakdown
            expense_rows.append({"business_id": biz_id, "month": m_str, "category": "Rent", "amount": int(op_cost * 0.25)})
            expense_rows.append({"business_id": biz_id, "month": m_str, "category": "Salaries", "amount": int(op_cost * 0.45)})
            expense_rows.append({"business_id": biz_id, "month": m_str, "category": "Utilities & Tech", "amount": int(op_cost * 0.15)})
            expense_rows.append({"business_id": biz_id, "month": m_str, "category": "Marketing", "amount": base_mkt_spend})

            # Pipeline metrics
            opps = int(leads * 0.40)
            props = int(opps * 0.50)
            deals = new_customers
            pipe_val = int(opps * avg_order_val)
            pipeline_rows.append({
                "business_id": biz_id,
                "month": m_str,
                "leads_in": leads,
                "opportunities": opps,
                "proposals_sent": props,
                "deals_closed": deals,
                "pipeline_value": pipe_val
            })

            # Target vs Actual Outcomes
            target_rev = int(sales_rev * np.random.uniform(0.90, 1.10))
            target_prof = int(net_prof * np.random.uniform(0.85, 1.15))
            variance = round(((sales_rev - target_rev) / max(1, target_rev)) * 100, 2)
            outcome_rows.append({
                "business_id": biz_id,
                "month": m_str,
                "target_revenue": target_rev,
                "actual_revenue": sales_rev,
                "target_profit": target_prof,
                "actual_profit": net_prof,
                "variance": variance
            })

            # Main Business Monthly Record
            biz_monthly_rows.append({
                "business_id": biz_id,
                "industry": ind,
                "emirate": em,
                "month": m_str,
                "employees": emp,
                "leads": leads,
                "qualified_leads": qual_leads,
                "customers": total_customers,
                "conversion_rate": round(conv_rate * 100, 2),
                "marketing_spend": base_mkt_spend,
                "sales_revenue": sales_rev,
                "operating_cost": op_cost,
                "gross_profit": gross_prof,
                "net_profit": net_prof,
                "avg_order_value": avg_order_val,
                "customer_acquisition_cost": cac,
                "repeat_customers": repeat_cust,
                "churn_rate": churn_rate,
                "website_visits": leads * np.random.randint(6, 12),
                "enquiries": int(leads * 0.6),
                "sales_calls": int(leads * 0.25),
                "deals_closed": deals,
                "cash_balance": cash_balance
            })

            # Generate sample customers
            for _ in range(min(2, new_customers)):
                cust_id_counter += 1
                customer_rows.append({
                    "business_id": biz_id,
                    "customer_id": f"CUST_{cust_id_counter}",
                    "signup_month": m_str,
                    "segment": np.random.choice(["Standard", "VIP", "Basic"], p=[0.70, 0.20, 0.10]),
                    "lifetime_value": int(avg_order_val * np.random.uniform(1.5, 4.0)),
                    "churned": "No",
                    "churn_month": "",
                    "purchases": np.random.randint(1, 10)
                })

        # What-if Scenarios per business
        scenario_rows.append({
            "business_id": biz_id,
            "scenario_id": f"SCEN_{biz_id}_A",
            "description": "+25% Ad Spend Growth Vector",
            "impact_revenue": 18.5,
            "impact_profit": 14.2,
            "notes": "Assumes constant lead CAC efficiency."
        })
        scenario_rows.append({
            "business_id": biz_id,
            "scenario_id": f"SCEN_{biz_id}_B",
            "description": "Premium Price Adjustment (+10%)",
            "impact_revenue": 12.0,
            "impact_profit": 22.0,
            "notes": "Assumes price elasticity of -0.30."
        })

    # Save to CSV files
    pd.DataFrame(biz_monthly_rows).to_csv(os.path.join(output_dir, "business_monthly.csv"), index=False)
    pd.DataFrame(marketing_rows).to_csv(os.path.join(output_dir, "marketing_monthly.csv"), index=False)
    pd.DataFrame(customer_rows).to_csv(os.path.join(output_dir, "customers.csv"), index=False)
    pd.DataFrame(product_rows).to_csv(os.path.join(output_dir, "products.csv"), index=False)
    pd.DataFrame(expense_rows).to_csv(os.path.join(output_dir, "expenses.csv"), index=False)
    pd.DataFrame(pipeline_rows).to_csv(os.path.join(output_dir, "sales_pipeline.csv"), index=False)
    pd.DataFrame(outcome_rows).to_csv(os.path.join(output_dir, "outcomes.csv"), index=False)
    pd.DataFrame(scenario_rows).to_csv(os.path.join(output_dir, "scenarios.csv"), index=False)

    print(f"Successfully generated 9 CSV dataset files ({len(biz_monthly_rows)} records in business_monthly.csv) in '{output_dir}/'")

if __name__ == '__main__':
    generate_dataset()
