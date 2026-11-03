import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/authService";
import { BLOOD_TYPES } from "../../utils/constants";
import { isValidKenyanPhone } from "../../utils/validators";
import Input from "../ui/Input";
import PasswordInput from "../ui/PasswordInput";
import Select from "../ui/Select";
import Button from "../ui/Button";

export default function DonorRegisterForm() {
  const navigate = useNavigate();

  const [values, setValues] = useState({
    fullName: "", phone: "", email: "", password: "", bloodType: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [coords, setCoords] = useState(null); // { latitude, longitude } or null
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
      <Input label="Full name" name="fullName" autoComplete="name"
             value={values.fullName} onChange={handleChange} error={errors.fullName} />

      <Input label="Phone number" name="phone" type="tel" autoComplete="tel"
             placeholder="0712 345 678"
             value={values.phone} onChange={handleChange} error={errors.phone} />

      <Input label="Email" name="email" type="email" autoComplete="email"
             value={values.email} onChange={handleChange} error={errors.email} />

      <PasswordInput label="Password" name="password" autoComplete="new-password"
                     value={values.password} onChange={handleChange} error={errors.password} />

      <Select label="Blood type" name="bloodType" options={BLOOD_TYPES}
              placeholder="Select blood type"
              value={values.bloodType} onChange={handleChange} error={errors.bloodType} />

      <Button variant="ghost" block onClick={handleUseLocation}>
        Use my current location
      </Button>
      <p className="location-msg">{locationMessage}</p>

      {serverError && <p className="form-error" role="alert">{serverError}</p>}

      <Button type="submit" block disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create Account"}
      </Button>

      <p className="form-note">Protected under Kenya's Data Protection Act</p>
      <p className="form-switch">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}