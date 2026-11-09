import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyDonorProfile, updateMyLocation } from "../../services/donorService";

const pageStyle = {
  padding: 30,
  background: "#f8f9fc",
  minHeight: "100%",
  color: "#1f2937",
};

const cardStyle = {
  background: "#fff",
  borderRadius: 12,
  padding: 23,
  marginBottom: 20,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

export default function DonorSettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    getMyDonorProfile()
      .then((result) => { if (active) setProfile(result); })
      .catch((loadError) => { if (active) setError(loadError.message || "Unable to load privacy settings."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function setLocationSharing(enabled) {
    setError("");
    setNotice("");

    let coordinates;
    if (enabled) {
      if (!navigator.geolocation) {
        setError("Location sharing is unavailable because this browser does not support geolocation.");
        return;
      }

      try {
        coordinates = profile?.latitude != null && profile?.longitude != null
          ? { latitude: profile.latitude, longitude: profile.longitude }
          : await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              ({ coords }) => resolve({
                latitude: coords.latitude,
                longitude: coords.longitude,
              }),
              reject,
            );
          });
      } catch {
        setError("Your location could not be retrieved. Allow location access in your browser and try again.");
        return;
      }
    }

    setSaving(true);
    try {
      const result = await updateMyLocation({
        ...(coordinates || {}),
        consent_to_share_location: enabled,
      });
      setProfile((current) => ({
        ...current,
        consent_to_share_location: result.consent_to_share_location,
        ...(enabled ? coordinates : { latitude: null, longitude: null }),
      }));
      setNotice(enabled
        ? "Location sharing is enabled. Your approximate location may be used for donor matching."
        : "Location sharing is disabled and your saved coordinates were cleared.");
    } catch (saveError) {
      setError(saveError.message || "Unable to update location sharing.");
    } finally {
      setSaving(false);
    }
  }

  const sharingLocation = Boolean(profile?.consent_to_share_location);

  return (
    <main style={pageStyle}>
      <h1 style={{ color: "#0b2142", marginBottom: 8 }}>Donor settings</h1>
      <p style={{ color: "#6b7280", marginBottom: 25 }}>
        Manage the privacy setting that is available for your donor account.
      </p>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {notice && <p role="status" style={{ color: "#15803d" }}>{notice}</p>}

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Location sharing</h2>
        <p style={{ color: "#6b7280" }}>
          When enabled, authorized hospitals can use your approximate location
          to identify nearby potential donors. Turning this off clears your
          stored coordinates.
        </p>
        {loading ? (
          <p role="status">Loading your privacy settings…</p>
        ) : (
          <>
            <p>
              Current status: <strong>{sharingLocation ? "On" : "Off"}</strong>
            </p>
            <button
              type="button"
              onClick={() => setLocationSharing(!sharingLocation)}
              disabled={saving}
              style={{
                background: sharingLocation ? "#fff" : "#991b1b",
                color: sharingLocation ? "#991b1b" : "#fff",
                border: "1px solid #991b1b",
                padding: "11px 18px",
                borderRadius: 8,
                cursor: saving ? "wait" : "pointer",
                fontWeight: 600,
              }}
            >
              {saving ? "Saving…" : sharingLocation ? "Turn off location sharing" : "Enable location sharing"}
            </button>
          </>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Password</h2>
        <p style={{ color: "#6b7280" }}>
          Password resets are verified by a one-time email code. Use the
          Forgot password flow on the sign-in page to reset your password.
        </p>
        <Link to="/login" style={{ color: "#991b1b", fontWeight: 600 }}>
          Go to sign in
        </Link>
      </section>
    </main>
  );
}
