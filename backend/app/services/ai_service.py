import os
import joblib
import pandas as pd
import numpy as np

class AIService:
    def __init__(self):
        # Resolve path relative to project root
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
        self.models_dir = os.path.join(project_root, "ai_models", "saved_models")
        self.load_models()

    def load_models(self):
        try:
            self.sla_xgb = joblib.load(os.path.join(self.models_dir, "sla_xgb_model.pkl"))
            self.sla_rf = joblib.load(os.path.join(self.models_dir, "sla_rf_model.pkl"))
            self.hotspot_rf = joblib.load(os.path.join(self.models_dir, "hotspot_rf_model.pkl"))
            self.workload_linreg = joblib.load(os.path.join(self.models_dir, "workload_linreg_model.pkl"))
            print("Loaded trained AI models successfully.")
        except Exception as e:
            print(f"Notice: AI models loading fallback initialized ({e}).")
            self.sla_xgb = None
            self.sla_rf = None

    def predict_sla_risk(self, department_id: int, ward_id: str, priority: str, sla_hours: int, officer_workload: int) -> dict:
        priority_map = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
        p_num = priority_map.get(priority.upper(), 2)
        try:
            w_num = int(ward_id.replace("WARD-0", "").replace("WARD-", ""))
        except ValueError:
            w_num = 1

        features = np.array([[department_id, w_num, p_num, sla_hours, officer_workload, 65.0, 0.6]])
        
        if self.sla_xgb:
            prob = float(self.sla_xgb.predict_proba(features)[0][1])
            risk_score = round(prob * 100, 2)
        else:
            base_risk = (officer_workload * 8) + (p_num * 10) - (sla_hours * 0.3)
            risk_score = min(max(round(base_risk, 2), 5.0), 98.0)

        is_high = risk_score > 60.0
        risk_level = "CRITICAL" if risk_score > 80 else ("HIGH" if is_high else "NORMAL")
        
        rec = "Reassign complaint to available officer in nearby ward." if is_high else "Within normal SLA tolerance."

        return {
            "breach_risk_score": risk_score,
            "is_high_risk": is_high,
            "risk_level": risk_level,
            "recommendation": rec
        }

    def predict_ward_hotspots(self) -> list:
        wards = [
            {"ward_id": "WARD-01", "ward_name": "Charminar East", "risk_score": 88.5, "predicted_complaints": 45, "hotspot_level": "CRITICAL"},
            {"ward_id": "WARD-02", "ward_name": "Banjara Hills", "risk_score": 25.0, "predicted_complaints": 8, "hotspot_level": "LOW"},
            {"ward_id": "WARD-03", "ward_name": "Hitec City North", "risk_score": 42.0, "predicted_complaints": 14, "hotspot_level": "MEDIUM"},
            {"ward_id": "WARD-04", "ward_name": "Secunderabad Central", "risk_score": 82.4, "predicted_complaints": 38, "hotspot_level": "HIGH"},
            {"ward_id": "WARD-05", "ward_name": "Kukatpally Industrial", "risk_score": 91.0, "predicted_complaints": 52, "hotspot_level": "CRITICAL"}
        ]
        return wards

    def balance_workload(self, officer_data: list) -> dict:
        redistribution_plan = []
        for off in officer_data:
            workload = off.get("active_workload", 0)
            capacity = off.get("capacity", 8)
            utilization = (workload / capacity) * 100 if capacity > 0 else 100
            
            action = "MAINTAIN"
            if utilization > 80:
                action = "REASSIGN_OVERLOAD"
            elif utilization < 40:
                action = "AVAILABLE_FOR_MORE"

            redistribution_plan.append({
                "officer_id": off.get("id"),
                "full_name": off.get("full_name"),
                "utilization_percent": round(utilization, 1),
                "recommended_action": action
            })
            
        return {
            "redistribution_plan": redistribution_plan,
            "system_status": "OPTIMAL" if all(x["utilization_percent"] <= 85 for x in redistribution_plan) else "ATTENTION_REQUIRED"
        }

    def generate_dynamic_recommendations(self) -> list:
        return [
            {
                "id": 1,
                "category": "STAFFING",
                "department": "Water Supply & Sanitation",
                "ward": "WARD-01",
                "recommendation": "Deploy 2 additional maintenance engineers to Charminar East due to 45% spike in pipe bursts.",
                "priority": "HIGH"
            },
            {
                "id": 2,
                "category": "INFRASTRUCTURE",
                "department": "Roads & Infrastructure",
                "ward": "WARD-05",
                "recommendation": "Initiate monsoon pre-pothole sealing drive in Kukatpally Industrial zone.",
                "priority": "MEDIUM"
            },
            {
                "id": 3,
                "category": "SLA_OPTIMIZATION",
                "department": "Electricity & Power Grid",
                "ward": "WARD-04",
                "recommendation": "Reduce Transformer fault SLA target from 12 hours to 6 hours based on historical resolution velocity.",
                "priority": "LOW"
            }
        ]

ai_service = AIService()
