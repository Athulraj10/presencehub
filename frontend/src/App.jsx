import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role") || "");

  const handleLogin = (userRole) => {
    setRole(userRole);
    setLoggedIn(true);
  };

  return (
    <>
      {loggedIn ? (
        <Dashboard role={role} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;