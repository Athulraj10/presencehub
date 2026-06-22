import { useState } from "react";
import api from "../services/api";

function Login({
  onLogin,
  onForgotPassword
}) {
    const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
      alert(
        error.response?.data?.message ||
        "Login Failed"
      );
    }
  };

  return (
    <div className="container">
      <h1>PresenceHub Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
      />

      <button onClick={handleLogin}>
        Login
      </button>

      <p
  style={{
    color: "blue",
    cursor: "pointer",
    marginTop: "10px"
  }}
onClick={onForgotPassword}>
  Forgot Password?
</p>
    </div>
  );
}

export default Login;