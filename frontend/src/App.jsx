import { useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
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
        <Dashboard />
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