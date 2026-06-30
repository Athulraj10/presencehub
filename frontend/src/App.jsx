import { useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/employee";
import ForgotPassword from "./pages/ForgotPassword";
import HRDashboard from "./pages/HRDashboard";

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
        localStorage.getItem("role") === "hr" || localStorage.getItem("role") === "admin" ? (
          <HRDashboard />
        ) : (
          <Dashboard />
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