import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../../services/authService";
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

  return (
    <form onSubmit={handleSubmit} noValidate>
      {justRegistered && (
        <p className="pub-form-success">Account created. You can log in now.</p>
      )}

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
          <button type="button" onClick={() => setShowPassword((v) => !v)}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <p className="pub-field-error" role="alert">{errors.password}</p>}
      </div>

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