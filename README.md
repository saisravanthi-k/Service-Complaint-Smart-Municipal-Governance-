# Service Complaint - Smart Municipal Governance & Civic AI Platform

An enterprise-grade, AI-powered **Municipal Service Complaint Management & Intelligence Platform** built to bridge citizens, municipal officers, administrators, and city commissioners.

---

## Key Modules

1. **Citizen Portal (`frontend/`)**
   - Telugu Voice & Text complaint filing.
   - Live complaint tracking & interactive Leaflet map pin location picker.
   - Citizen Rights AI Chatbot assistant (Telugu & English).
   - Rating, feedback, and resolution verification.

2. **Officer & Admin Portal (`frontend/`)**
   - Active ticket queue & SLA live countdown timers.
   - Automated officer allocation & workload balancing.
   - Multi-tier SLA breach escalation (Level 1 Reminder -> Level 2 Supervisor -> Level 3 Commissioner).
   - Department performance ranking leaderboards.

3. **Commissioner Intelligence Dashboard (`dashboard/`)**
   - Built with Streamlit & Plotly.
   - Geospatial ward-wise complaint hotspot heatmaps.
   - Digital Twin Ward 2D/3D simulation.
   - AI SLA breach risk early warning system.
   - Public accountability scorecards and AI dynamic operational recommendations.

4. **AI Models (`ai_models/`)**
   - **Telugu Speech-to-Text**: OpenAI Whisper handler with NLP classifier for auto department & priority detection.
   - **SLA Breach Predictor**: XGBoost & Random Forest classifier.
   - **Complaint Hotspot Predictor**: Spatial-temporal ARIMA & Random Forest model.
   - **Smart Workload Balancer**: Linear Regression & Decision Tree model.

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Leaflet, Axios, Lucide Icons
- **Backend**: FastAPI (Python 3.10+), SQLAlchemy, Pydantic, PyJWT, Passlib (Bcrypt)
- **Database**: PostgreSQL 15
- **Dashboard**: Streamlit, Plotly
- **AI/ML**: Scikit-Learn, XGBoost, Statsmodels (ARIMA), OpenAI Whisper
- **Containerization**: Docker & Docker Compose

---

## Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or Docker)

### Option 1: Run via Docker Compose (Recommended)
```bash
docker-compose up --build
```
Access points:
- **Citizen & Officer Portal**: [http://localhost:3000](http://localhost:3000)
- **Backend Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Commissioner Intelligence Dashboard**: [http://localhost:8501](http://localhost:8501)

### Option 2: Run Local Development Services

1. **Database Setup**:
   Create PostgreSQL database `service_complaint_db` and apply DDL:
   ```bash
   psql -U postgres -d service_complaint_db -f database/schema.sql
   psql -U postgres -d service_complaint_db -f database/seed_data.sql
   ```

2. **Train AI Models & Seed Synthetic Data**:
   ```bash
   python -m pip install -r requirements.txt
   python ai_models/generate_synthetic_datasets.py
   python ai_models/train_sla_predictor.py
   python ai_models/train_hotspot_model.py
   python ai_models/train_workload_balancer.py
   ```

3. **Backend Service**:
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

4. **Streamlit Commissioner Dashboard**:
   ```bash
   cd dashboard
   streamlit run app.py
   ```

5. **React Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## System Credentials (Default Seed Accounts)

| Role | Email | Password |
|---|---|---|
| **Citizen** | citizen@telangana.gov.in | citizen123 |
| **Officer** | officer.water@telangana.gov.in | officer123 |
| **Admin** | admin@telangana.gov.in | admin123 |
| **Commissioner** | commissioner@telangana.gov.in | commish123 |

---

## License & Governance

Developed for Smart Municipal Governance & Public Service Accountability.
