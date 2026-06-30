import { useState } from "react";

import Login from "./pages/Login";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import HRDashboard from "./pages/HR/HRDashboard";
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  const [loggedIn, setLoggedIn] =
    useState(
      !!localStorage.getItem("token")
    );

  const [showForgotPassword,
    setShowForgotPassword] =
    useState(false);

  if (showForgotPassword) {
    return (
      <ForgotPassword
        goBack={() =>
          setShowForgotPassword(false)
        }
      />
    );
  }

  return (
    <>
      {loggedIn ? (
        localStorage.getItem("role") === "admin" ? (
          <AdminDashboard />
        ) : localStorage.getItem("role") === "hr" ? (
          <HRDashboard />
        ) : (
          <EmployeeDashboard />
        )
      ) : (
        <Login
          onLogin={() =>
            setLoggedIn(true)
          }
          onForgotPassword={() =>
            setShowForgotPassword(true)
          }
        />
      )}
    </>
  );
}

export default App;
