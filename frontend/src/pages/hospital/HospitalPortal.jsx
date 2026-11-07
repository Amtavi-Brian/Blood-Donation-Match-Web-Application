import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  createHospitalDonation,
  getHospitalDonations,
  getMyHospitals,
} from "../../services/hospitalService";
import { getBloodRequests, createBloodRequest } from "../../services/requestService";
import {
  addStockBatch,
  createStockItem,
  getHospitalStock,
  issueStock,
} from "../../services/stockService";
import { findDonorsForRequest } from "../../services/matchingService";
import { fetchReportSummary } from "../../services/reportService";
import { BLOOD_TYPES } from "../../utils/constants";

const COMPONENTS = ["whole_blood", "red_cells", "platelets", "plasma", "cryoprecipitate"];

function messageFrom(error) {
  return error?.message || "The request could not be completed.";
}

export default function HospitalPortal() {
  const { pathname } = useLocation();
  const [hospitals, setHospitals] = useState([]);
  const [hospitalId, setHospitalId] = useState("");
  const [requests, setRequests] = useState([]);
  const [stock, setStock] = useState([]);
  const [donations, setDonations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [requestForm, setRequestForm] = useState({
    blood_group: "O+",
    units_needed: 1,
    urgency: "urgent",
    notes: "",
  });
  const [stockForm, setStockForm] = useState({
    blood_type: "O+",
    component: "whole_blood",
    threshold: 5,
  });
  const [batchForm, setBatchForm] = useState({
    stockId: "",
    batch_reference: "",
    quantity: 1,
    expiry_date: "",
  });
  const [donationForm, setDonationForm] = useState({
    donor_id: "",
    blood_type: "O+",
    quantity: 1,
  });

  const isStockPage = pathname.includes("/stock");
  const isDonorSearch = pathname.includes("/search");
  const isDonationsPage = pathname.includes("/donations");
  const isAnalyticsPage = pathname.includes("/analytics");
  const isSettingsPage = pathname.includes("/settings");

  const loadData = useCallback(async (nextHospitalId = hospitalId) => {
    await Promise.resolve();
    setError("");
    setLoading(true);
    try {
      const availableHospitals = await getMyHospitals();
      setHospitals(availableHospitals);
      const resolvedId = nextHospitalId || String(availableHospitals[0]?.id ?? "");
      setHospitalId(resolvedId);
      if (resolvedId) {
        const [requestList, stockList, donationList, reportSummary] = await Promise.all([
          getBloodRequests({ hospitalId: resolvedId }),
          getHospitalStock(resolvedId),
          getHospitalDonations(resolvedId),
          isAnalyticsPage ? fetchReportSummary(resolvedId) : Promise.resolve(null),
        ]);
        setRequests(requestList);
        setStock(stockList);
        setDonations(donationList);
        setAnalytics(reportSummary);
      } else {
        setRequests([]);
        setStock([]);
        setDonations([]);
        setAnalytics(null);
      }
    } catch (loadError) {
      setError(messageFrom(loadError));
    } finally {
      setLoading(false);
    }
  }, [hospitalId, isAnalyticsPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  async function handleCreateRequest(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await createBloodRequest({
        ...requestForm,
        units_needed: Number(requestForm.units_needed),
      });
      setNotice("Blood request submitted.");
      setRequestForm((form) => ({ ...form, notes: "" }));
      await loadData();
    } catch (submitError) {
      setError(messageFrom(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateStock(event) {
    event.preventDefault();
    if (!hospitalId) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await createStockItem(hospitalId, {
        ...stockForm,
        threshold: Number(stockForm.threshold),
      });
      setNotice("Stock item created.");
      await loadData();
    } catch (submitError) {
      setError(messageFrom(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function handleAddBatch(event) {
    event.preventDefault();
    if (!hospitalId || !batchForm.stockId) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await addStockBatch(hospitalId, batchForm.stockId, {
        batch_reference: batchForm.batch_reference,
        quantity: Number(batchForm.quantity),
        expiry_date: new Date(batchForm.expiry_date).toISOString(),
      });
      setNotice("Stock batch recorded.");
      setBatchForm({ stockId: "", batch_reference: "", quantity: 1, expiry_date: "" });
      await loadData();
    } catch (submitError) {
      setError(messageFrom(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function handleIssueStock(item) {
    const quantity = Number(window.prompt(`How many ${item.blood_type} units should be issued?`));
    if (!Number.isInteger(quantity) || quantity <= 0) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await issueStock(hospitalId, item.stock_id, quantity);
      setNotice("Stock issue recorded.");
      await loadData();
    } catch (issueError) {
      setError(messageFrom(issueError));
    } finally {
      setBusy(false);
    }
  }

  async function handleFindMatches(requestId) {
    setError("");
    try {
      const donorList = await findDonorsForRequest(requestId);
      setMatches((current) => ({ ...current, [requestId]: donorList }));
    } catch (matchError) {
      setError(messageFrom(matchError));
    }
  }

  async function handleRecordDonation(event) {
    event.preventDefault();
    if (!hospitalId || !donationForm.donor_id) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await createHospitalDonation(hospitalId, {
        donor_id: Number(donationForm.donor_id),
        blood_type: donationForm.blood_type,
        quantity: Number(donationForm.quantity),
      });
      setNotice("Donation recorded and awaiting verification.");
      setDonationForm((form) => ({ ...form, donor_id: "" }));
      await loadData();
    } catch (submitError) {
      setError(messageFrom(submitError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: "#b91c1c", fontWeight: 700 }}>BLOODLINK / HOSPITAL PORTAL</p>
        <h1>{isSettingsPage ? "Hospital settings" : isAnalyticsPage ? "Hospital analytics" : isStockPage ? "Blood stock" : isDonorSearch ? "Donor matching" : isDonationsPage ? "Record donations" : "Blood requests"}</h1>
        <p>Manage blood requests and inventory through the connected hospital API.</p>
        <nav style={{ display: "flex", gap: 16, marginTop: 16 }}>
          <Link to="/hospital">Requests</Link>
          <Link to="/hospital/stock">Blood stock</Link>
          <Link to="/hospital/search">Donor matches</Link>
          <Link to="/hospital/donations">Donations</Link>
          <Link to="/hospital/analytics">Analytics</Link>
        </nav>
      </header>

      <label style={{ display: "block", maxWidth: 460, marginBottom: 20 }}>
        Hospital
        <select
          value={hospitalId}
          onChange={(event) => {
            setHospitalId(event.target.value);
          }}
          style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
          disabled={loading || hospitals.length === 0}
        >
          {hospitals.length === 0 && <option value="">No verified hospitals found</option>}
          {hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>{hospital.name} — {hospital.city}</option>
          ))}
        </select>
      </label>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {notice && <p role="status" style={{ color: "#166534" }}>{notice}</p>}
      {loading ? <p>Loading hospital data…</p> : (
        isSettingsPage ? (
          <p>Hospital settings are not available through the current backend API.</p>
        ) : isAnalyticsPage ? (
          analytics ? (
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 }}>
              {[
                ["Stock units", analytics.stock.total_quantity],
                ["Low-stock items", analytics.stock.low_stock_items],
                ["Total requests", analytics.requests.total_requests],
                ["Pending requests", analytics.requests.pending_requests],
                ["Fulfilled requests", analytics.requests.fulfilled_requests],
                ["Donation records", analytics.donations.total_donations],
                ["Verified donations", analytics.donations.verified_donations],
                ["Verified units", analytics.donations.verified_quantity],
              ].map(([label, value]) => (
                <article key={label} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 18 }}>
                  <p>{label}</p>
                  <strong style={{ fontSize: 28 }}>{value}</strong>
                </article>
              ))}
            </section>
          ) : <p>No hospital analytics are available.</p>
        ) : isStockPage ? (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginBottom: 24 }}>
              <form onSubmit={handleCreateStock} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
                <h2>Add stock type</h2>
                <label>Blood type
                  <select value={stockForm.blood_type} onChange={(e) => setStockForm({ ...stockForm, blood_type: e.target.value })}>
                    {BLOOD_TYPES.map((type) => <option key={type}>{type}</option>)}
                  </select>
                </label>
                <label>Component
                  <select value={stockForm.component} onChange={(e) => setStockForm({ ...stockForm, component: e.target.value })}>
                    {COMPONENTS.map((component) => <option key={component}>{component}</option>)}
                  </select>
                </label>
                <label>Low-stock threshold
                  <input type="number" min="0" value={stockForm.threshold} onChange={(e) => setStockForm({ ...stockForm, threshold: e.target.value })} />
                </label>
                <button disabled={busy || !hospitalId}>Add stock type</button>
              </form>

              <form onSubmit={handleAddBatch} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
                <h2>Receive a batch</h2>
                <label>Stock type
                  <select required value={batchForm.stockId} onChange={(e) => setBatchForm({ ...batchForm, stockId: e.target.value })}>
                    <option value="">Select stock item</option>
                    {stock.map((item) => <option key={item.stock_id} value={item.stock_id}>{item.blood_type} · {item.component}</option>)}
                  </select>
                </label>
                <label>Batch reference
                  <input required value={batchForm.batch_reference} onChange={(e) => setBatchForm({ ...batchForm, batch_reference: e.target.value })} />
                </label>
                <label>Quantity
                  <input type="number" required min="1" value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })} />
                </label>
                <label>Expiry date
                  <input type="datetime-local" required value={batchForm.expiry_date} onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })} />
                </label>
                <button disabled={busy || !hospitalId}>Record batch</button>
              </form>
            </section>
            <section>
              <h2>Current stock</h2>
              {stock.length === 0 ? <p>No stock items recorded.</p> : stock.map((item) => (
                <article key={item.stock_id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: 14, marginBottom: 10, border: "1px solid #ddd", borderRadius: 8 }}>
                  <div><strong>{item.blood_type} · {item.component}</strong><p>{item.quantity} units · low-stock threshold {item.threshold}</p></div>
                  <button disabled={busy || item.quantity < 1} onClick={() => handleIssueStock(item)}>Issue stock</button>
                </article>
              ))}
            </section>
          </>
        ) : isDonationsPage ? (
          <section>
            <h2>Find and record a donor visit</h2>
            {requests.filter((request) => request.status === "pending").map((request) => (
              <article key={request.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <h3>{request.blood_group} request · {request.units_needed} units</h3>
                <button type="button" onClick={() => handleFindMatches(request.id)}>Find eligible donors</button>
                {(matches[request.id] || []).length > 0 && (
                  <form onSubmit={handleRecordDonation} style={{ display: "grid", gap: 10, maxWidth: 420, marginTop: 12 }}>
                    <label>Donor
                      <select required value={donationForm.donor_id} onChange={(event) => {
                        const donor = matches[request.id].find((item) => String(item.donor_profile_id) === event.target.value);
                        setDonationForm({
                          ...donationForm,
                          donor_id: event.target.value,
                          blood_type: donor?.blood_group || request.blood_group,
                        });
                      }}>
                        <option value="">Select a donor</option>
                        {matches[request.id].map((donor) => (
                          <option key={donor.donor_profile_id} value={donor.donor_profile_id}>
                            {donor.full_name} · {donor.blood_group} · {donor.city || "No city listed"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>Donation quantity
                      <input type="number" min="1" required value={donationForm.quantity} onChange={(event) => setDonationForm({ ...donationForm, quantity: event.target.value })} />
                    </label>
                    <button disabled={busy}>Record donation</button>
                  </form>
                )}
              </article>
            ))}
            <h2>Recorded donations awaiting verification</h2>
            {donations.filter((donation) => !donation.verified).length === 0 ? <p>No unverified donation records.</p> : donations.filter((donation) => !donation.verified).map((donation) => (
              <p key={donation.donation_id}>Donation #{donation.donation_id} · {donation.blood_type} · {donation.quantity} units · Donor #{donation.donor_id}</p>
            ))}
          </section>
        ) : isDonorSearch ? (
          <section>
            <h2>Donors matched to pending requests</h2>
            {requests.filter((request) => request.status === "pending").map((request) => (
              <article key={request.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <h3>{request.blood_group} · {request.units_needed} units</h3>
                <p>{request.urgency} request · {request.notes || "No additional notes"}</p>
                <button onClick={() => handleFindMatches(request.id)}>Find eligible donors</button>
                {matches[request.id]?.map((donor) => (
                  <p key={donor.donor_profile_id}><strong>{donor.full_name}</strong> · {donor.blood_group} · {donor.city || "Location not listed"} · {donor.phone_number || "No phone on file"}</p>
                ))}
                {matches[request.id]?.length === 0 && <p>No matching donors were found.</p>}
              </article>
            ))}
            {requests.filter((request) => request.status === "pending").length === 0 && <p>No pending requests to match.</p>}
          </section>
        ) : (
          <>
            <form onSubmit={handleCreateRequest} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16, marginBottom: 24 }}>
              <h2>Create a blood request</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
                <label>Blood type
                  <select value={requestForm.blood_group} onChange={(e) => setRequestForm({ ...requestForm, blood_group: e.target.value })}>
                    {BLOOD_TYPES.map((type) => <option key={type}>{type}</option>)}
                  </select>
                </label>
                <label>Units needed
                  <input type="number" required min="1" value={requestForm.units_needed} onChange={(e) => setRequestForm({ ...requestForm, units_needed: e.target.value })} />
                </label>
                <label>Urgency
                  <select value={requestForm.urgency} onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}>
                    <option value="routine">Routine</option><option value="urgent">Urgent</option><option value="emergency">Emergency</option>
                  </select>
                </label>
              </div>
              <label>Notes
                <textarea maxLength={2000} value={requestForm.notes} onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })} />
              </label>
              <button disabled={busy || !hospitalId}>Submit request</button>
            </form>
            <section>
              <h2>Hospital requests</h2>
              {requests.length === 0 ? <p>No blood requests have been recorded.</p> : requests.map((request) => (
                <article key={request.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <h3>{request.blood_group} · {request.units_needed} units</h3>
                  <p>{request.urgency} · {request.status} · {request.notes || "No notes"}</p>
                  {request.status === "pending" && <button onClick={() => handleFindMatches(request.id)}>Find donors</button>}
                </article>
              ))}
            </section>
          </>
        )
      )}
    </main>
  );
}
