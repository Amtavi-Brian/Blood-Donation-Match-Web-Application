
"""
Development database seeder for Blood Donation Match.

Creates:
- 40 donor accounts and profiles
- 8 hospital staff accounts
- 2 administrator accounts
- 5 demo hospitals

Safe to run repeatedly: existing records are preserved.
Use only in development/demo environments.
"""

from sqlalchemy import select

from app.db.session import SessionLocal
from app.core.security import hash_password

from app.models.user import User, UserRole
from app.models.donor_profile import DonorProfile, BloodGroup
from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser


DEMO_PASSWORD = "DemoBlood@2026!"


# --------------------------------------------------
# DEMO PEOPLE
# --------------------------------------------------

DONORS = [
    ("Brian Mwangi", "O_POSITIVE", "Nairobi"),
    ("Kevin Otieno", "A_POSITIVE", "Westlands"),
    ("David Kamau", "B_POSITIVE", "Kasarani"),
    ("Samuel Kiptoo", "O_NEGATIVE", "Thika"),
    ("Peter Njoroge", "AB_POSITIVE", "Ruiru"),
    ("James Mutua", "A_NEGATIVE", "Machakos"),
    ("Daniel Ochieng", "O_POSITIVE", "Kibera"),
    ("Joseph Maina", "B_NEGATIVE", "Embakasi"),
    ("Michael Wanjala", "A_POSITIVE", "Kiambu"),
    ("Andrew Kimani", "O_POSITIVE", "Nairobi"),
    ("Faith Wambui", "B_POSITIVE", "Kikuyu"),
    ("Mary Akinyi", "O_NEGATIVE", "Langata"),
    ("Grace Chebet", "A_POSITIVE", "Nakuru"),
    ("Esther Nyambura", "AB_NEGATIVE", "Rongai"),
    ("Joyce Atieno", "O_POSITIVE", "Kasarani"),
    ("Lucy Muthoni", "B_POSITIVE", "Thika"),
    ("Ann Wairimu", "A_NEGATIVE", "Ruiru"),
    ("Mercy Njeri", "O_POSITIVE", "Westlands"),
    ("Catherine Jepkosgei", "AB_POSITIVE", "Nairobi"),
    ("Sarah Wanjiku", "B_NEGATIVE", "Kiambu"),
    ("Dennis Barasa", "A_POSITIVE", "Nairobi"),
    ("Victor Omondi", "O_POSITIVE", "Embakasi"),
    ("George Kibet", "B_POSITIVE", "Machakos"),
    ("Francis Muli", "O_NEGATIVE", "Kikuyu"),
    ("Patrick Ouma", "A_NEGATIVE", "Thika"),
    ("Eric Kipchoge", "AB_POSITIVE", "Rongai"),
    ("Collins Were", "O_POSITIVE", "Nakuru"),
    ("Mark Odhiambo", "B_NEGATIVE", "Kasarani"),
    ("Anthony Kariuki", "A_POSITIVE", "Ruiru"),
    ("Dennis Mutiso", "O_POSITIVE", "Langata"),
    ("Janet Auma", "A_POSITIVE", "Nairobi"),
    ("Diana Wanjiru", "O_POSITIVE", "Kiambu"),
    ("Caroline Chepkoech", "B_POSITIVE", "Westlands"),
    ("Beatrice Adhiambo", "AB_POSITIVE", "Thika"),
    ("Ruth Mumbi", "O_NEGATIVE", "Kasarani"),
    ("Pauline Wekesa", "A_NEGATIVE", "Machakos"),
    ("Susan Naliaka", "B_NEGATIVE", "Ruiru"),
    ("Irene Jepchirchir", "O_POSITIVE", "Nakuru"),
    ("Naomi Akoth", "A_POSITIVE", "Embakasi"),
    ("Elizabeth Wangari", "AB_NEGATIVE", "Nairobi"),
]


HOSPITALS = [
    {
        "name": "Nairobi Central Demo Hospital",
        "registration_number": "DEMO-HOSP-001",
        "address": "Demo Avenue, Nairobi",
        "city": "Nairobi",
        "contact_phone": "+254700000001",
    },
    {
        "name": "Westlands Community Demo Hospital",
        "registration_number": "DEMO-HOSP-002",
        "address": "Demo Road, Westlands",
        "city": "Nairobi",
        "contact_phone": "+254700000002",
    },
    {
        "name": "Kiambu Medical Demo Centre",
        "registration_number": "DEMO-HOSP-003",
        "address": "Demo Street, Kiambu",
        "city": "Kiambu",
        "contact_phone": "+254700000003",
    },
    {
        "name": "Thika Regional Demo Hospital",
        "registration_number": "DEMO-HOSP-004",
        "address": "Demo Lane, Thika",
        "city": "Thika",
        "contact_phone": "+254700000004",
    },
    {
        "name": "Machakos Community Demo Hospital",
        "registration_number": "DEMO-HOSP-005",
        "address": "Demo Road, Machakos",
        "city": "Machakos",
        "contact_phone": "+254700000005",
    },
]


