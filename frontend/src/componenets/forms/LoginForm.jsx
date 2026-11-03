import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../../services/authService";
import Input from "../ui/Input";
import PasswordInput from "../ui/PasswordInput";
import Button from "../ui/Button";

// Placeholder paths: they must match what AppRoutes defines later.
const ROLE_HOME = { donor: "/donor", hospital: "/hospital", admin: "/admin" };

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered;

  const [values, setValues] = useState({ email: "", password: "" });
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
      localStorage.setItem("token", result.token); // placeholder until AuthContext exists
      navigate(ROLE_HOME[result.user.role] || "/");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {justRegistered && (
        <p className="form-success">Account created. You can log in now.</p>
      )}

      <Input label="Email" name="email" type="email" autoComplete="email"
             value={values.email} onChange={handleChange} error={errors.email} />

      <PasswordInput label="Password" name="password" autoComplete="current-password"
                     value={values.password} onChange={handleChange} error={errors.password} />

      {serverError && <p className="form-error" role="alert">{serverError}</p>}

      <Button type="submit" block disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Log in"}
      </Button>

      <p className="form-switch">
        New here? <Link to="/register">Create a donor account</Link>
      </p>
    </form>
  );
}