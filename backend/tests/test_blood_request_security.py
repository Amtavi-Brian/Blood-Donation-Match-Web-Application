from datetime import datetime, timedelta, timezone

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
from app.models.blood_request import BloodRequest
from app.models.donor_profile import BloodGroup, DonorProfile


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


def test_hospital_staff_can_only_list_authorized_hospitals(test_environment):
    client, _, ids, login_as = test_environment
    app.dependency_overrides[get_current_user] = login_as(ids["staff_a"])

    response = client.get("/api/v1/hospitals/me")

    assert response.status_code == 200, response.text
    assert [hospital["id"] for hospital in response.json()] == [
        ids["hospital_a"]
    ]


def test_hospital_staff_can_receive_and_issue_stock(test_environment):
    client, _, ids, login_as = test_environment
    app.dependency_overrides[get_current_user] = login_as(ids["staff_a"])
    hospital_id = ids["hospital_a"]

    response = client.post(
        f"/api/v1/stock/hospitals/{hospital_id}",
        json={"blood_type": "O+", "component": "whole_blood", "threshold": 2},
    )
    assert response.status_code == 201, response.text
    stock_id = response.json()["stock_id"]

    response = client.post(
        f"/api/v1/stock/hospitals/{hospital_id}/items/{stock_id}/batches",
        json={
            "batch_reference": "BATCH-001",
            "quantity": 5,
            "expiry_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["remaining_quantity"] == 5

    response = client.get(f"/api/v1/stock/hospitals/{hospital_id}")
    assert response.status_code == 200, response.text
    assert response.json()[0]["quantity"] == 5

    response = client.get(
        f"/api/v1/stock/hospitals/{hospital_id}/items/{stock_id}/batches"
    )
    assert response.status_code == 200, response.text
    assert response.json()[0]["batch_reference"] == "BATCH-001"

    response = client.post(
        f"/api/v1/stock/hospitals/{hospital_id}/items/{stock_id}/issue",
        json={"quantity": 2},
    )
    assert response.status_code == 200, response.text
    assert response.json()["quantity"] == 3

    response = client.post(
        f"/api/v1/stock/hospitals/{hospital_id}/items/{stock_id}/issue",
        json={"quantity": 4},
    )
    assert response.status_code == 409


def test_hospital_staff_can_manage_request_statuses(test_environment):
    client, _, ids, login_as = test_environment
    app.dependency_overrides[get_current_user] = login_as(ids["staff_a"])
    hospital_id = ids["hospital_a"]

    response = client.post(
        "/api/v1/blood-requests/",
        json={"blood_group": "O+", "units_needed": 2, "urgency": "urgent"},
    )
    assert response.status_code == 201, response.text
    fulfilled_id = response.json()["id"]

    response = client.get(
        f"/api/v1/blood-requests/?hospital_id={hospital_id}"
    )
    assert response.status_code == 200, response.text
    assert [request["id"] for request in response.json()] == [fulfilled_id]

    response = client.patch(
        f"/api/v1/blood-requests/{fulfilled_id}/status",
        json={"status": "fulfilled"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "fulfilled"

    response = client.patch(
        f"/api/v1/blood-requests/{fulfilled_id}/status",
        json={"status": "cancelled"},
    )
    assert response.status_code == 409

    response = client.post(
        "/api/v1/blood-requests/",
        json={"blood_group": "A+", "units_needed": 1},
    )
    assert response.status_code == 201, response.text
    cancelled_id = response.json()["id"]

    response = client.delete(f"/api/v1/blood-requests/{cancelled_id}")
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "cancelled"


def test_hospital_dashboard_matching_donations_and_reports(test_environment):
    client, db, ids, login_as = test_environment
    app.dependency_overrides[get_current_user] = login_as(ids["staff_a"])
    hospital_id = ids["hospital_a"]

    donor_profile = DonorProfile(
        user_id=ids["donor"],
        blood_group=BloodGroup.O_POSITIVE,
        city="Nairobi",
        available_to_contact=True,
        consent_to_contact=True,
        consent_to_share_location=True,
        latitude=-1.2864,
        longitude=36.8172,
    )
    db.add(donor_profile)
    db.flush()
    staff = db.get(User, ids["staff_a"])
    donor = db.get(User, ids["donor"])
    staff.is_email_verified = True
    donor.is_email_verified = True
    db.commit()
    donor_profile_id = donor_profile.id

    response = client.post(
        "/api/v1/blood-requests/",
        json={"blood_group": "O+", "units_needed": 1, "urgency": "routine"},
    )
    assert response.status_code == 201, response.text
    request_id = response.json()["id"]

    response = client.get(
        f"/api/v1/matching/requests/{request_id}/donors"
    )
    assert response.status_code == 200, response.text
    assert response.json()[0]["donor_profile_id"] == donor_profile_id

    response = client.get(f"/api/v1/hospitals/{hospital_id}/donors/map")
    assert response.status_code == 200, response.text
    assert response.json()[0]["latitude"] == round(-1.2864, 2)

    response = client.post(
        f"/api/v1/donations/hospitals/{hospital_id}",
        json={
            "donor_id": donor_profile_id,
            "blood_type": "O+",
            "quantity": 1,
        },
    )
    assert response.status_code == 201, response.text
    donation_id = response.json()["donation_id"]
    assert response.json()["verified"] is False

    response = client.get(f"/api/v1/donations/hospitals/{hospital_id}")
    assert response.status_code == 200, response.text
    assert response.json()[0]["donation_id"] == donation_id

    response = client.patch(
        f"/api/v1/donations/hospitals/{hospital_id}/{donation_id}/verify",
        json={"verified": True},
    )
    assert response.status_code == 200, response.text
    assert response.json()["verified"] is True

    response = client.post(
        f"/api/v1/stock/hospitals/{hospital_id}",
        json={"blood_type": "O+", "component": "whole_blood", "threshold": 5},
    )
    assert response.status_code == 201, response.text
    stock_id = response.json()["stock_id"]
    response = client.post(
        f"/api/v1/stock/hospitals/{hospital_id}/items/{stock_id}/batches",
        json={
            "batch_reference": "REPORT-BATCH",
            "quantity": 4,
            "expiry_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        },
    )
    assert response.status_code == 201, response.text

    response = client.get(
        f"/api/v1/reports/blood-stock?hospital_id={hospital_id}"
    )
    assert response.status_code == 200, response.text
    assert response.json()["total_quantity"] == 4
    assert response.json()["low_stock_items"] == 1

    response = client.get(
        f"/api/v1/reports/blood-requests?hospital_id={hospital_id}"
    )
    assert response.status_code == 200, response.text
    assert response.json()["pending_requests"] == 1

    response = client.get(
        f"/api/v1/reports/donations?hospital_id={hospital_id}"
    )
    assert response.status_code == 200, response.text
    assert response.json()["verified_donations"] == 1

    response = client.get("/api/v1/notifications/unread-count")
    assert response.status_code == 200, response.text
    assert isinstance(response.json()["unread_count"], int)