HOSPITAL_STAFF = [
    ("John Mwangi", 1),
    ("Peter Otieno", 1),
    ("Mary Kamau", 2),
    ("Grace Wanjiku", 2),
    ("David Kiptoo", 3),
    ("Esther Njeri", 3),
    ("Samuel Mutua", 4),
    ("Faith Akinyi", 5),
]


ADMINISTRATORS = [
    "System Administrator One",
    "System Administrator Two",
]


# --------------------------------------------------
# DATABASE HELPERS
# --------------------------------------------------

def get_or_create_user(db, full_name, email, role):
    user = db.scalar(
        select(User).where(User.email == email)
    )

    if user:
        if user.role != role:
            raise ValueError(
                f"Existing account {email} has a different role."
            )

        return user, False

    user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(DEMO_PASSWORD),
        role=role,
        is_active=True,
    )

    db.add(user)
    db.flush()

    return user, True


def get_or_create_hospital(db, hospital_data):
    hospital = db.scalar(
        select(Hospital).where(
            Hospital.registration_number
            == hospital_data["registration_number"]
        )
    )

    if hospital:
        return hospital, False

    hospital = Hospital(
        **hospital_data,
        is_verified=True,
    )

    db.add(hospital)
    db.flush()

    return hospital, True


def ensure_donor_profile(db, user, blood_group, city, index):
    profile = db.scalar(
        select(DonorProfile).where(
            DonorProfile.user_id == user.id
        )
    )

    if profile:
        return False

    profile = DonorProfile(
        user_id=user.id,
        blood_group=BloodGroup[blood_group],
        city=city,
        available_to_contact=True,

        # Synthetic demo records only.
        consent_to_contact=True,

        # Do not expose precise donor locations.
        latitude=None,
        longitude=None,
        consent_to_share_location=False,
    )

    db.add(profile)

    return True


def ensure_hospital_staff_link(db, user, hospital):
    association = db.scalar(
        select(HospitalUser).where(
            HospitalUser.user_id == user.id,
            HospitalUser.hospital_id == hospital.id,
        )
    )

    if association:
        # These are designated demo staff accounts.
        association.is_authorized = True
        return False

    association = HospitalUser(
        user_id=user.id,
        hospital_id=hospital.id,
        is_authorized=True,
    )

    db.add(association)

    return True


# --------------------------------------------------
# MAIN SEED FUNCTION
# --------------------------------------------------

def seed_database():
    db = SessionLocal()

    counts = {
        "users_created": 0,
        "users_existing": 0,
        "donor_profiles_created": 0,
        "hospitals_created": 0,
        "staff_links_created": 0,
    }

    try:
        # Create hospitals first.
        hospitals_by_number = {}

        for hospital_data in HOSPITALS:
            hospital, created = get_or_create_hospital(
                db,
                hospital_data,
            )

            hospitals_by_number[
                hospital_data["registration_number"]
            ] = hospital

            if created:
                counts["hospitals_created"] += 1

        # Create 40 donors.
        for index, (name, blood_group, city) in enumerate(
            DONORS,
            start=1,
        ):
            email = f"donor{index:03d}@example.com"

            user, created = get_or_create_user(
                db,
                name,
                email,
                UserRole.DONOR,
            )

            if created:
                counts["users_created"] += 1
            else:
                counts["users_existing"] += 1

            if ensure_donor_profile(
                db,
                user,
                blood_group,
                city,
                index,
            ):
                counts["donor_profiles_created"] += 1

        # Create 8 hospital staff accounts.
        for index, (name, hospital_number) in enumerate(
            HOSPITAL_STAFF,
            start=1,
        ):
            email = f"staff{index:03d}@example.com"

            user, created = get_or_create_user(
                db,
                name,
                email,
                UserRole.HOSPITAL_STAFF,
            )

            if created:
                counts["users_created"] += 1
            else:
                counts["users_existing"] += 1

            hospital = hospitals_by_number[
                f"DEMO-HOSP-{hospital_number:03d}"
            ]

            if ensure_hospital_staff_link(
                db,
                user,
                hospital,
            ):
                counts["staff_links_created"] += 1

        # Create 2 administrators.
        for index, name in enumerate(
            ADMINISTRATORS,
            start=1,
        ):
            email = f"admin{index:03d}@example.com"

            user, created = get_or_create_user(
                db,
                name,
                email,
                UserRole.ADMIN,
            )

            if created:
                counts["users_created"] += 1
            else:
                counts["users_existing"] += 1

        db.commit()

        print("\n====================================")
        print("DATABASE SEEDING COMPLETED")
        print("====================================")
        print(f"New users: {counts['users_created']}")
        print(f"Existing users: {counts['users_existing']}")
        print(
            "New donor profiles: "
            f"{counts['donor_profiles_created']}"
        )
        print(f"New hospitals: {counts['hospitals_created']}")
        print(
            "New hospital staff links: "
            f"{counts['staff_links_created']}"
        )
        print("------------------------------------")
        print("Total demo people: 50")
        print("Total demo hospitals: 5")
        print("------------------------------------")
        print("Demo password:", DEMO_PASSWORD)
        print("====================================\n")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
