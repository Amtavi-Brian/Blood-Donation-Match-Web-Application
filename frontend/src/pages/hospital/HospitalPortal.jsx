import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PortalLayout from "../../componenets/dashboard/PortalLayout";
import useAuth from "../../context/useAuth";
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
import "./HospitalPortal.css";

const COMPONENTS = ["whole_blood", "red_cells", "platelets", "plasma", "cryoprecipitate"];

function messageFrom(error) {
  return error?.message || "The request could not be completed.";
}

export default function HospitalPortal() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
  const isDashboardPage = pathname === "/hospital" || pathname === "/hospital/" || pathname === "/hospital/dashboard";

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

  const selectedHospital = hospitals.find((hospital) => String(hospital.id) === String(hospitalId));
  const stockLevels = useMemo(() => BLOOD_TYPES.map((bloodType) => {
    const items = stock.filter((item) => item.blood_type === bloodType);
    return {
      bloodType,
      quantity: items.reduce((total, item) => total + Number(item.quantity || 0), 0),
      threshold: items.reduce((total, item) => total + Number(item.threshold || 0), 0),
    };
  }), [stock]);
  const totalStockUnits = stockLevels.reduce((total, item) => total + item.quantity, 0);
  const lowStockCount = stockLevels.filter((item) => item.quantity <= item.threshold && item.threshold > 0).length;
  const recentActivity = useMemo(() => [
    ...requests.map((request) => ({
      id: `request-${request.id}`,
      title: `Blood request sent · ${request.blood_group}`,
      detail: `${request.units_needed} unit${request.units_needed === 1 ? "" : "s"} · ${request.status}`,
      date: request.created_at,
      tone: "red",
    })),
    ...donations.map((donation) => ({
      id: `donation-${donation.donation_id}`,
      title: `Donation recorded · ${donation.blood_type}`,
      detail: `${donation.quantity} unit${donation.quantity === 1 ? "" : "s"}`,
      date: donation.donated_at || donation.created_at,
      tone: "blue",
    })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 3), [requests, donations]);

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
    <PortalLayout
      role="hospital"
      userName={selectedHospital?.name || user?.full_name || "Hospital"}
      userRole="Hospital Staff"
      title={isDashboardPage ? "Hospital Dashboard" : isSettingsPage ? "Hospital Settings" : isAnalyticsPage ? "Analytics" : isStockPage ? "Blood Stock" : isDonorSearch ? "Donor Search" : isDonationsPage ? "Record Donation" : "Request Blood"}
      subtitle={isDashboardPage ? `Welcome, ${selectedHospital?.name || "Hospital"}` : "Manage blood requests and inventory for your hospital."}
      navigation={[
        { label: "Dashboard", icon: "⌂", to: "/hospital" },
        { label: "Request Blood", icon: "♧", to: "/hospital/requests" },
        { label: "Donor Search", icon: "⌕", to: "/hospital/search" },
        { label: "Blood Stock", icon: "▣", to: "/hospital/stock" },
        { label: "Record Donation", icon: "▤", to: "/hospital/donations" },
        { label: "Analytics", icon: "▥", to: "/hospital/analytics" },
        { label: "Settings", icon: "⚙", to: "/hospital/settings" },
      ]}
      onLogout={() => {
        logout();
        navigate("/login", { replace: true });
      }}
    >
      <div className={`hospital-portal${isDashboardPage ? " is-hospital-dashboard" : ""}`}>
        {hospitals.length > 1 && (
          <label className="hospital-picker">
            <span>Hospital</span>
            <select
              value={hospitalId}
              onChange={(event) => setHospitalId(event.target.value)}
              disabled={loading}
            >
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>{hospital.name} — {hospital.city}</option>
              ))}
            </select>
          </label>
        )}

        {error && <p className="hospital-feedback is-error" role="alert">{error}</p>}
        {notice && <p className="hospital-feedback is-success" role="status">{notice}</p>}
        {loading ? <p className="hospital-loading" role="status">Loading hospital data…</p> : (
        isDashboardPage ? (
          <div className="hospital-dashboard">
            <section className="hospital-stat-grid" aria-label="Hospital overview">
              <article className="hospital-stat hospital-stat--requests">
                <span className="hospital-stat-icon" aria-hidden="true">♧</span>
                <div><p>Total Requests</p><strong>{requests.length}</strong></div>
              </article>
              <article className={`hospital-stat ${lowStockCount ? "hospital-stat--low" : "hospital-stat--healthy"}`}>
                <span className="hospital-stat-icon" aria-hidden="true">{lowStockCount ? "⚠" : "✓"}</span>
                <div><p>Blood Stock</p><strong>{lowStockCount ? "Low" : "Healthy"}</strong></div>
              </article>
              <article className="hospital-stat hospital-stat--donors">
                <span className="hospital-stat-icon" aria-hidden="true">♟</span>
                <div><p>Donors Matched</p><strong>{Object.values(matches).flat().length}</strong></div>
              </article>
            </section>

            <section className="hospital-dashboard-grid">
              <article className="hospital-panel hospital-stock-panel">
                <h2>Blood Stock Levels</h2>
                {stockLevels.map((item) => {
                  const percentage = totalStockUnits ? Math.max(4, Math.round(item.quantity / totalStockUnits * 100)) : 0;
                  const tone = item.quantity === 0 ? "empty" : item.quantity <= item.threshold && item.threshold > 0 ? "low" : "good";
                  return (
                    <div className="hospital-stock-row" key={item.bloodType}>
                      <strong>{item.bloodType}</strong>
                      <div className="hospital-stock-meter">
                        <span className={`hospital-stock-value is-${tone}`}>{item.quantity} units</span>
                        <span className="hospital-stock-track"><span className={`is-${tone}`} style={{ width: `${percentage}%` }} /></span>
                      </div>
                      <small>{item.quantity} units</small>
                    </div>
                  );
                })}
                <p className="hospital-stock-total">{totalStockUnits} total units · {lowStockCount} low-stock types</p>
              </article>

              <div className="hospital-dashboard-side">
                <article className="hospital-panel hospital-actions-panel">
                  <h2>Quick Actions</h2>
                  <div className="hospital-quick-actions">
                    <button className="hospital-action hospital-action--red" type="button" onClick={() => navigate("/hospital/requests")}><span aria-hidden="true">♥</span>Request Blood</button>
                    <button className="hospital-action hospital-action--blue" type="button" onClick={() => navigate("/hospital/search")}><span aria-hidden="true">⌕</span>Search Donors</button>
                    <button className="hospital-action hospital-action--purple" type="button" onClick={() => navigate("/hospital/stock")}><span aria-hidden="true">▣</span>Update Stock</button>
                  </div>
                </article>
                <article className="hospital-panel hospital-recent-panel">
                  <h2>Recent Activity</h2>
                  {recentActivity.length ? recentActivity.map((item) => (
                    <div className="hospital-activity-row" key={item.id}>
                      <span className={`hospital-activity-icon is-${item.tone}`} aria-hidden="true">{item.tone === "red" ? "♥" : "●"}</span>
                      <div><strong>{item.title}</strong><small>{item.detail}</small></div>
                    </div>
                  )) : <p className="hospital-empty">New requests and donations will appear here.</p>}
                </article>
              </div>
            </section>
          </div>
        ) : isSettingsPage ? (
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
      </div>
    </PortalLayout>
  );
}
