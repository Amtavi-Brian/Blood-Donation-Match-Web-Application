import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.api.deps import get_db, get_current_user
from app.db.base import Base
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
from app.models.donor_profile import DonorProfile
from app.models.blood_request import BloodRequest


@pytest.fixture
def test_environment():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestSession = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )
    Base.metadata.create_all(bind=engine)

    db = TestSession()

    try:
        hospital_a = Hospital(
            name="Test Hospital A",
            registration_number="TEST-REG-A",
            address="Test Street A",
            city="Nairobi",
            contact_phone="+254700000001",
            is_verified=True,
        )
        hospital_b = Hospital(
            name="Test Hospital B",
            registration_number="TEST-REG-B",
            address="Test Street B",
            city="Nairobi",
            contact_phone="+254700000002",
            is_verified=True,
        )
        db.add_all([hospital_a, hospital_b])
        db.flush()

        staff_a = User(
            full_name="Hospital Staff A",
            email="staff-a@example.test",
            hashed_password=hash_password("TestPassword123"),
            role=UserRole.HOSPITAL_STAFF,
            is_active=True,
        )
        staff_b = User(
            full_name="Hospital Staff B",
            email="staff-b@example.test",
            hashed_password=hash_password("TestPassword123"),
            role=UserRole.HOSPITAL_STAFF,
            is_active=True,
        )
        donor = User(
            full_name="Test Donor",
            email="donor@example.test",
            hashed_password=hash_password("TestPassword123"),
            role=UserRole.DONOR,
            is_active=True,
        )
        db.add_all([staff_a, staff_b, donor])
        db.flush()

        db.add_all([
            HospitalUser(
                user_id=staff_a.id,
                hospital_id=hospital_a.id,
                is_authorized=True,
            ),
            HospitalUser(
                user_id=staff_b.id,
                hospital_id=hospital_b.id,
                is_authorized=True,
            ),
        ])
        db.commit()

        ids = {
            "hospital_a": hospital_a.id,
            "hospital_b": hospital_b.id,
            "staff_a": staff_a.id,
            "staff_b": staff_b.id,
            "donor": donor.id,
        }

        def override_db():
            yield db

        app.dependency_overrides[get_db] = override_db

        def login_as(user_id):
            def override_user():
                user = db.get(User, user_id)
                assert user is not None
                return user
            return override_user

        client = TestClient(app)

        yield client, db, ids, login_as

        client.close()
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_unauthenticated_user_cannot_create_request(test_environment):
    client, _, _, _ = test_environment

    response = client.post(
        "/api/v1/blood-requests/",
        json={"blood_group": "O+", "units_needed": 2},
    )

    assert response.status_code == 401


def test_donor_cannot_create_request(test_environment):
    client, _, ids, login_as = test_environment
    app.dependency_overrides[get_current_user] = login_as(ids["donor"])

    response = client.post(
        "/api/v1/blood-requests/",
        json={"blood_group": "O+", "units_needed": 2},
    )

    assert response.status_code == 403


def test_authorized_staff_can_create_request(test_environment):
    client, _, ids, login_as = test_environment
    app.dependency_overrides[get_current_user] = login_as(ids["staff_a"])

    response = client.post(
        "/api/v1/blood-requests/",
        json={
            "blood_group": "O+",
            "units_needed": 2,
            "urgency": "urgent",
            "notes": "Integration test request",
        },
    )

    assert response.status_code == 201, response.text
    assert response.json()["hospital_id"] == ids["hospital_a"]
    assert response.json()["blood_group"] == "O+"
    assert response.json()["units_needed"] == 2


def test_revoked_staff_cannot_create_request(test_environment):
    client, db, ids, login_as = test_environment

    association = db.query(HospitalUser).filter_by(
        user_id=ids["staff_a"],
        hospital_id=ids["hospital_a"],
    ).one()
    association.is_authorized = False
    db.commit()

    app.dependency_overrides[get_current_user] = login_as(ids["staff_a"])

    response = client.post(
        "/api/v1/blood-requests/",
        json={"blood_group": "O+", "units_needed": 2},
    )

    assert response.status_code == 403


def test_staff_cannot_modify_another_hospitals_request(test_environment):
    client, db, ids, login_as = test_environment

    request = BloodRequest(
        hospital_id=ids["hospital_a"],
        blood_group="O_POSITIVE",
        units_needed=2,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    request_id = request.id

    app.dependency_overrides[get_current_user] = login_as(ids["staff_b"])

    response = client.patch(
        f"/api/v1/blood-requests/{request_id}",
        json={"units_needed": 3},
    )

    assert response.status_code == 403
