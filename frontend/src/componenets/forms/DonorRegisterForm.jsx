import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/authService";
import { BLOOD_TYPES } from "../../utils/constants";
import { isValidKenyanPhone } from "../../utils/validators";

export default function DonorRegisterForm() {
  const navigate = useNavigate();

  const [values, setValues] = useState({
    fullName: "", phone: "", email: "", password: "", bloodType: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [coords, setCoords] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Your browser doesn't support location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationMessage("Location added.");
      },
      () => setLocationMessage("Couldn't get your location. You can add it later in your profile.")
    );
  }

  function validate() {
    const found = {};
    if (!values.fullName.trim()) found.fullName = "Enter your full name.";
    if (!isValidKenyanPhone(values.phone)) found.phone = "Enter a valid Kenyan number, like 0712 345 678.";
    if (!values.email.includes("@")) found.email = "Enter a valid email.";
    if (values.password.length < 8) found.password = "Use at least 8 characters.";
    if (!values.bloodType) found.bloodType = "Select your blood type.";
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
      await registerUser({
        ...values,
        phone: values.phone.replace(/\s/g, ""),
        location: coords,
      });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={`pub-field ${errors.fullName ? "pub-has-error" : ""}`}>
        <label htmlFor="fullName">Full name</label>
        <input id="fullName" name="fullName" autoComplete="name"
               value={values.fullName} onChange={handleChange} />
        {errors.fullName && <p className="pub-field-error" role="alert">{errors.fullName}</p>}
      </div>

      <div className={`pub-field ${errors.phone ? "pub-has-error" : ""}`}>
        <label htmlFor="phone">Phone number</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0712 345 678"
               value={values.phone} onChange={handleChange} />
        {errors.phone && <p className="pub-field-error" role="alert">{errors.phone}</p>}
      </div>

      <div className={`pub-field ${errors.email ? "pub-has-error" : ""}`}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email"
               value={values.email} onChange={handleChange} />
        {errors.email && <p className="pub-field-error" role="alert">{errors.email}</p>}
      </div>

      <div className={`pub-field ${errors.password ? "pub-has-error" : ""}`}>
        <label htmlFor="password">Password</label>
        <div className="pub-password">
          <input id="password" name="password" autoComplete="new-password"
                 type={showPassword ? "text" : "password"}
                 value={values.password} onChange={handleChange} />
          <button type="button" onClick={() => setShowPassword((v) => !v)}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <p className="pub-field-error" role="alert">{errors.password}</p>}
      </div>

      <div className={`pub-field ${errors.bloodType ? "pub-has-error" : ""}`}>
        <label htmlFor="bloodType">Blood type</label>
        <select id="bloodType" name="bloodType" value={values.bloodType} onChange={handleChange}>
          <option value="">Select blood type</option>
          {BLOOD_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {errors.bloodType && <p className="pub-field-error" role="alert">{errors.bloodType}</p>}
      </div>

      <button type="button" className="pub-btn pub-btn-ghost pub-btn-block" onClick={handleUseLocation}>
        Use my current location
      </button>
      <p className="pub-location-msg">{locationMessage}</p>

      {serverError && <p className="pub-form-error" role="alert">{serverError}</p>}

      <button className="pub-btn pub-btn-primary pub-btn-block" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create Account"}
      </button>

      <p className="pub-note">Protected under Kenya's Data Protection Act</p>
      <p className="pub-switch">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}