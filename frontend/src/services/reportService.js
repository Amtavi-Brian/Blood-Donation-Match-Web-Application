import { apiRequest } from "./apiClient";

function hospitalReport(path, hospitalId) {
  const query = new URLSearchParams({ hospital_id: String(hospitalId) });
  return apiRequest(`/reports/${path}?${query}`);
}

export function getDashboardReport() {
  return apiRequest("/reports/dashboard");
}

export function getDonationReport(hospitalId) {
  return hospitalReport("donations", hospitalId);
}

export function getBloodRequestReport(hospitalId) {
  return hospitalReport("blood-requests", hospitalId);
}

export function getBloodStockReport(hospitalId) {
  return hospitalReport("blood-stock", hospitalId);
}

export function getDonorReport() {
  return apiRequest("/reports/donors");
}

export function getHospitalReport() {
  return apiRequest("/reports/hospitals");
}

export async function fetchReportSummary(hospitalId) {
  const [stock, requests, donations] = await Promise.all([
    getBloodStockReport(hospitalId),
    getBloodRequestReport(hospitalId),
    getDonationReport(hospitalId),
  ]);
  return { stock, requests, donations };
}