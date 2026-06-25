import "../Login.css";
import { useState } from "react";
import api from "../services/api";

function Login({ onLogin, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await api.post("/employees/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("employeeId", response.data.employeeId);
      localStorage.setItem("role", response.data.role);

      alert("Login Successful");


      onLogin(response.data.role);

    } catch (error) {
      alert(error.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        
        {/* TOP LOGO BOX */}
        <div className="logo-box">
          <svg viewBox="0 0 32 32" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Clean arched shackle */}
            <path d="M11 13V9a5 5 0 1 1 10 0v4" />
            
            {/* Main lock body */}
            <rect x="7" y="13" width="18" height="12" rx="2" ry="2" />
            
            {/* Clear cutout ring over the corner */}
            <circle cx="22" cy="21" r="4.5" fill="#0a2c7f" stroke="#0a2c7f" strokeWidth="1" />
            
            {/* Perfect user profile badge centered inside the cutout */}
            <circle cx="22" cy="19.5" r="1.8" fill="none" stroke="#ffffff" strokeWidth="2" />
            <path d="M18.5 24c0-1 1-2.2 3.5-2.2s3.5 1.2 3.5 2.2" fill="none" stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>
        
        <h1>Welcome</h1>

        <p className="subtitle">
          Authorized access only. Please sign in to your enterprise account.
        </p>

        {/* EMAIL FIELD */}
        <div className="field-block">
          <label htmlFor="email">EMAIL</label>
          <div className="input-box">
            <span className="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M5 17c0-2 4-3 4-3s4 1 4 3" />
                <line x1="15" y1="9" x2="19" y2="9" />
                <line x1="15" y1="13" x2="19" y2="13" />
              </svg>
            </span>
            <input
              id="email"
              type="email"
              placeholder="Enter your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* PASSWORD FIELD */}
        <div className="field-block">
          <div className="field-header">
            <label htmlFor="password">PASSWORD</label>
            <button type="button" className="forgot-link" onClick={onForgotPassword}>
              Forgot Password?
            </button>
          </div>
          <div className="input-box">
            <span className="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "20px", height: "20px" }}>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        <button className="login-btn" onClick={handleLogin}>
          Sign In
          <span aria-hidden="true">→</span>
        </button>

        {/* FOOTER */}
        <div className="footer">
          <p>Security Policy © 2024. All Rights Reserved.</p>
          <div className="footer-links">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "14px", height: "14px", marginRight: "4px", verticalAlign: "middle" }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Support
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "14px", height: "14px", marginRight: "4px", verticalAlign: "middle" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Language
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;