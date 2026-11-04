import { Link } from "react-router-dom";

const STEPS = [
  { title: "Register", text: "Donors sign up with their blood type and area. Hospitals are verified by an admin." },
  { title: "Hospital sends an SOS", text: "When blood is urgently needed, the hospital posts a request." },
  { title: "Matching donors are alerted", text: "Eligible donors nearby are notified of the request." },
  { title: "Accept and donate", text: "A donor accepts, donates, and the hospital records the donation." },
];

export default function LandingPage() {
  return (
    <div>
        <section className="hero">
        <h1>Give Blood. <span>Save Lives.</span></h1>
        <p>
          A blood donation matching platform that connects hospitals and donors
          quickly, for healthier communities.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary">Create donor account</Link>
          <Link to="/login" className="btn btn-outline">Hospital log in</Link>
        </div>
      </section>

      <h2 className="section-title">How it works</h2>
      <section className="steps">
        {STEPS.map((step, index) => (
          <div className="step-card" key={step.title}>
            <div className="step-number">{index + 1}</div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
        ))}
      </section>

      <footer className="landing-footer">
        Protected under Kenya's Data Protection Act
      </footer>
    </div>
  );
}