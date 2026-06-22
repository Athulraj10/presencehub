import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const [role, setRole] = useState(
    localStorage.getItem("role") || ""
  );

  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  const handleLogin = (userRole) => {
    setRole(userRole);
    setLoggedIn(true);
  };

  if (showForgotPassword) {
    return (
      <ForgotPassword
        goBack={() => setShowForgotPassword(false)}
      />
    );
  }

  return (
    <>
      {loggedIn ? (
        <Dashboard role={role} />
      ) : (
        <Login
          onLogin={handleLogin}
          onForgotPassword={() =>
            setShowForgotPassword(true)
          }
        />
      )}
    </>
  );
}

export default App;