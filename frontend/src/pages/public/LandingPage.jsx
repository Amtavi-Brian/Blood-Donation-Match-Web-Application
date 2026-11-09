import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getVerifiedHospitalMap } from "../../services/hospitalService";
import "../../styles/global.css";

const STEPS = [
  { number: "01", title: "Join the community", text: "Create a donor profile with your blood type and location." },
  { number: "02", title: "Get matched nearby", text: "Hospitals can reach eligible donors when blood is needed." },
  { number: "03", title: "Make a difference", text: "Respond to a request and help someone get the care they need." },
];

function BloodLinkMark() {
  return (
    <span className="pub-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 38" role="presentation">
        <path d="M16 1.5C13.4 7 3.5 18.1 3.5 25a12.5 12.5 0 0 0 25 0C28.5 18.1 18.6 7 16 1.5Z" fill="currentColor" />
        <path d="M10 25.5a6.2 6.2 0 0 0 6.2 6.2" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="2.4" />
      </svg>
    </span>
  );
}

function VerifiedHospitalLocations() {
  const [locations, setLocations] = useState([]);
  const [city, setCity] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getVerifiedHospitalMap({ city: searchCity || undefined })
      .then((result) => { if (active) setLocations(result); })
      .catch((loadError) => { if (active) setError(loadError.message || "Unable to load hospital locations."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [searchCity]);

  function search(event) {
    event.preventDefault();
    const nextCity = city.trim();
    if (nextCity === searchCity) return;
    setLoading(true);
    setError("");
    setSearchCity(nextCity);
  }

  function clearSearch() {
    setCity("");
    setLoading(true);
    setError("");
    setSearchCity("");
  }

  return (
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px" }} aria-labelledby="hospital-locations-heading">
      <p className="landing-eyebrow">VERIFIED CARE LOCATIONS</p>
      <h2 id="hospital-locations-heading">Find a verified hospital</h2>
      <p>Browse verified hospitals and open their approximate location in your map app.</p>
      <form onSubmit={search} style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "18px 0" }}>
        <label htmlFor="hospital-city">Filter by city</label>
        <input
          id="hospital-city"
          value={city}
          maxLength={100}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Enter a city"
        />
        <button type="submit">Search</button>
        {searchCity && <button type="button" onClick={clearSearch}>Clear</button>}
      </form>
      {error && <p role="alert">{error}</p>}
      {loading ? <p role="status">Loading verified hospitals…</p> : locations.length === 0 ? (
        <p>No verified hospitals were found{searchCity ? ` in ${searchCity}` : ""}.</p>
      ) : (
        <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14, listStyle: "none", padding: 0 }}>
          {locations.map((location) => {
            const mapUrl = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`;
            return (
              <li key={location.id} style={{ background: "#fff", border: "1px solid #eceff4", borderRadius: 12, padding: 16 }}>
                <h3>{location.name}</h3>
                <p>{location.address}, {location.city}</p>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">Open location map</a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function LandingPage() {
  return (
    <main className="pub-page landing-page">
      <header className="pub-header landing-header">
        <Link className="pub-brand" to="/" aria-label="BloodLink home">
          <BloodLinkMark />
          <span>Blood<span>Link</span></span>
        </Link>
        <nav className="pub-nav landing-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#why-bloodlink">Our mission</a>
          <Link className="pub-btn pub-btn-outline" to="/login">Log in</Link>
          <Link className="pub-btn pub-btn-primary" to="/register">Join BloodLink</Link>
        </nav>
      </header>

      <section className="pub-hero landing-hero">
        <div className="landing-copy">
          <p className="landing-eyebrow"><span /> A little kindness goes a long way</p>
          <h1>Give blood.<br /><span>Save lives.</span></h1>
          <p className="landing-intro">
            Connecting hospitals with nearby blood donors. Together, we can make sure help is there when it matters most.
          </p>
          <div className="pub-hero-actions landing-actions">
            <Link className="pub-btn pub-btn-primary" to="/register">Become a donor <span aria-hidden="true">→</span></Link>
            <Link className="pub-btn pub-btn-outline" to="/login">Hospital log in</Link>
          </div>
          <div className="landing-trust">
            <span className="trust-heart" aria-hidden="true">♥</span>
            <span><strong>Every donation matters.</strong><br />Be there for someone in need.</span>
          </div>
        </div>

        <div className="landing-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="donation-card">
            <div className="donation-card-top"><span>YOUR GIFT, THEIR TOMORROW</span><span className="art-heart">♥</span></div>
            <svg className="blood-bag" viewBox="0 0 220 270" role="img" aria-label="A blood donation bag">
              <path d="M93 8h34v20H93z" fill="#c8102e" />
              <path d="M100 28v18m20-18v18" stroke="#c8102e" strokeWidth="5" strokeLinecap="round" />
              <rect x="48" y="46" width="124" height="174" rx="22" fill="#fff" stroke="#f1a4b0" strokeWidth="5" />
              <path d="M53 144h114v52a20 20 0 0 1-20 20H73a20 20 0 0 1-20-20z" fill="#c8102e" />
              <path d="M110 101c-8 15-24 29-24 41a24 24 0 0 0 48 0c0-12-16-26-24-41Z" fill="#c8102e" />
              <path d="M95 145a12 12 0 0 0 12 12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              <path d="M73 239v17h74v-17" fill="none" stroke="#c8102e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M110 256v10" stroke="#c8102e" strokeWidth="5" strokeLinecap="round" />
            </svg>
            <div className="donation-card-caption"><strong>One donation</strong><span>can help save up to 3 lives</span></div>
          </div>
          <div className="floating-note"><span>✦</span><strong>Be someone's<br />reason to hope.</strong></div>
          <div className="landing-art-dot dot-one" /><div className="landing-art-dot dot-two" />
        </div>
      </section>

      <section className="landing-features" id="why-bloodlink">
        <div className="landing-feature"><span className="feature-icon" aria-hidden="true">⌖</span><div><strong>Find nearby donors</strong><p>Connect with people who can help.</p></div></div>
        <div className="landing-feature"><span className="feature-icon" aria-hidden="true">♡</span><div><strong>Get urgent alerts</strong><p>Reach donors when every moment counts.</p></div></div>
        <div className="landing-feature"><span className="feature-icon" aria-hidden="true">✚</span><div><strong>Support local hospitals</strong><p>Help keep blood available for care.</p></div></div>
      </section>

      <VerifiedHospitalLocations />

      <section className="landing-how" id="how-it-works">
        <p className="landing-eyebrow">HOW BLOODLINK WORKS</p>
        <h2>Small steps. <span>Life-changing impact.</span></h2>
        <div className="pub-steps landing-steps">
          {STEPS.map((step) => (
            <article className="pub-step landing-step" key={step.number}>
              <span className="pub-step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div><p className="landing-eyebrow">YOU CAN MAKE A DIFFERENCE</p><h2>Be the reason someone gets another chance.</h2></div>
        <Link className="pub-btn pub-btn-primary" to="/register">Join as a donor <span aria-hidden="true">→</span></Link>
      </section>
      <footer className="pub-footer landing-footer">
        <Link className="pub-brand" to="/"><BloodLinkMark /><span>Blood<span>Link</span></span></Link>
        <span>Connecting hearts. Saving lives. <span className="footer-divider">|</span> Protected under Kenya's Data Protection Act</span>
      </footer>
    </main>
  );
}
