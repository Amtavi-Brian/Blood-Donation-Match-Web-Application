from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user, get_db
from app.db.base import Base
from app.main import app
from app.models.blood_request import (
    BloodRequest,
    BloodRequestStatus,
    BloodRequestUrgency,
)
from app.models.donation_record import DonationRecord
from app.models.donor_profile import BloodGroup, DonorProfile
from app.models.hospital import Hospital
from app.models.notififcation import Notification
from app.models.reminder import Reminder, ReminderStatus
from app.models.user import User, UserRole


@pytest.fixture
def donor_environment():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    db = TestSession()

    donor = User(
        full_name="Test Donor",
        email="donor@example.test",
        hashed_password="test-hash",
        role=UserRole.DONOR,
        is_active=True,
        is_email_verified=True,
    )
    other_donor = User(
        full_name="Other Donor",
        email="other-donor@example.test",
        hashed_password="test-hash",
        role=UserRole.DONOR,
        is_active=True,
        is_email_verified=True,
    )
    hospital = Hospital(
        name="Verified Test Hospital",
        registration_number="DONOR-TEST-REG",
        address="1 Test Road",
        city="Nairobi",
        contact_phone="+254700000001",
        is_verified=True,
    )
    unverified_hospital = Hospital(
        name="Unverified Test Hospital",
        registration_number="DONOR-TEST-REG-2",
        address="2 Test Road",
        city="Nairobi",
        contact_phone="+254700000002",
        is_verified=False,
    )
    db.add_all([donor, other_donor, hospital, unverified_hospital])
    db.flush()

    ids = {
        "donor": donor.id,
        "other_donor": other_donor.id,
        "hospital": hospital.id,
        "unverified_hospital": unverified_hospital.id,
    }

    def override_db():
        yield db

    def override_user():
        user = db.get(User, ids["donor"])
        assert user is not None
        return user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    client = TestClient(app)

    try:
        yield client, db, ids
    finally:
        client.close()
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_donor_profile_and_location_privacy_are_database_backed(donor_environment):
    client, db, ids = donor_environment

    response = client.post(
        "/api/v1/donors/me",
        json={
            "blood_group": "O+",
            "city": "Nairobi",
            "available_to_contact": True,
            "consent_to_contact": True,
        },
    )
    assert response.status_code == 201, response.text
    profile_id = response.json()["id"]

    response = client.get("/api/v1/donors/me")
    assert response.status_code == 200, response.text
    assert response.json()["id"] == profile_id
    assert response.json()["blood_group"] == "O+"

    response = client.put(
        "/api/v1/donors/me",
        json={
            "city": "Mombasa",
            "available_to_contact": False,
            "consent_to_contact": False,
        },
    )
    assert response.status_code == 200, response.text
    assert response.json()["city"] == "Mombasa"
    assert response.json()["available_to_contact"] is False

    response = client.put(
        "/api/v1/donors/me/location",
        json={
            "latitude": -1.2864,
            "longitude": 36.8172,
            "consent_to_share_location": True,
        },
    )
    assert response.status_code == 200, response.text
    assert response.json() == {
        "consent_to_share_location": True,
        "has_location": True,
    }
    profile = db.get(DonorProfile, profile_id)
    assert profile is not None
    assert profile.latitude == -1.2864
    assert profile.longitude == 36.8172

    response = client.put(
        "/api/v1/donors/me/location",
        json={"consent_to_share_location": False},
    )
    assert response.status_code == 200, response.text
    assert response.json()["has_location"] is False
    db.refresh(profile)
    assert profile.latitude is None
    assert profile.longitude is None


