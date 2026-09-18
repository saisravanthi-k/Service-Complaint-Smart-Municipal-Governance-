from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}

engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_db_migrations_and_seeds():
    """Ensure newly added columns exist in schema & seed default manager accounts with ward assignments."""
    with engine.connect() as conn:
        if "sqlite" in db_url:
            res = conn.execute(text("PRAGMA table_info(complaints)")).fetchall()
            existing_cols = [r[1] for r in res] if res else []
            
            if existing_cols:
                if "sla_started_at" not in existing_cols:
                    try:
                        conn.execute(text("ALTER TABLE complaints ADD COLUMN sla_started_at DATETIME"))
                        conn.commit()
                    except Exception as e:
                        print(f"Migration note (sla_started_at): {e}")

                if "violated_at" not in existing_cols:
                    try:
                        conn.execute(text("ALTER TABLE complaints ADD COLUMN violated_at DATETIME"))
                        conn.commit()
                    except Exception as e:
                        print(f"Migration note (violated_at): {e}")

                if "delay_requested_at" not in existing_cols:
                    try:
                        conn.execute(text("ALTER TABLE complaints ADD COLUMN delay_requested_at DATETIME"))
                        conn.commit()
                    except Exception as e:
                        print(f"Migration note (delay_requested_at): {e}")

    # Seed initial departments & managers if needed
    try:
        from app.models.models import Department, Officer
        from app.core.security import get_password_hash
        db = SessionLocal()
        
        # 1. Departments
        depts_data = [
            (1, "Water Supply & Sanitation", "WATER", "Drinking water supply, leakage, sewage overflow", 24),
            (2, "Roads & Infrastructure", "ROADS", "Potholes, street lights, road maintenance", 48),
            (3, "Electricity & Power Grid", "ELEC", "Transformer fault, power grid outage", 12),
            (4, "Public Health & Waste", "HEALTH", "Garbage collection, mosquito control", 24),
            (5, "Town Planning & Encroachment", "PLAN", "Building illegal encroachment & drainage", 72)
        ]
        for d_id, name, code, desc, sla in depts_data:
            existing_dept = db.query(Department).filter(Department.id == d_id).first()
            if not existing_dept:
                db.add(Department(id=d_id, name=name, code=code, description=desc, default_sla_hours=sla))
        db.commit()

        # 2. Ward-Assigned Managers / Officers (Single-Task Capacity: starts with 0 active workload)
        managers_data = [
            ("Abhi", "abhi.manager@gvmc.gov.in", "abhi123", 1, "WARD-01", "Ward 1 Executive Manager", 0),
            ("Janu", "janu.manager@gvmc.gov.in", "janu123", 2, "WARD-02", "Ward 2 Divisional Manager", 0),
            ("Teja", "teja.manager@gvmc.gov.in", "teja123", 3, "WARD-03", "Ward 3 Infrastructure Manager", 0),
            ("Ravi", "ravi.manager@gvmc.gov.in", "ravi123", 4, "WARD-04", "Ward 4 Health Manager", 0),
            ("Srinu", "srinu.manager@gvmc.gov.in", "srinu123", 5, "WARD-05", "Ward 5 Senior Manager", 0)
        ]

        for full_name, email, password, dept_id, ward_id, rank, workload in managers_data:
            existing_off = db.query(Officer).filter(Officer.email == email).first()
            if not existing_off:
                pwd_hash = get_password_hash(password)
                db.add(Officer(
                    full_name=full_name,
                    email=email,
                    password_hash=pwd_hash,
                    department_id=dept_id,
                    ward_id=ward_id,
                    rank=rank,
                    active_workload=workload,
                    status="ACTIVE"
                ))
            else:
                # Update ward_id & department_id to ensure proper ward routing
                existing_off.ward_id = ward_id
                existing_off.department_id = dept_id
                existing_off.full_name = full_name
                # Ensure active_workload is reset to 0 if no active complaints assigned
                from app.models.models import Complaint
                active_count = db.query(Complaint).filter(
                    Complaint.assigned_officer_id == existing_off.id,
                    Complaint.status.in_(["ASSIGNED", "IN_PROGRESS", "SLA Violated"])
                ).count()
                existing_off.active_workload = active_count
        db.commit()
        db.close()
    except Exception as e:
        print(f"Manager Seeding Notice: {e}")

run_db_migrations_and_seeds()
