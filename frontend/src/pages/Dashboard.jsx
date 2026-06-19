import api from "../services/api";

function Dashboard() {
  const employeeId =
    localStorage.getItem("employeeId");

  const token =
    localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const getCurrentTimestamp = () => {
    return new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  };

  const handlePunchIn = async () => {
    try {
      const response = await api.post(
        "/attendance/punch-in",
        {
          employeeId,
          timestamp: getCurrentTimestamp(),
        },
        { headers }
      );

      alert(response.data.message);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Punch In Failed"
      );
    }
  };

  const handlePunchOut = async () => {
    try {
      const response = await api.post(
        "/attendance/punch-out",
        {
          employeeId,
          timestamp: getCurrentTimestamp(),
        },
        { headers }
      );

      alert(response.data.message);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Punch Out Failed"
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employeeId");

    alert("Logged Out Successfully");

    window.location.reload();
  };

  return (
    <div className="container">
      <h1>PresenceHub Dashboard</h1>

      <h2>
        Employee: {employeeId}
      </h2>

      <button onClick={handlePunchIn}>
        Punch In
      </button>

      <button onClick={handlePunchOut}>
        Punch Out
      </button>

      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;











