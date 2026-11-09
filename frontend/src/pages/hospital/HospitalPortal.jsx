import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PortalLayout from "../../componenets/dashboard/PortalLayout";
import useAuth from "../../context/useAuth";
import {
  createHospitalDonation,
  getHospitalDonorMap,
  getHospitalDonations,
  getMyHospitals,
  verifyHospitalDonation,
} from "../../services/hospitalService";
import {
  cancelBloodRequest,
  createBloodRequest,
  getBloodRequests,
  updateBloodRequestStatus,
} from "../../services/requestService";
import {
  addStockBatch,
  createStockItem,
  getHospitalStock,
  getStockBatches,
  issueStock,
} from "../../services/stockService";
import { findDonorsForRequest } from "../../services/matchingService";
import { getUnreadNotificationCount } from "../../services/notificationService";
import { fetchReportSummary } from "../../services/reportService";
import { BLOOD_TYPES } from "../../utils/constants";
import "./HospitalPortal.css";

const COMPONENTS = ["whole_blood", "red_cells", "platelets", "plasma", "cryoprecipitate"];

function messageFrom(error) {
  return error?.message || "The request could not be completed.";
}

function localDateTimeValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
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
  const [donorLocations, setDonorLocations] = useState(null);
  const [stockBatches, setStockBatches] = useState({});
  const [loadingBatches, setLoadingBatches] = useState({});
  const [matchingRequestId, setMatchingRequestId] = useState(null);
  const [loadingDonorLocations, setLoadingDonorLocations] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [requestForm, setRequestForm] = useState({
    blood_group: "O+",
    units_needed: 1,
    urgency: "urgent",
    notes: "",
    needed_by: "",
  });
  const [requestDateMinimum] = useState(() =>
    localDateTimeValue(new Date(Date.now() + 60_000))
  );
  const [stockForm, setStockForm] = useState({
    blood_type: "O+",
    component: "whole_blood",
    threshold: 5,
  });
  const [batchForm, setBatchForm] = useState({
    stockType: "",
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
  const stockTypeOptions = useMemo(() => BLOOD_TYPES.flatMap((bloodType) =>
    COMPONENTS.map((component) => {
      const existingStock = stock.find((item) =>
        item.blood_type === bloodType && item.component === component
      );
      return {
        key: `${bloodType}|${component}`,
        bloodType,
        component,
        existingStock,
      };
    })
  ), [stock]);
  const totalStockUnits = stock.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const lowStockCount = stock.filter((item) =>
    Number(item.threshold) > 0 && Number(item.quantity) <= Number(item.threshold)
  ).length;
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

  useEffect(() => {
    let active = true;
    getUnreadNotificationCount()
      .then((count) => { if (active) setNotificationCount(count); })
      .catch((notificationError) => {
        if (active) setError(messageFrom(notificationError));
      });
    return () => { active = false; };
  }, []);

  async function handleCreateRequest(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await createBloodRequest({
        ...requestForm,
        units_needed: Number(requestForm.units_needed),
        needed_by: requestForm.needed_by
          ? new Date(requestForm.needed_by).toISOString()
          : null,
      });
      setNotice("Blood request submitted.");
      setRequestForm((form) => ({ ...form, notes: "", needed_by: "" }));
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
    if (!hospitalId || !batchForm.stockType) return;
    setBusy(true);
    setError("");
    setNotice("");
    let createdStockType = false;
    try {
      const [bloodType, component] = batchForm.stockType.split("|");
      let stockItem = stock.find((item) =>
        item.blood_type === bloodType && item.component === component
      );
      if (!stockItem) {
        stockItem = await createStockItem(hospitalId, { blood_type: bloodType, component });
        createdStockType = true;
      }
      await addStockBatch(hospitalId, stockItem.stock_id, {
        batch_reference: batchForm.batch_reference,
        quantity: Number(batchForm.quantity),
        expiry_date: new Date(batchForm.expiry_date).toISOString(),
      });
      setNotice("Stock batch recorded.");
      setStockBatches({});
      setBatchForm({ stockType: "", batch_reference: "", quantity: 1, expiry_date: "" });
      await loadData();
    } catch (submitError) {
      if (createdStockType) {
        await loadData();
        setError(`Stock type created, but the batch could not be received: ${messageFrom(submitError)}`);
      } else {
        setError(messageFrom(submitError));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleIssueStock(item) {
    const quantity = Number(window.prompt(`How many ${item.blood_type} units should be issued?`));
    if (!Number.isInteger(quantity) || quantity <= 0) return;
    if (quantity > item.quantity) {
      setError(`Only ${item.quantity} ${item.blood_type} units are currently available.`);
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await issueStock(hospitalId, item.stock_id, quantity);
      setNotice("Stock issue recorded.");
      setStockBatches({});
      await loadData();
    } catch (issueError) {
      setError(messageFrom(issueError));
    } finally {
      setBusy(false);
    }
  }

  async function handleLoadStockBatches(stockId) {
    setError("");
    setLoadingBatches((current) => ({ ...current, [stockId]: true }));
    try {
      const batches = await getStockBatches(hospitalId, stockId);
      setStockBatches((current) => ({ ...current, [stockId]: batches }));
    } catch (batchError) {
      setError(messageFrom(batchError));
    } finally {
      setLoadingBatches((current) => ({ ...current, [stockId]: false }));
    }
  }

  async function handleUpdateRequestStatus(requestId, status) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await updateBloodRequestStatus(requestId, status);
      setNotice(`Request #${requestId} marked ${status}.`);
      await loadData();
    } catch (statusError) {
      setError(messageFrom(statusError));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelRequest(requestId) {
    if (!window.confirm(`Cancel blood request #${requestId}? This cannot be undone.`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await cancelBloodRequest(requestId);
      setNotice(`Request #${requestId} cancelled.`);
      await loadData();
    } catch (cancelError) {
      setError(messageFrom(cancelError));
    } finally {
      setBusy(false);
    }
  }

  async function handleFindMatches(requestId) {
    setError("");
    setMatchingRequestId(requestId);
    try {
      const donorList = await findDonorsForRequest(requestId);
      setMatches((current) => ({ ...current, [requestId]: donorList }));
    } catch (matchError) {
      setError(messageFrom(matchError));
    } finally {
      setMatchingRequestId(null);
    }
  }

  async function handleLoadDonorLocations() {
    if (!hospitalId) return;
    setError("");
    setLoadingDonorLocations(true);
    try {
      setDonorLocations(await getHospitalDonorMap(hospitalId));
    } catch (locationError) {
      setError(messageFrom(locationError));
    } finally {
      setLoadingDonorLocations(false);
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

  async function handleVerifyDonation(donationId) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await verifyHospitalDonation(hospitalId, donationId);
      setNotice(`Donation #${donationId} verified.`);
      await loadData();
    } catch (verificationError) {
      setError(messageFrom(verificationError));
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
      notificationCount={notificationCount}
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
              onChange={(event) => {
                setHospitalId(event.target.value);
                setMatches({});
                setDonorLocations(null);
                setStockBatches({});
              }}
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
                <div><p>Requests</p><strong>{requests.length}</strong></div>
              </article>
              <article className={`hospital-stat ${lowStockCount ? "hospital-stat--low" : "hospital-stat--healthy"}`}>
                <span className="hospital-stat-icon" aria-hidden="true">{lowStockCount ? "⚠" : "✓"}</span>
                <div>
                  <p>Blood Stock</p>
                  <strong>{stock.length === 0 ? "Not configured" : lowStockCount ? "Low" : "Healthy"}</strong>
                </div>
              </article>
              <article className="hospital-stat hospital-stat--donors">
                <span className="hospital-stat-icon" aria-hidden="true">◷</span>
                <div><p>Donations to Verify</p><strong>{donations.filter((donation) => !donation.verified).length}</strong></div>
              </article>
            </section>

            <section className="hospital-dashboard-grid">
              <article className="hospital-panel hospital-stock-panel">
                <h2>Blood Stock Levels</h2>
                {stock.length === 0 ? <p className="hospital-empty">No stock types have been configured yet.</p> : stock.map((item) => {
                  const quantity = Number(item.quantity || 0);
                  const threshold = Number(item.threshold || 0);
                  const percentage = totalStockUnits ? Math.max(4, Math.round(quantity / totalStockUnits * 100)) : 0;
                  const tone = quantity === 0 ? "empty" : quantity <= threshold && threshold > 0 ? "low" : "good";
                  return (
                    <div className="hospital-stock-row" key={item.stock_id}>
                      <div className="hospital-stock-label">
                        <strong>{item.blood_type}</strong>
                        <small>{item.component.replaceAll("_", " ")}</small>
                      </div>
                      <div className="hospital-stock-meter">
                        <span className={`hospital-stock-value is-${tone}`}>{quantity} units</span>
                        <span className="hospital-stock-track"><span className={`is-${tone}`} style={{ width: `${percentage}%` }} /></span>
                      </div>
                      <small className="hospital-stock-threshold">Threshold {threshold}</small>
                    </div>
                  );
                })}
                <p className="hospital-stock-total">{totalStockUnits} total units · {lowStockCount} low-stock items</p>
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
          <section className="hospital-settings">
            <h2>Staff account</h2>
            <dl>
              <div><dt>Name</dt><dd>{user?.full_name || "—"}</dd></div>
              <div><dt>Email</dt><dd>{user?.email || "—"}</dd></div>
              <div><dt>Email verification</dt><dd>{user?.is_email_verified ? "Verified" : "Not verified"}</dd></div>
              <div><dt>Account status</dt><dd>{user?.is_active ? "Active" : "Inactive"}</dd></div>
            </dl>
            <h2>Hospital information</h2>
            {selectedHospital ? (
              <>
                <dl>
                  <div><dt>Hospital</dt><dd>{selectedHospital.name}</dd></div>
                  <div><dt>Address</dt><dd>{selectedHospital.address}</dd></div>
                  <div><dt>City</dt><dd>{selectedHospital.city}</dd></div>
                  <div><dt>Contact phone</dt><dd>{selectedHospital.contact_phone}</dd></div>
                  <div><dt>Verification</dt><dd>{selectedHospital.is_verified ? "Verified" : "Not verified"}</dd></div>
                </dl>
                <p>For changes to hospital details or your staff account, contact a BloodLink administrator.</p>
              </>
            ) : <p>No verified hospital is currently associated with this staff account.</p>}
          </section>
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
                  <select required value={batchForm.stockType} onChange={(e) => setBatchForm({ ...batchForm, stockType: e.target.value })}>
                    <option value="">Select a blood type and component</option>
                    {stockTypeOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.bloodType} · {option.component.replaceAll("_", " ")}
                        {option.existingStock ? "" : " (new stock type)"}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="hospital-batch-help">Selecting a new stock type creates it automatically when you record the batch.</p>
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
                <article key={item.stock_id} style={{ padding: 14, marginBottom: 10, border: "1px solid #ddd", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div><strong>{item.blood_type} · {item.component}</strong><p>{item.quantity} units · low-stock threshold {item.threshold}</p></div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" disabled={busy || item.quantity < 1} onClick={() => handleIssueStock(item)}>Issue stock</button>
                      <button type="button" disabled={loadingBatches[item.stock_id]} onClick={() => handleLoadStockBatches(item.stock_id)}>
                        {loadingBatches[item.stock_id] ? "Loading batches…" : stockBatches[item.stock_id] ? "Refresh batches" : "View batches"}
                      </button>
                    </div>
                  </div>
                  {stockBatches[item.stock_id] && (
                    <div className="hospital-batches">
                      <strong>Batch history</strong>
                      {stockBatches[item.stock_id].length === 0 ? <p>No batches recorded.</p> : (
                        <ul>
                          {stockBatches[item.stock_id].map((batch) => (
                            <li key={batch.batch_id}>
                              {batch.batch_reference} · {batch.remaining_quantity}/{batch.quantity} units remaining · Expires {new Date(batch.expiry_date).toLocaleDateString()}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
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
                <button type="button" disabled={matchingRequestId === request.id} onClick={() => handleFindMatches(request.id)}>
                  {matchingRequestId === request.id ? "Finding donors…" : "Find eligible donors"}
                </button>
                {matches[request.id]?.length > 0 && (
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
                {matches[request.id]?.length === 0 && <p>No matching donors were found.</p>}
              </article>
            ))}
            <h2>Recorded donations awaiting verification</h2>
            {donations.filter((donation) => !donation.verified).length === 0 ? <p>No unverified donation records.</p> : donations.filter((donation) => !donation.verified).map((donation) => (
              <article key={donation.donation_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: 14, marginBottom: 10, border: "1px solid #ddd", borderRadius: 8 }}>
                <p>Donation #{donation.donation_id} · {donation.blood_type} · {donation.quantity} units · Donor #{donation.donor_id}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleVerifyDonation(donation.donation_id)}
                >
                  Verify donation
                </button>
              </article>
            ))}
          </section>
        ) : isDonorSearch ? (
          <section>
            <h2>Donors matched to pending requests</h2>
            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 18 }}>
              <h3>Consented donor locations</h3>
              <p>Approximate locations are shown only for donors who have opted in to location sharing.</p>
              <button type="button" disabled={loadingDonorLocations || !hospitalId} onClick={handleLoadDonorLocations}>
                {loadingDonorLocations ? "Loading locations…" : donorLocations === null ? "Load donor locations" : "Refresh donor locations"}
              </button>
              {donorLocations !== null && (
                donorLocations.length === 0 ? <p>No donors with shared locations are available.</p> : (
                  <ul>
                    {donorLocations.map((location, index) => (
                      <li key={`${location.blood_group}-${location.city}-${index}`}>
                        {location.blood_group} · {location.city || "City not listed"} · Approx. {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
            {requests.filter((request) => request.status === "pending").map((request) => (
              <article key={request.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <h3>{request.blood_group} · {request.units_needed} units</h3>
                <p>{request.urgency} request · {request.notes || "No additional notes"}</p>
                <button type="button" disabled={matchingRequestId === request.id} onClick={() => handleFindMatches(request.id)}>
                  {matchingRequestId === request.id ? "Finding donors…" : "Find eligible donors"}
                </button>
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
                <label>Needed by (optional)
                  <input
                    type="datetime-local"
                    min={requestDateMinimum}
                    value={requestForm.needed_by}
                    onChange={(e) => setRequestForm({ ...requestForm, needed_by: e.target.value })}
                  />
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
                  {request.needed_by && <p>Needed by {new Date(request.needed_by).toLocaleString()}</p>}
                  {request.status === "pending" && (
                    <div className="hospital-request-actions">
                      <button type="button" disabled={busy || matchingRequestId === request.id} onClick={() => handleFindMatches(request.id)}>
                        {matchingRequestId === request.id ? "Finding donors…" : "Find donors"}
                      </button>
                      <button type="button" disabled={busy} onClick={() => handleUpdateRequestStatus(request.id, "fulfilled")}>
                        Mark fulfilled
                      </button>
                      <button type="button" className="is-danger" disabled={busy} onClick={() => handleCancelRequest(request.id)}>
                        Cancel request
                      </button>
                    </div>
                  )}
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
