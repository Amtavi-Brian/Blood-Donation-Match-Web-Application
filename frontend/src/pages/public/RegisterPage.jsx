import { Link } from "react-router-dom";
import DonorRegisterForm from "../../componenets/forms/DonorRegisterForm";
import "../../styles/global.css";

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

export default function RegisterPage() {
  return (
    <main className="pub-page auth-page register-page">
      <Link className="auth-home" to="/" aria-label="Back to BloodLink home">← <span>Back to home</span></Link>
      <section className="pub-auth auth-content">
        <div className="pub-card auth-card register-card">
          <Link className="pub-brand auth-brand" to="/">
            <BloodLinkMark />
            <span>Blood<span>Link</span></span>
          </Link>
          <div className="auth-heading">
            <span className="auth-kicker">BECOME A LIFESAVER</span>
            <h1>Create your donor account</h1>
            <p>Join our community and make a difference.</p>
          </div>
          <DonorRegisterForm />
          <div className="auth-safety"><span>♡</span> Your kindness can give someone more tomorrows.</div>
        </div>
        <p className="auth-legal">Protected under Kenya's Data Protection Act</p>
      </section>
    </main>
  );
}