def test_donor_dashboard_lists_verified_hospitals_and_active_requests(donor_environment):
    client, db, ids = donor_environment
    pending = BloodRequest(
        hospital_id=ids["hospital"],
        blood_group=BloodGroup.O_POSITIVE,
        units_needed=2,
        urgency=BloodRequestUrgency.EMERGENCY,
        status=BloodRequestStatus.PENDING,
        notes="Urgent test request",
    )
    fulfilled = BloodRequest(
        hospital_id=ids["hospital"],
        blood_group=BloodGroup.A_POSITIVE,
        units_needed=1,
        urgency=BloodRequestUrgency.ROUTINE,
        status=BloodRequestStatus.FULFILLED,
    )
    cancelled = BloodRequest(
        hospital_id=ids["hospital"],
        blood_group=BloodGroup.B_POSITIVE,
        units_needed=1,
        urgency=BloodRequestUrgency.URGENT,
        status=BloodRequestStatus.CANCELLED,
    )
    hidden_request = BloodRequest(
        hospital_id=ids["unverified_hospital"],
        blood_group=BloodGroup.AB_POSITIVE,
        units_needed=1,
    )
    db.add_all([pending, fulfilled, cancelled, hidden_request])
    db.commit()
    pending_id = pending.id

    response = client.get("/api/v1/hospitals/?verified_only=true")
    assert response.status_code == 200, response.text
    assert [hospital["id"] for hospital in response.json()] == [ids["hospital"]]

    response = client.get("/api/v1/blood-requests/?status_filter=pending")
    assert response.status_code == 200, response.text
    assert [request["id"] for request in response.json()] == [pending_id]
    request = response.json()[0]
    assert request["hospital_id"] == ids["hospital"]
    assert request["urgency"] == "emergency"

    response = client.get("/api/v1/blood-requests/")
    assert response.status_code == 200, response.text
    assert {item["status"] for item in response.json()} == {"pending", "fulfilled"}
    assert all(item["hospital_id"] == ids["hospital"] for item in response.json())


def test_donor_donations_notifications_and_reminders_are_user_scoped(donor_environment):
    client, db, ids = donor_environment
    donor_profile = DonorProfile(
        user_id=ids["donor"],
        blood_group=BloodGroup.O_POSITIVE,
        city="Nairobi",
    )
    other_profile = DonorProfile(
        user_id=ids["other_donor"],
        blood_group=BloodGroup.A_POSITIVE,
        city="Kisumu",
    )
    db.add_all([donor_profile, other_profile])
    db.flush()
    own_donation = DonationRecord(
        donor_id=donor_profile.id,
        hospital_id=ids["hospital"],
        blood_type=BloodGroup.O_POSITIVE,
        quantity=1,
        verified=True,
    )
    other_donation = DonationRecord(
        donor_id=other_profile.id,
        hospital_id=ids["hospital"],
        blood_type=BloodGroup.A_POSITIVE,
        quantity=1,
        verified=False,
    )
    own_notification = Notification(
        user_id=ids["donor"],
        title="Donation reminder",
        message="Please review your reminder.",
        notification_type="reminder",
    )
    other_notification = Notification(
        user_id=ids["other_donor"],
        title="Private notification",
        message="This belongs to another account.",
        notification_type="general",
    )
    other_reminder = Reminder(
        user_id=ids["other_donor"],
        title="Other donor reminder",
        message="Private",
        reminder_type="personal",
        scheduled_at=datetime.now(timezone.utc) + timedelta(days=3),
        status=ReminderStatus.PENDING,
    )
    db.add_all([
        own_donation,
        other_donation,
        own_notification,
        other_notification,
        other_reminder,
    ])
    db.commit()
    own_notification_id = own_notification.notification_id
    other_reminder_id = other_reminder.reminder_id

    response = client.get("/api/v1/donations/me")
    assert response.status_code == 200, response.text
    assert len(response.json()) == 1
    assert response.json()[0]["blood_type"] == "O+"

    response = client.get("/api/v1/notifications/")
    assert response.status_code == 200, response.text
    assert [item["notification_id"] for item in response.json()] == [
        own_notification_id
    ]

    response = client.get("/api/v1/notifications/unread-count")
    assert response.status_code == 200, response.text
    assert response.json()["unread_count"] == 1

    response = client.patch(
        f"/api/v1/notifications/{own_notification_id}/read"
    )
    assert response.status_code == 200, response.text
    assert response.json()["is_read"] is True

    response = client.get("/api/v1/notifications/unread-count")
    assert response.status_code == 200, response.text
    assert response.json()["unread_count"] == 0

    response = client.post(
        "/api/v1/reminders/",
        json={
            "title": "Upcoming donation",
            "message": "Check donor eligibility.",
            "reminder_type": "personal",
            "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        },
    )
    assert response.status_code == 201, response.text
    reminder_id = response.json()["reminder_id"]

    response = client.get("/api/v1/reminders/me")
    assert response.status_code == 200, response.text
    assert [item["reminder_id"] for item in response.json()] == [reminder_id]

    response = client.patch(f"/api/v1/reminders/{reminder_id}/cancel")
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "cancelled"

    response = client.patch(f"/api/v1/reminders/{other_reminder_id}/cancel")
    assert response.status_code == 404

    response = client.post(
        "/api/v1/reminders/",
        json={
            "title": "Past reminder",
            "message": "This should be rejected.",
            "reminder_type": "personal",
            "scheduled_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        },
    )
    assert response.status_code == 422
