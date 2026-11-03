import "./public.css";
import DonorRegisterForm from "../../componenets/forms/DonorRegisterForm";

export default function RegisterPage() {
  return (
    <div className="pub-page pub-auth">
      <div className="pub-card">
        <h2>Create Your Donor Account</h2>
        <DonorRegisterForm />
      </div>
    </div>
  );
}