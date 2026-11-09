import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  loginUser,
  requestPasswordReset,
  resetPassword,
} from "../../services/authService";
import useAuth from "../../context/useAuth";

const ROLE_HOME = {
  donor: "/donor",
  hospital_staff: "/hospital",
  admin: "/admin",
};

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const justRegistered = location.state?.registered;

  const [values, setValues] = useState({
    email: location.state?.email ?? "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState("login");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const found = {};
    if (!values.email.includes("@")) found.email = "Enter a valid email.";
    if (!values.password) found.password = "Enter your password.";
    return found;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSubmitting(true);
    try {
      const result = await loginUser(values);
      setSession(result);
      navigate(ROLE_HOME[result.user.role] || "/", { replace: true });
    } catch (err) {
      setServerError(err.message || "Unable to log in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRequestReset(e) {
    e.preventDefault();
    setServerError("");

    if (!values.email.includes("@")) {
      setServerError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(values.email);
      setResetMessage(result.message);
      setMode("reset");
    } catch (err) {
      setServerError(err.message || "Unable to request a password reset.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setServerError("");

    if (!/^\d{6}$/.test(resetCode)) {
      setServerError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setServerError("Use a password with at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetPassword({
        email: values.email,
        otp: resetCode,
        newPassword,
      });
      setResetMessage(result.message);
      setMode("login");
      setValues((current) => ({ ...current, password: "" }));
      setResetCode("");
      setNewPassword("");
    } catch (err) {
      setServerError(err.message || "Unable to reset your password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mode === "forgot") {
    return (
      <form onSubmit={handleRequestReset} noValidate>
        <p className="pub-note">
          Enter your account email. If it is eligible, we’ll send a password
          reset code.
        </p>
        <div className={`pub-field ${serverError ? "pub-has-error" : ""}`}>
          <label htmlFor="resetEmail">Email</label>
          <input
            id="resetEmail"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
          />
        </div>
        {serverError && <p className="pub-form-error" role="alert">{serverError}</p>}
        <button className="pub-btn pub-btn-primary pub-btn-block" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset code"}
        </button>
        <button
          type="button"
          className="pub-btn pub-btn-ghost pub-btn-block"
          onClick={() => { setMode("login"); setServerError(""); }}
        >
          Back to log in
        </button>
      </form>
    );
  }

  if (mode === "reset") {
    return (
      <form onSubmit={handleResetPassword} noValidate>
        <p className="pub-note">{resetMessage}</p>
        <div className={`pub-field ${serverError ? "pub-has-error" : ""}`}>
          <label htmlFor="resetCode">6-digit reset code</label>
          <input
            id="resetCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={resetCode}
            onChange={(event) => setResetCode(event.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="pub-field">
          <label htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>
        {serverError && <p className="pub-form-error" role="alert">{serverError}</p>}
        <button className="pub-btn pub-btn-primary pub-btn-block" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Resetting..." : "Reset password"}
        </button>
        <button
          type="button"
          className="pub-btn pub-btn-ghost pub-btn-block"
          disabled={isSubmitting}
          onClick={handleRequestReset}
        >
          Resend reset code
        </button>
        <button
          type="button"
          className="pub-btn pub-btn-ghost pub-btn-block"
          onClick={() => { setMode("login"); setServerError(""); }}
        >
          Back to log in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {justRegistered && (
        <p className="pub-form-success">Account created. You can log in now.</p>
      )}
      {resetMessage && <p className="pub-form-success" role="status">{resetMessage}</p>}

      <div className={`pub-field ${errors.email ? "pub-has-error" : ""}`}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email"
               value={values.email} onChange={handleChange} />
        {errors.email && <p className="pub-field-error" role="alert">{errors.email}</p>}
      </div>

      <div className={`pub-field ${errors.password ? "pub-has-error" : ""}`}>
        <label htmlFor="password">Password</label>
        <div className="pub-password">
          <input id="password" name="password" autoComplete="current-password"
                 type={showPassword ? "text" : "password"}
                 value={values.password} onChange={handleChange} />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-controls="password"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <p className="pub-field-error" role="alert">{errors.password}</p>}
      </div>

      <button
        type="button"
        className="pub-switch"
        onClick={() => { setMode("forgot"); setServerError(""); setResetMessage(""); }}
        style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer" }}
      >
        Forgot password?
      </button>

      {serverError && <p className="pub-form-error" role="alert">{serverError}</p>}

      <button className="pub-btn pub-btn-primary pub-btn-block" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Log in"}
      </button>

      <p className="pub-switch">
        New here? <Link to="/register">Create a donor account</Link>
      </p>
    </form>
  );
}