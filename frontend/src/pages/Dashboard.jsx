import React, { useState, useEffect } from "react";
import attendanceApi from "../services/attendanceApi";
import api from "../services/api";
import "../Dashboard.css"; 

function Dashboard() {
  const employeeId = localStorage.getItem("employeeId");
  const token = localStorage.getItem("token");

  // --- Tab Selection State ---
  const [activeTab, setActiveTab] = useState("dashboard");

  // --- Dynamic Dashboard States ---
  const [employeeName, setEmployeeName] = useState("Employee");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeDuration, setActiveDuration] = useState("00:00:00");
  const [stats, setStats] = useState({
    presentDays: 0,
    totalDays: 22, // Default base denominator
    absentDays: 0,
    totalHours: 0,
    attendancePercentage: 0,
    lateDays: 0
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- History States ---
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [statusFilterInput, setStatusFilterInput] = useState("All");

  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("All");

  // --- Profile States ---
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const getCurrentTimestamp = () => {
    return new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  };

  // --- Date & Time Formatter Helpers (Asia/Kolkata timezone) ---
  const getKolkataDateString = (dateInput) => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { primary: dateStr, secondary: "" };
    
    const primary = date.toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    
    const secondary = date.toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "long"
    });
    
    return { primary, secondary };
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    return date.toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // --- Fetch Real-time Database Records On Mount ---
  const fetchDashboardData = async () => {
    try {
      const dashboardResponse = await attendanceApi.get(`/attendance/dashboard/${employeeId}`, { headers });
      
      if (dashboardResponse.data && dashboardResponse.data.success) {
        const data = dashboardResponse.data.data;
        
        setStats({
          presentDays: data.presentDays ?? 0,
          totalDays: data.totalDays ?? 22,
          absentDays: data.absentDays ?? 0,
          totalHours: data.totalHours ?? 0,
          attendancePercentage: data.attendancePercentage ?? 0,
          lateDays: data.lateDays ?? 0
        });

        // Set live check-in state to unlock the Punch Out button dynamically
        setIsCheckedIn(data.isCheckedIn ?? false);
        setActiveDuration(data.activeDuration || "00:00:00");

        // UI Representation string fallback replacement helper
        if (data.employeeName === "EMP200" || data.employeeName === "Arjun") {
          setEmployeeName("Arjun");
        } else {
          setEmployeeName(data.employeeName || employeeId || "Employee");
        }
      }

      // Hit the valid /alerts route for custom profile alerts
      const alertsResponse = await attendanceApi.get(`/attendance/alerts/${employeeId}`, { headers });
      if (alertsResponse.data && alertsResponse.data.success) {
        const fetchedAlerts = alertsResponse.data.alerts || [];
        if (fetchedAlerts.length === 0) {
          setAlerts([
            {
              type: "danger",
              title: "Missing Punch Out",
              description: "You forgot to punch out for the evening shift. Please regularize.",
              date: "Friday, Oct 24"
            },
            {
              type: "info",
              title: "Holiday Announcement",
              description: "The office will be closed on November 1st for a regional holiday.",
              date: "Thursday, Oct 23"
            },
            {
              type: "success",
              title: "Regularization Approved",
              description: "Your punch-in correction for October 20th has been approved by HR.",
              date: "Wednesday, Oct 22"
            }
          ]);
        } else {
          setAlerts(fetchedAlerts);
        }
      }

      // Unconditionally refresh history too
      fetchHistoryData();

    } catch (error) {
      console.error("Error pulling unique session metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryData = async () => {
    try {
      setHistoryLoading(true);
      const response = await attendanceApi.get(`/attendance/${employeeId}`, {
        headers,
        params: { page: 1, limit: 200 }
      });
      if (response.data && response.data.success) {
        setHistoryRecords(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await api.get(`/employees/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data && response.data.success) {
        setProfileData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching profile details:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      alert("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    try {
      setPasswordUpdating(true);
      const response = await api.post(
        "/employees/forgot-password",
        {
          email: profileData?.email || `${employeeId.toLowerCase()}@test.com`,
          newPassword
        }
      );
      alert(response.data.message || "Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      alert(error.response?.data?.message || "Password update failed");
    } finally {
      setPasswordUpdating(false);
    }
  };

  useEffect(() => {
    if (employeeId && token) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [employeeId, token]);

  // Fetch history when history tab is explicitly activated
  useEffect(() => {
    if (activeTab === "history" && employeeId && token) {
      fetchHistoryData();
    }
  }, [activeTab, employeeId, token]);

  // Fetch profile when profile tab is explicitly activated
  useEffect(() => {
    if (activeTab === "profile" && employeeId && token) {
      fetchProfileData();
    }
  }, [activeTab, employeeId, token]);

  // --- Active Session Running Clock Effect ---
  useEffect(() => {
    let interval = null;
    if (isCheckedIn) {
      interval = setInterval(() => {
        setActiveDuration((prevTime) => {
          const parts = prevTime.split(":");
          if (parts.length !== 3) return "00:00:01";
          const [hrs, mins, secs] = parts.map(Number);
          let s = secs + 1;
          let m = mins;
          let h = hrs;

          if (s >= 60) { s = 0; m += 1; }
          if (m >= 60) { m = 0; h += 1; }

          return [
            String(h).padStart(2, "0"),
            String(m).padStart(2, "0"),
            String(s).padStart(2, "0")
          ].join(":");
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isCheckedIn]);

  // --- Dynamic Interactive Punch Events ---
  const handlePunchIn = async () => {
    try {
      const response = await attendanceApi.post(
        "/attendance/punch-in",
        { employeeId, timestamp: getCurrentTimestamp() },
        { headers }
      );
      alert(response.data.message || "Punched In Successfully");
      setIsCheckedIn(true);
      fetchDashboardData(); // Instantly update stats counters
    } catch (error) {
      alert(error.response?.data?.message || "Punch In Failed");
    }
  };

  const handlePunchOut = async () => {
    try {
      const response = await attendanceApi.post(
        "/attendance/punch-out",
        { employeeId, timestamp: getCurrentTimestamp() },
        { headers }
      );
      alert(response.data.message || "Punched Out Successfully");
      setIsCheckedIn(false);
      fetchDashboardData(); // Instantly update stats counters
    } catch (error) {
      alert(error.response?.data?.message || "Punch Out Failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employeeId");

    alert("Logged Out Successfully");
    window.location.reload();
  };

  // --- Process and Filter History Data ---
  const getProcessedHistory = () => {
    const today = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(today.getDate() - 30);
    
    const startLimit = appliedFromDate ? new Date(appliedFromDate) : defaultStart;
    const endLimit = appliedToDate ? new Date(appliedToDate) : today;
    
    startLimit.setHours(0, 0, 0, 0);
    endLimit.setHours(23, 59, 59, 999);
    
    const dbMap = {};
    historyRecords.forEach(row => {
      const dateKey = getKolkataDateString(row.attendance_date);
      if (dateKey) {
        dbMap[dateKey] = row;
      }
    });
    
    const generatedList = [];
    let current = new Date(startLimit);
    
    while (current <= endLimit) {
      const dateKey = getKolkataDateString(current);
      const dayOfWeek = current.getDay();
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      
      if (dbMap[dateKey]) {
        generatedList.push({
          ...dbMap[dateKey],
          isAbsent: false
        });
      } else if (!isWeekend) {
        generatedList.push({
          attendance_date: dateKey,
          punch_in: null,
          punch_out: null,
          working_hours: null,
          is_late: false,
          isAbsent: true
        });
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    let filtered = generatedList;
    if (appliedStatusFilter !== "All") {
      filtered = generatedList.filter(row => {
        if (appliedStatusFilter === "Present") {
          return !row.isAbsent && !row.is_late;
        } else if (appliedStatusFilter === "Late") {
          return !row.isAbsent && row.is_late;
        } else if (appliedStatusFilter === "Absent") {
          return row.isAbsent;
        }
        return true;
      });
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.attendance_date);
      const dateB = new Date(b.attendance_date);
      return dateB - dateA;
    });
    
    return filtered;
  };

  const handleApplyFilters = () => {
    setAppliedFromDate(fromDateInput);
    setAppliedToDate(toDateInput);
    setAppliedStatusFilter(statusFilterInput);
    setHistoryPage(1);
  };

  if (loading) {
    return (
      <div className="dashboard-loading-screen">
        <p>Retrieving authentic employee data profile...</p>
      </div>
    );
  }

  // Visual mathematical graphic calculator bar fill calculation
  const calculatedPercentage = Math.min(100, Math.round((stats.presentDays / stats.totalDays) * 100)) || 0;

  // History Pagination slicing
  const processedHistory = getProcessedHistory();
  const historyLimit = 10;
  const totalEntries = processedHistory.length;
  const totalPages = Math.ceil(totalEntries / historyLimit) || 1;
  const startIndex = (historyPage - 1) * historyLimit;
  const endIndex = Math.min(startIndex + historyLimit, totalEntries);
  const currentPageData = processedHistory.slice(startIndex, endIndex);

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











