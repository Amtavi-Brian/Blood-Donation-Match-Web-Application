import LoginForm from "../../componenets/forms/LoginForm";

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">

        <h2>Log in to your account</h2>
        <LoginForm />
      </div>
    </div>
  );
}