import { useState } from "react";
import api from "../services/api";

function ForgotPassword({ goBack }) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] =
    useState("");

  const handleReset = async () => {
    try {
      const response = await api.post(
        "/employees/forgot-password",
        {
          email,
          newPassword,
        }
      );

      alert(response.data.message);

      goBack();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Reset Failed"
      );
    }
  };

  return (
    <div className="container">
      <h1>Forgot Password</h1>

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
        placeholder="New Password"
        value={newPassword}
        onChange={(e) =>
          setNewPassword(
            e.target.value
          )
        }
      />

      <button onClick={handleReset}>
        Reset Password
      </button>

      <button onClick={goBack}>
        Back To Login
      </button>
    </div>
  );
}

export default ForgotPassword;