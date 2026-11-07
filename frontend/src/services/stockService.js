import { apiRequest } from "./apiClient";

export function getHospitalStock(hospitalId) {
  return apiRequest(`/stock/hospitals/${hospitalId}`);
}

export function createStockItem(hospitalId, stock) {
  return apiRequest(`/stock/hospitals/${hospitalId}`, {
    method: "POST",
    body: stock,
  });
}

export function addStockBatch(hospitalId, stockId, batch) {
  return apiRequest(`/stock/hospitals/${hospitalId}/items/${stockId}/batches`, {
    method: "POST",
    body: batch,
  });
}

export function getStockBatches(hospitalId, stockId) {
  return apiRequest(`/stock/hospitals/${hospitalId}/items/${stockId}/batches`);
}

export function issueStock(hospitalId, stockId, quantity) {
  return apiRequest(`/stock/hospitals/${hospitalId}/items/${stockId}/issue`, {
    method: "POST",
    body: { quantity },
  });
}