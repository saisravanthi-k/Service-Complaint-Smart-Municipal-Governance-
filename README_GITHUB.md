# Service Complaint — Smart Municipal Governance & Civic AI Platform

An enterprise-grade AI-powered Municipal Service Complaint Management & Intelligence Platform for citizens, officers, administrators, and commissioners. Supports multilingual (Telugu/English) voice & text filing, automated officer allocation, SLA escalation, geospatial analytics, and an AI-backed commissioner dashboard.

## Key Features
- Telugu voice & text complaint filing with Whisper-based STT and NLP routing.
- Citizen & Officer portals with live ticket queue, SLA timers, and tracking.
- Automated officer allocation and workload balancing.
- Multi-tier SLA breach escalation and risk prediction.
- Commissioner dashboard: ward heatmaps, digital twin, and AI recommendations.
- AI/ML models: SLA breach predictor, hotspot predictor, workload balancer.

## Tech Stack
- Backend: `FastAPI`, `Uvicorn`, `SQLAlchemy`, `Pydantic`
- Frontend: `React` (Vite), `Tailwind CSS`, `Leaflet`
- Dashboard: `Streamlit`, `Plotly`
- DB: `PostgreSQL`
- AI: `scikit-learn`, `xgboost`, `statsmodels`, OpenAI Whisper
- Containerization: `Docker`, `docker-compose`

## Quick Start (Recommended: Docker Compose)
From the project root (contains `docker-compose.yml`):

```bash
docker-compose up --build
```

Access:
- Frontend (Citizen & Officer): http://localhost:3000
- Backend (Swagger): http://localhost:8000/docs
- Commissioner Dashboard: http://localhost:8501

## Local Development (without Docker)

1. Create and initialize database
```bash
# create DB (Postgres must be installed/running)
psql -U postgres -c "CREATE DATABASE service_complaint_db;"
psql -U postgres -d service_complaint_db -f database/schema.sql
psql -U postgres -d service_complaint_db -f database/seed_data.sql
```

2. Backend — install & run
```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

3. Dashboard — Streamlit
```bash
cd dashboard
python -m pip install -r requirements.txt
streamlit run app.py
```

4. Frontend — install & run
```bash
cd frontend
npm install
npm run dev
# Vite will serve at http://localhost:5173 (or configured port)
```

## Default Seed Accounts
- Citizen: `citizen@telangana.gov.in` / `citizen123`
- Officer: `officer.water@telangana.gov.in` / `officer123`
- Admin: `admin@telangana.gov.in` / `admin123`
- Commissioner: `commissioner@telangana.gov.in` / `commish123`

## Project Layout (important folders)
- `backend/` — FastAPI app and API routes
- `frontend/` — React (Vite) app
- `dashboard/` — Streamlit dashboard
- `ai_models/` — scripts to generate data and train models
- `database/` — `schema.sql`, `seed_data.sql`
- `docker/` — Dockerfiles and Docker helpers
- `tests/` — unit/integration tests

## Running Tests
```bash
# from repo root
pytest -q
```

## Contributing
- Fork the repo, create a feature branch, run tests, open a PR.
- Follow existing code style. Add tests for new functionality.

## Notes & Troubleshooting
- If missing Python packages: `python -m pip install -r requirements.txt` in the relevant folder.
- If ports already in use, change port in `docker-compose.yml` or command-line flags.
- Large AI models (Whisper) may require GPU or extended CPU time—use pre-saved models in `ai_models/saved_models/` if available.

## License
Specify your license here (e.g., MIT). Replace this line with the license you want to use.

## Contact
For questions or help, open an issue or contact the repo maintainer.

---

This file was generated to provide an easy-to-copy GitHub README for the project.
# change to project folder (PowerShell or Git Bash)
cd "C:\Users\saisr\OneDrive\Desktop\service complaint"

# initialize repo
git init
git branch -M main
git remote add origin <your-repo-url>

# create a .gitignore (example)
echo "venv/" > .gitignore
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo "__pycache__/" >> .gitignore
echo "ai_models/saved_models/" >> .gitignore

# add, commit, push
git add .
git commit -m "Initial commit"
git push -u origin main