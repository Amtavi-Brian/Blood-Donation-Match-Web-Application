
from pydantic import BaseModel


class DashboardAnalytics(BaseModel):
    total_users: int
    total_donors: int
    active_donors: int
    total_hospitals: int
    verified_hospitals: int
    total_donations: int
    verified_donations: int
    pending_requests: int
    fulfilled_requests: int
    cancelled_requests: int
    total_blood_stock_quantity: int
    low_stock_items: int


class DonationAnalytics(BaseModel):
    total_donations: int
    verified_donations: int
    unverified_donations: int
    verified_quantity: int


class BloodRequestAnalytics(BaseModel):
    total_requests: int
    pending_requests: int
    fulfilled_requests: int
    cancelled_requests: int
    routine_requests: int
    urgent_requests: int
    emergency_requests: int


class BloodGroupStockSummary(BaseModel):
    blood_group: str
    total_quantity: int
    low_stock_items: int


class BloodStockAnalytics(BaseModel):
    total_stock_items: int
    total_quantity: int
    low_stock_items: int
    blood_groups: list[BloodGroupStockSummary]


class DonorAnalytics(BaseModel):
    total_donors: int
    active_donors: int
    available_donors: int
    consented_donors: int


class HospitalAnalytics(BaseModel):
    total_hospitals: int
    verified_hospitals: int
    unverified_hospitals: int
    total_hospital_staff: int
    authorized_hospital_staff: int
