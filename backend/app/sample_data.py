"""Preloaded realistic UAE SME dataset generator for NOVA Demo"""

DEFAULT_UAE_BUSINESSES = [
    {
        "name": "Apex Tech Solutions FZ-LLC",
        "industry": "Technology / B2B SaaS",
        "country": "United Arab Emirates",
        "currency": "USD",
        "size": "Medium",
        "founded_year": 2021,
        "description": "B2B SaaS provider delivering Cloud ERP & Workflow Automation for enterprise logistics across GCC.",
        "goals": {
            "target_annual_revenue": 5000000,
            "target_margin": 35,
            "target_new_clients_monthly": 15
        },
        "world_model": {
            "revenue": {
                "2025-01": 245000,
                "2025-02": 258000,
                "2025-03": 262000,
                "2025-04": 275000,
                "2025-05": 289000,
                "2025-06": 310000,
                "2025-07": 305000,
                "2025-08": 328000,
                "2025-09": 340000,
                "2025-10": 365000,
                "2025-11": 390000,
                "2025-12": 420000,
                "2026-01": 415000,
                "2026-02": 438000,
                "2026-03": 450000,
                "2026-04": 472000,
                "2026-05": 490000,
                "2026-06": 515000,
                "2026-07": 530000,
                "2026-08": 560000
            },
            "costs": {
                "2025-01": 180000,
                "2025-02": 185000,
                "2025-03": 190000,
                "2025-04": 195000,
                "2025-05": 200000,
                "2025-06": 210000,
                "2025-07": 215000,
                "2025-08": 220000,
                "2025-09": 230000,
                "2025-10": 240000,
                "2025-11": 250000,
                "2025-12": 265000,
                "2026-01": 270000,
                "2026-02": 275000,
                "2026-03": 280000,
                "2026-04": 290000,
                "2026-05": 300000,
                "2026-06": 310000,
                "2026-07": 320000,
                "2026-08": 335000
            },
            "profit": {
                "2025-01": 65000,
                "2025-02": 73000,
                "2025-03": 72000,
                "2025-04": 80000,
                "2025-05": 89000,
                "2025-06": 100000,
                "2025-07": 90000,
                "2025-08": 108000,
                "2025-09": 110000,
                "2025-10": 125000,
                "2025-11": 140000,
                "2025-12": 155000,
                "2026-01": 145000,
                "2026-02": 163000,
                "2026-03": 170000,
                "2026-04": 182000,
                "2026-05": 190000,
                "2026-06": 205000,
                "2026-07": 210000,
                "2026-08": 225000
            },
            "leads": {
                "2026-03": 180,
                "2026-04": 195,
                "2026-05": 210,
                "2026-06": 230,
                "2026-07": 245,
                "2026-08": 260
            },
            "customers": {
                "2026-03": 42,
                "2026-04": 46,
                "2026-05": 49,
                "2026-06": 55,
                "2026-07": 59,
                "2026-08": 64
            },
            "products": [
                {
                    "id": "prod_1",
                    "name": "Enterprise ERP Suite",
                    "price_aed": 35000,
                    "cost_aed": 12000,
                    "margin": 65.7,
                    "monthly_subscribers": 12
                },
                {
                    "id": "prod_2",
                    "name": "Automation Add-on Pack",
                    "price_aed": 8500,
                    "cost_aed": 1800,
                    "margin": 78.8,
                    "monthly_subscribers": 28
                },
                {
                    "id": "prod_3",
                    "name": "Standard Logistics Cloud",
                    "price_aed": 12000,
                    "cost_aed": 8200,
                    "margin": 31.6,
                    "monthly_subscribers": 24
                }
            ],
            "marketing_spend": {
                "2026-05": 35000,
                "2026-06": 40000,
                "2026-07": 42000,
                "2026-08": 45000
            },
            "employees": {
                "engineering": 12,
                "sales_marketing": 8,
                "support_ops": 5
            }
        }
    },
    {
        "name": "Gulf Coast Gourmet Trading LLC",
        "industry": "F&B / E-Commerce Distribution",
        "country": "United Arab Emirates",
        "currency": "USD",
        "size": "Small",
        "founded_year": 2022,
        "description": "Artisanal food & beverage importer supplying hospitality chains and direct-to-consumer e-commerce.",
        "goals": {
            "target_annual_revenue": 3000000,
            "target_margin": 22,
            "target_customer_retention": 80
        },
        "world_model": {
            "revenue": {
                "2025-08": 140000,
                "2025-09": 145000,
                "2025-10": 160000,
                "2025-11": 180000,
                "2025-12": 230000,
                "2026-01": 150000,
                "2026-02": 155000,
                "2026-03": 165000,
                "2026-04": 172000,
                "2026-05": 178000,
                "2026-06": 185000,
                "2026-07": 192000,
                "2026-08": 205000
            },
            "costs": {
                "2025-08": 115000,
                "2025-09": 118000,
                "2025-10": 128000,
                "2025-11": 142000,
                "2025-12": 175000,
                "2026-01": 125000,
                "2026-02": 128000,
                "2026-03": 134000,
                "2026-04": 139000,
                "2026-05": 143000,
                "2026-06": 148000,
                "2026-07": 153000,
                "2026-08": 161000
            },
            "profit": {
                "2025-08": 25000,
                "2025-09": 27000,
                "2025-10": 32000,
                "2025-11": 38000,
                "2025-12": 55000,
                "2026-01": 25000,
                "2026-02": 27000,
                "2026-03": 31000,
                "2026-04": 33000,
                "2026-05": 35000,
                "2026-06": 37000,
                "2026-07": 39000,
                "2026-08": 44000
            },
            "leads": {
                "2026-05": 320,
                "2026-06": 350,
                "2026-07": 380,
                "2026-08": 410
            },
            "customers": {
                "2026-05": 85,
                "2026-06": 92,
                "2026-07": 99,
                "2026-08": 108
            },
            "products": [
                {
                    "id": "prod_101",
                    "name": "Organic Gourmet Olive Oil Reserve",
                    "price_aed": 180,
                    "cost_aed": 75,
                    "margin": 58.3,
                    "monthly_units": 450
                },
                {
                    "id": "prod_102",
                    "name": "Artisanal Specialty Coffee Beans 1kg",
                    "price_aed": 140,
                    "cost_aed": 82,
                    "margin": 41.4,
                    "monthly_units": 600
                },
                {
                    "id": "prod_103",
                    "name": "Standard Bulk Flour & Dairy Pack",
                    "price_aed": 320,
                    "cost_aed": 265,
                    "margin": 17.1,
                    "monthly_units": 250
                }
            ],
            "marketing_spend": {
                "2026-05": 12000,
                "2026-06": 14000,
                "2026-07": 15000,
                "2026-08": 16000
            },
            "employees": {
                "logistics_ops": 6,
                "sales": 4,
                "admin": 2
            }
        }
    }
]
