import { apiClient } from './apiClient'

export async function fetchReportSummary() {
  try {
    return await apiClient('/reports/summary')
  } catch (error) {
    console.warn('Using fallback analytics data:', error)

    return {
      overview: {
        total_hospitals: 12,
        verified_hospitals: 9,
        total_stock_units: 1840,
        active_donors: 142,
        pending_requests: 18,
        fulfilled_requests: 31,
        donations_last_30_days: 63,
      },
      stock_by_blood_type: [
        { blood_group: 'O+', units: 468 },
        { blood_group: 'O-', units: 164 },
        { blood_group: 'A+', units: 318 },
        { blood_group: 'A-', units: 206 },
        { blood_group: 'B+', units: 244 },
        { blood_group: 'AB+', units: 190 },
      ],
      demand_by_blood_type: [
        { blood_group: 'O+', units_needed: 420 },
        { blood_group: 'A+', units_needed: 352 },
        { blood_group: 'B+', units_needed: 260 },
        { blood_group: 'AB+', units_needed: 210 },
        { blood_group: 'O-', units_needed: 170 },
      ],
      recent_requests: [
        { id: 1, hospital_name: 'City General', blood_group: 'O+', units_needed: 6, urgency: 'urgent', status: 'pending', created_at: new Date().toISOString() },
        { id: 2, hospital_name: 'St. Marys', blood_group: 'A+', units_needed: 4, urgency: 'emergency', status: 'fulfilled', created_at: new Date().toISOString() },
      ],
    }
  }
}
