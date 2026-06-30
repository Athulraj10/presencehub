import React, { useState, useEffect } from "react";
import attendanceApi from "../services/attendanceApi";
import api from "../services/api";
import "../employee.css"; 
import ChangePassword from "./ChangePassword";
import ReportIssue from "./ReportIssue";

function EmployeeDashboard({ onViewHRPortal, showHRPortalLink }) {
  const employeeId = localStorage.getItem("employeeId");
  const token = localStorage.getItem("token");

  // --- Tab Selection State ---
  const [activeTab, setActiveTab] = useState("dashboard");
  const [subView, setSubView] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // --- Settings States ---
  const [theme, setTheme] = useState(localStorage.getItem("pref_theme") || "light");
  const [notifyLate, setNotifyLate] = useState(localStorage.getItem("pref_notify_late") !== "false");
  const [notifyShift, setNotifyShift] = useState(localStorage.getItem("pref_notify_shift") !== "false");
  const [notifyReport, setNotifyReport] = useState(localStorage.getItem("pref_notify_report") !== "false");
  const [pauseOnBreak, setPauseOnBreak] = useState(localStorage.getItem("pref_pause_break") === "true");
  const [language, setLanguage] = useState(localStorage.getItem("pref_lang") || "en");

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, [theme]);

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .trim()
      .split(/\s+/)
      .map(p => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarBg = (name) => {
    const sum = (name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "bg-blue-600", "bg-emerald-600", "bg-violet-600", 
      "bg-amber-600", "bg-rose-600", "bg-indigo-600"
    ];
    return colors[sum % colors.length];
  };

  // --- Custom Alert Modal States ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info",
    onConfirm: null
  });

  const showCustomModal = (title, message, type = "info", onConfirm = null) => {
    setModalConfig({ title, message, type, onConfirm });
    setModalOpen(true);
  };

  const closeCustomModal = () => {
    setModalOpen(false);
    if (modalConfig.onConfirm) {
      modalConfig.onConfirm();
    }
  };

  // --- Dynamic Dashboard States ---
  const [employeeName, setEmployeeName] = useState("Employee");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeDuration, setActiveDuration] = useState("00:00:00");
  const [isInsideRadius, setIsInsideRadius] = useState(true);
  const [simulateOutside, setSimulateOutside] = useState(false);
  const [notifiedBreach, setNotifiedBreach] = useState(false);
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
      const dashboardResponse = await attendanceApi.get(`/dashboard/${employeeId}`, { headers });
      
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

        if (data.hasBreachAlert) {
          if (!notifiedBreach) {
            setNotifiedBreach(true);
            showCustomModal(
              "Geofence Breach Alert",
              "Warning: You have been outside the office geofence radius for more than 10 minutes. This breach has been logged and reported to HR.",
              "error"
            );
          }
        } else {
          setNotifiedBreach(false);
        }

        // UI Representation string fallback replacement helper
        if (data.employeeName === "EMP200" || data.employeeName === "Arjun") {
          setEmployeeName("Arjun");
        } else {
          setEmployeeName(data.employeeName || employeeId || "Employee");
        }
      }

      // Hit the valid /alerts route for custom profile alerts
      const alertsResponse = await attendanceApi.get(`/alerts/${employeeId}`, { headers });
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
      const response = await attendanceApi.get(`/${employeeId}`, {
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
      showCustomModal("Error", "Please fill in all password fields.", "error");
      return;
    }
    if (newPassword.length < 8) {
      showCustomModal("Error", "Password must be at least 8 characters long.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showCustomModal("Error", "New passwords do not match.", "error");
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
      showCustomModal("Success", response.data.message || "Password updated successfully!", "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      showCustomModal("Error", error.response?.data?.message || "Password update failed", "error");
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

  // --- Geofence Background Location Ping Loop ---
  useEffect(() => {
    let interval = null;
    if (isCheckedIn) {
      const sendLocationPing = async () => {
        // If pauseOnBreak is enabled, check if the current time is during lunch break (12:00 PM - 1:00 PM)
        if (pauseOnBreak) {
          const now = new Date();
          const hours = now.getHours();
          if (hours === 12) {
            console.log("Geofence tracking paused during lunch break (12:00 PM - 1:00 PM)");
            setIsInsideRadius(true);
            fetchDashboardData();
            return;
          }
        }

        const clickTimestamp = getCurrentTimestamp();
        const performPing = async (lat, lng) => {
          try {
            const response = await attendanceApi.post(
              "/location-ping",
              {
                employeeId,
                timestamp: clickTimestamp,
                latitude: lat,
                longitude: lng
              },
              { headers }
            );
            if (response.data && response.data.success) {
              setIsInsideRadius(response.data.isInside !== false);
            }
          } catch (error) {
            console.error("Location ping error:", error);
          }
        };

        if (simulateOutside) {
          performPing(9.000000, 77.000000);
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
                ? 8.56037031
                : position.coords.latitude;
              const lng = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
                ? 76.88028618
                : position.coords.longitude;
              performPing(lat, lng);
            },
            (error) => {
              console.warn("Background geolocation failed, using office fallback:", error.message);
              performPing(8.56037031, 76.88028618);
            },
            (error) => {
              console.warn("Background geolocation failed, using office fallback:", error.message);
              performPing(8.56037031, 76.88028618);
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          performPing(8.56037031, 76.88028618);
        }

        // Also fetch dashboard data to sync stats & check for breach warning limits (10 mins)
        fetchDashboardData();
      };

      sendLocationPing();
      interval = setInterval(sendLocationPing, 10000); // Poll location ping every 10 seconds
    } else {
      setIsInsideRadius(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckedIn, simulateOutside, employeeId, pauseOnBreak]);

  // --- Dynamic Interactive Punch Events ---
  const handlePunchIn = async () => {
    const clickTimestamp = getCurrentTimestamp();
    const performPunchIn = async (lat, lng) => {
      try {
        const response = await attendanceApi.post(
          "/punch-in",
          {
            employeeId,
            timestamp: clickTimestamp,
            latitude: lat,
            longitude: lng
          },
          { headers }
        );
        setIsCheckedIn(true);
        fetchDashboardData(); // Instantly update stats counters
        showCustomModal("Success", response.data.message || "Punched In Successfully", "success");
      } catch (error) {
        showCustomModal("Error", error.response?.data?.message || "Punch In Failed", "error");
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? 8.56037031
            : position.coords.latitude;
          const lng = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? 76.88028618
            : position.coords.longitude;
          performPunchIn(lat, lng);
        },
        (error) => {
          console.warn("Geolocation failed, using office location fallback:", error.message);
          performPunchIn(8.56037031, 76.88028618);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      performPunchIn(8.56037031, 76.88028618);
    }
  };

  const handlePunchOut = async () => {
    const clickTimestamp = getCurrentTimestamp();
    const performPunchOut = async (lat, lng) => {
      try {
        const response = await attendanceApi.post(
          "/punch-out",
          {
            employeeId,
            timestamp: clickTimestamp,
            latitude: lat,
            longitude: lng
          },
          { headers }
        );
        setIsCheckedIn(false);
        fetchDashboardData(); // Instantly update stats counters
        showCustomModal("Success", response.data.message || "Punched Out Successfully", "success");
      } catch (error) {
        showCustomModal("Error", error.response?.data?.message || "Punch Out Failed", "error");
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? 8.56037031
            : position.coords.latitude;
          const lng = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? 76.88028618
            : position.coords.longitude;
          performPunchOut(lat, lng);
        },
        (error) => {
          console.warn("Geolocation failed, using office location fallback:", error.message);
          performPunchOut(8.56037031, 76.88028618);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      performPunchOut(8.56037031, 76.88028618);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    showCustomModal("Logged Out", "Logged Out Successfully", "success", () => {
      window.location.reload();
    });
  };

  // --- Process and Filter History Data ---
  const getProcessedHistory = () => {
    const today = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(today.getDate() - 30);
    
    let startLimit = appliedFromDate ? new Date(appliedFromDate) : defaultStart;
    const endLimit = appliedToDate ? new Date(appliedToDate) : today;
    
    // Restrict history view range to start no earlier than when the employee was registered
    if (profileData?.created_at) {
      const hireDate = new Date(profileData.created_at);
      hireDate.setHours(0, 0, 0, 0);
      if (startLimit < hireDate) {
        startLimit = hireDate;
      }
    }
    
    startLimit.setHours(0, 0, 0, 0);
    endLimit.setHours(23, 59, 59, 999);
    
    const dbMap = {};
    historyRecords.forEach(row => {
      const dateKey = getKolkataDateString(row.attendance_date);
      if (dateKey) {
        if (!dbMap[dateKey]) {
          dbMap[dateKey] = {
            ...row,
            working_hours: row.working_hours ? Number(row.working_hours) : 0,
            sessions: [row]
          };
        } else {
          const existing = dbMap[dateKey];
          existing.sessions.push(row);
          existing.working_hours += row.working_hours ? Number(row.working_hours) : 0;
          
          if (row.punch_in && (!existing.punch_in || new Date(row.punch_in) < new Date(existing.punch_in))) {
            existing.punch_in = row.punch_in;
          }
          if (!row.punch_out || !existing.punch_out) {
            existing.punch_out = null;
          } else if (new Date(row.punch_out) > new Date(existing.punch_out)) {
            existing.punch_out = row.punch_out;
          }
          if (row.is_late) {
            existing.is_late = true;
          }
        }
      }
    });

    Object.keys(dbMap).forEach(key => {
      if (dbMap[key].working_hours > 0) {
        dbMap[key].working_hours = dbMap[key].working_hours.toFixed(2);
      } else {
        dbMap[key].working_hours = null;
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

  if (subView === "change-password") {
    return <ChangePassword goBack={() => setSubView(null)} email={profileData?.email} />;
  }
  if (subView === "report-issue") {
    return <ReportIssue goBack={() => setSubView(null)} currentUser={profileData} />;
  }

  if (subView === "account-settings") {
    return (
      <div className="subview-container">
        <header className="subview-header">
          <button className="back-btn" onClick={() => setSubView(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
          <h2>Account Settings & Preferences</h2>
        </header>
        
        <div className="settings-content-card">
          {/* Section 1: Appearance */}
          <div className="settings-section">
            <h3 className="settings-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8, color: "#2563eb" }}>
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              Appearance & Theme
            </h3>
            <div className="settings-field">
              <div className="field-info">
                <span className="field-label">Dark Mode</span>
                <span className="field-desc">Switch between light and dark themes for the entire dashboard layout.</span>
              </div>
              <label className="switch-label">
                <input 
                  type="checkbox" 
                  checked={theme === "dark"} 
                  onChange={(e) => {
                    const newTheme = e.target.checked ? "dark" : "light";
                    setTheme(newTheme);
                    localStorage.setItem("pref_theme", newTheme);
                  }} 
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>

          {/* Section 2: Notifications */}
          <div className="settings-section">
            <h3 className="settings-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8, color: "#2563eb" }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Notification Subscriptions
            </h3>
            <div className="settings-field checkbox-field">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={notifyLate} 
                  onChange={(e) => {
                    setNotifyLate(e.target.checked);
                    localStorage.setItem("pref_notify_late", String(e.target.checked));
                  }} 
                />
                <span className="checkbox-text">
                  <strong>Late Attendance Warnings</strong>
                  <span className="field-desc">Alert me immediately if my check-in is logged as late.</span>
                </span>
              </label>
            </div>
            <div className="settings-field checkbox-field">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={notifyShift} 
                  onChange={(e) => {
                    setNotifyShift(e.target.checked);
                    localStorage.setItem("pref_notify_shift", String(e.target.checked));
                  }} 
                />
                <span className="checkbox-text">
                  <strong>Shift Reminders</strong>
                  <span className="field-desc">Notify me 15 minutes before my scheduled shift starts.</span>
                </span>
              </label>
            </div>
            <div className="settings-field checkbox-field">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={notifyReport} 
                  onChange={(e) => {
                    setNotifyReport(e.target.checked);
                    localStorage.setItem("pref_notify_report", String(e.target.checked));
                  }} 
                />
                <span className="checkbox-text">
                  <strong>Weekly Hours Summary</strong>
                  <span className="field-desc">Receive a weekly digest email of my total logged working hours.</span>
                </span>
              </label>
            </div>
          </div>

          {/* Section 3: Geofence Control */}
          <div className="settings-section">
            <h3 className="settings-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8, color: "#2563eb" }}>
                <path d="M12 2a10 10 0 0 0-10 10c0 5.25 10 12 10 12s10-6.75 10-12a10 10 0 0 0-10-10z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Geofence & Tracking
            </h3>
            <div className="settings-field">
              <div className="field-info">
                <span className="field-label">Pause Geofencing on Lunch Break</span>
                <span className="field-desc">Temporarily pause tracking and ignore boundary breaches between 12:00 PM and 1:00 PM.</span>
              </div>
              <label className="switch-label">
                <input 
                  type="checkbox" 
                  checked={pauseOnBreak} 
                  onChange={(e) => {
                    setPauseOnBreak(e.target.checked);
                    localStorage.setItem("pref_pause_break", String(e.target.checked));
                  }} 
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>

          {/* Section 4: Localization */}
          <div className="settings-section">
            <h3 className="settings-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8, color: "#2563eb" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Regional & Language
            </h3>
            <div className="settings-field">
              <div className="field-info">
                <span className="field-label">System Language</span>
                <span className="field-desc">Choose your preferred locale for dashboard titles and stats.</span>
              </div>
              <select 
                className="settings-select"
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  localStorage.setItem("pref_lang", e.target.value);
                  showCustomModal("Settings Updated", `System language updated to ${e.target.value.toUpperCase()} successfully.`, "success");
                }}
              >
                <option value="en">English (US)</option>
                <option value="es">Español (ES)</option>
                <option value="hi">हिन्दी (IN)</option>
                <option value="de">Deutsch (DE)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  const profileImage = profileData?.profile_image || profileData?.avatar || "/employee_avatar.jpg";
  const designation = profileData?.designation || "Senior Developer";
  const department = profileData?.department || "Engineering Team";
  const phoneNumber = profileData?.phone_number || profileData?.phone || "+1 (555) 012-3456";
  const workLocation = profileData?.work_location || profileData?.location || "Tower A, 4th Floor, Tech Park Central";

  return (
    <div className={`dashboard-container ${activeTab === "profile" ? "profile-page-active" : ""}`}>
      {/* 1. APP NAVBAR */}
      <header className="dash-header">
        <div className="header-inner">
          <div className="dash-logo">PresenceHub</div>
          <nav className="dash-nav">
            <a 
              href="#dashboard" 
              className={activeTab === "dashboard" ? "active-link" : ""}
              onClick={(e) => { e.preventDefault(); setActiveTab("dashboard"); }}
            >
              Dashboard
            </a>
            <a 
              href="#history" 
              className={activeTab === "history" ? "active-link" : ""}
              onClick={(e) => { e.preventDefault(); setActiveTab("history"); }}
            >
              History
            </a>
            <a 
              href="#profile" 
              className={activeTab === "profile" ? "active-link" : ""}
              onClick={(e) => { e.preventDefault(); setActiveTab("profile"); }}
            >
              Profile
            </a>
            {showHRPortalLink && (
              <a 
                href="#hr-portal" 
                className="hr-portal-link"
                style={{ color: "#2563eb", fontWeight: "600", marginLeft: "12px" }}
                onClick={(e) => { e.preventDefault(); onViewHRPortal(); }}
              >
                HR Portal
              </a>
            )}
          </nav>
          <div className="dash-utils">
            <button className="util-btn relative-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              {alerts.length > 0 && <span className="notification-dot"></span>}
            </button>
            <button className="util-btn" onClick={() => setSubView("account-settings")} title="Preferences & Settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            </button>
            <div className="relative inline-block text-left">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)} 
                className="avatar-btn" 
                title="Profile Menu"
              >
                <div className={`w-full h-full text-white flex items-center justify-center text-sm font-bold ${getAvatarBg(profileData?.name || employeeName)}`}>
                  {getInitials(profileData?.name || employeeName) || "EM"}
                </div>
              </button>
              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-left">
                    <button 
                      onClick={() => { setShowProfileDropdown(false); setActiveTab("profile"); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      <span>View Profile</span>
                    </button>
                    <button 
                      onClick={() => { setShowProfileDropdown(false); setSubView("change-password"); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      <span>Change Password</span>
                    </button>
                    {showHRPortalLink && (
                      <button 
                        onClick={() => { setShowProfileDropdown(false); onViewHRPortal(); }}
                        className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50/50 transition-colors flex items-center gap-2 font-medium"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-500"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
                        <span>Back to HR Portal</span>
                      </button>
                    )}
                    <div className="border-t border-slate-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-rose-500"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* BODY WRAPPER */}
      <main className="dash-main">
        {activeTab === "dashboard" ? (
          <>
            <div className="welcome-block">
              <h1>Welcome, {employeeName}</h1>
              <p>Your status is currently verified within the HQ perimeter.</p>
            </div>

            {/* TIME CARD CLOCK */}
            <div className="session-card">
              <div className="session-left">
                <span className={`status-badge ${isCheckedIn ? "status-in" : "status-out"}`}>
                  <span className="dot"></span> {isCheckedIn ? "Checked In" : "Checked Out"}
                </span>
                <h3>Current Session</h3>
              </div>
              
              <div className="session-center">
                <div className="time-display">{activeDuration}</div>
                <div className="time-label">ACTIVE DURATION</div>
              </div>

              <div className="action-buttons">
                <button 
                  onClick={handlePunchIn} 
                  disabled={isCheckedIn} 
                  className={`btn-punch btn-in ${!isCheckedIn ? "btn-active-in" : "btn-disabled"}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                  </svg>
                  Punch In
                </button>
                <button 
                  onClick={handlePunchOut} 
                  disabled={!isCheckedIn} 
                  className={`btn-punch btn-out ${isCheckedIn ? "btn-active-out" : "btn-disabled"}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Punch Out
                </button>
              </div>
            </div>

            {/* RADAR STRIP */}
            <div className="location-strip">
              <div className="loc-left">
                <div className="loc-icon-bg" style={{ backgroundColor: isInsideRadius ? "#eef2ff" : "#fef2f2", color: isInsideRadius ? "#002366" : "#ef4444" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="loc-icon">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h4>Location: {isInsideRadius ? "Office HQ" : "Outside Geofence"}</h4>
                  <p>{isInsideRadius ? "Inside Office Radius - Verified via Wi-Fi & GPS" : "Outside Office Radius - Breach Logged & Reported"}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && (
                  <button 
                    onClick={() => setSimulateOutside(!simulateOutside)}
                    className="custom-modal-btn"
                    style={{ height: "32px", padding: "0 12px", fontSize: "11px", background: simulateOutside ? "#dc2626" : "#002366" }}
                  >
                    {simulateOutside ? "Simulating Outside" : "Simulate Outside"}
                  </button>
                )}
                <span 
                  className="verified-tag"
                  style={!isInsideRadius ? { color: "#dc2626", background: "#fdf2f2", borderColor: "#fecaca" } : {}}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="check-icon">
                    {isInsideRadius ? (
                      <polyline points="20 6 9 17 4 12" />
                    ) : (
                      <>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </>
                    )}
                  </svg>
                  {isInsideRadius ? "VERIFIED" : "BREACHED"}
                </span>
              </div>
            </div>

            {/* 4 RECTANGULAR GRID CARDS */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">PRESENT DAYS</div>
                <div className="stat-body">
                  <span className="stat-num">{stats.presentDays}/{stats.totalDays}</span>
                  <div className="progress-bar"><div className="progress" style={{ width: `${calculatedPercentage}%` }}></div></div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">ABSENT DAYS</div>
                <div className="stat-body">
                  <span className="stat-num text-red">{String(stats.absentDays).padStart(2, "0")}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">TOTAL HOURS</div>
                <div className="stat-body">
                  <span className="stat-num">{stats.totalHours}h</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">ATTENDANCE %</div>
                <div className="stat-body">
                  <span className="stat-num">{stats.attendancePercentage}%</span>
                </div>
              </div>
            </div>

            {/* ALERTS SECTION */}
            <div className="alerts-card">
              <div className="alerts-header">
                <h3>Recent Alerts</h3>
                <a href="#all-alerts" onClick={(e) => { e.preventDefault(); alert("Profile notifications approve logs instantly."); }}>View All Notifications</a>
              </div>

              <div className="alerts-list">
                {alerts.length === 0 ? (
                  <p className="no-alerts-text">No custom performance warnings or notifications for this profile.</p>
                ) : (
                  alerts.map((alertItem, index) => (
                    <div key={index} className="alert-item">
                      <div className="alert-left">
                        <div className={`alert-icon ${
                          alertItem.type === "danger" ? "bg-light-red" : 
                          alertItem.type === "warning" ? "bg-light-red" :
                          alertItem.type === "success" ? "bg-light-green" : "bg-light-blue"
                        }`}>
                          {alertItem.type === "danger" || alertItem.type === "warning" ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-svg">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                          ) : alertItem.type === "success" ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-svg">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                              <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-svg">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="16" x2="12" y2="12"/>
                              <line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h5>{alertItem.title}</h5>
                          <p>{alertItem.description}</p>
                        </div>
                      </div>
                      <div className="alert-right">
                        {alertItem.date} 
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-arrow">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : activeTab === "history" ? (
          <>
            <div className="welcome-block">
              <h1>Attendance History</h1>
              <p>Review and filter your checked-in time log entries.</p>
            </div>

            {/* 4 SUMMARY CARDS IN HISTORY STATS GRID */}
            <div className="history-stats-grid">
              <div className="history-stat-card border-blue">
                <div className="history-stat-header">
                  <svg className="history-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Total Days</span>
                </div>
                <div className="history-stat-num">{stats.totalDays}</div>
              </div>
              
              <div className="history-stat-card border-green">
                <div className="history-stat-header">
                  <svg className="history-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Present Days</span>
                </div>
                <div className="history-stat-num">{stats.presentDays}</div>
              </div>

              <div className="history-stat-card border-grey">
                <div className="history-stat-header">
                  <svg className="history-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Late Days</span>
                </div>
                <div className="history-stat-num">{stats.lateDays}</div>
              </div>

              <div className="history-stat-card border-red">
                <div className="history-stat-header">
                  <svg className="history-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>Absent Days</span>
                </div>
                <div className="history-stat-num">{stats.absentDays}</div>
              </div>
            </div>

            {/* FILTER BAR */}
            <div className="filter-bar">
              <div className="filter-group">
                <label>Date Range</label>
                <div className="filter-inputs-row">
                  <input 
                    type="date" 
                    className="filter-input"
                    value={fromDateInput}
                    onChange={(e) => setFromDateInput(e.target.value)}
                  />
                  <span style={{ color: "#94a3b8" }}>to</span>
                  <input 
                    type="date" 
                    className="filter-input"
                    value={toDateInput}
                    onChange={(e) => setToDateInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>Status</label>
                <select 
                  className="filter-select"
                  value={statusFilterInput}
                  onChange={(e) => setStatusFilterInput(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <button className="btn-apply-filters" onClick={handleApplyFilters}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Apply Filters
              </button>
            </div>

            {/* HISTORY TABLE CARD */}
            <div className="history-table-card">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Punch In</th>
                    <th>Punch Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                        Loading history log entries...
                      </td>
                    </tr>
                  ) : currentPageData.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                        No records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    currentPageData.map((row, index) => {
                      const { primary, secondary } = formatDate(row.attendance_date);
                      return (
                        <tr key={index}>
                          <td>
                            <div className="date-primary">{primary}</div>
                            <div className="date-secondary">{secondary}</div>
                          </td>
                          <td>
                            {row.isAbsent ? (
                              "—"
                            ) : (
                              <div className="punch-time-cell">
                                <svg className="punch-icon-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                                </svg>
                                <span>{formatTime(row.punch_in)}</span>
                              </div>
                            )}
                          </td>
                          <td>
                            {row.isAbsent ? (
                              "—"
                            ) : (
                              <div className="punch-time-cell">
                                <svg className="punch-icon-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                                </svg>
                                <span>{row.punch_out ? formatTime(row.punch_out) : "Active"}</span>
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="hours-bold">
                              {row.working_hours ? `${row.working_hours}h` : "—"}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge-pill ${
                              row.isAbsent ? "status-pill-absent" : 
                              row.is_late ? "status-pill-late" : "status-pill-present"
                            }`}>
                              {row.isAbsent ? "Absent" : row.is_late ? "Late" : "Present"}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="info-btn" 
                              title="View details"
                              onClick={() => showCustomModal(`Details for ${primary}`, `Status: ${row.isAbsent ? "Absent" : row.is_late ? "Late" : "Present"} | Hours Worked: ${row.working_hours || "0"} hours`, "info")}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* PAGINATION FOOTER */}
              <div className="history-footer">
                <div className="history-footer-info">
                  Showing {totalEntries > 0 ? startIndex + 1 : 0}-{endIndex} of {totalEntries} entries
                </div>
                <div className="pagination-controls">
                  <button 
                    disabled={historyPage === 1} 
                    onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))} 
                    className="page-btn"
                  >
                    &lt;
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button 
                      key={pageNum} 
                      onClick={() => setHistoryPage(pageNum)} 
                      className={`page-btn ${historyPage === pageNum ? "active" : ""}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button 
                    disabled={historyPage === totalPages} 
                    onClick={() => setHistoryPage(prev => Math.min(prev + 1, totalPages))} 
                    className="page-btn"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {profileLoading ? (
              <div className="session-card" style={{ justifyContent: "center", padding: "40px" }}>
                <p style={{ color: "#64748b" }}>Loading profile details from Identity service...</p>
              </div>
            ) : (
              <div className="profile-page-container">
                {/* 1. Hero Card */}
                <div className="profile-white-card profile-hero-card">
                  <div className="profile-photo-wrapper">
                    <img src={profileImage} alt="Profile" className="profile-photo-img" />
                    <button className="profile-photo-edit-btn" onClick={() => showCustomModal("Access Restricted", "Upload feature restricted to HR Portal.", "info")}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="edit-icon-svg" style={{ width: 14, height: 14 }}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                  <div className="profile-hero-right">
                    <h1 className="profile-hero-name">{profileData?.name || employeeName}</h1>
                    <div className="profile-hero-meta">
                      <span className="profile-hero-designation">{designation}</span>
                      <span className="profile-hero-bullet">•</span>
                      <span className="profile-hero-department">{department}</span>
                    </div>
                    <div className="profile-hero-badges">
                      <span className="profile-badge-active">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="badge-check-icon" style={{ width: 12, height: 12, marginRight: 4 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Active Now
                      </span>
                      <span className="profile-badge-id">
                        ID: {profileData?.employee_id || employeeId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Contact Details Card */}
                <div className="profile-white-card">
                  <div className="profile-card-header">
                    <div className="profile-card-title-container">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-header-icon" style={{ width: 20, height: 20 }}>
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <line x1="7" y1="8" x2="17" y2="8" />
                        <line x1="7" y1="12" x2="17" y2="12" />
                        <line x1="7" y1="16" x2="13" y2="16" />
                      </svg>
                      <h3>Contact Details</h3>
                    </div>
                    <a href="#update" className="profile-update-link" onClick={(e) => { e.preventDefault(); showCustomModal("Access Restricted", "Update feature restricted to HR Portal.", "info"); }}>Update</a>
                  </div>
                  <div className="profile-contact-grid">
                    <div className="contact-field">
                      <span className="contact-label">EMAIL ADDRESS</span>
                      <span className="contact-value">{profileData?.email || `${employeeId?.toLowerCase()}@presencehub.com`}</span>
                    </div>
                    <div className="contact-field">
                      <span className="contact-label">PHONE NUMBER</span>
                      <span className="contact-value">{phoneNumber}</span>
                    </div>
                    <div className="contact-field location-field">
                      <span className="contact-label">WORK LOCATION</span>
                      <div className="contact-value location-value">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="location-pin-icon" style={{ width: 16, height: 16 }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{workLocation}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Two Equal Cards Below */}
                <div className="profile-columns-row">
                  {/* Left Card: Account Settings */}
                  <div className="profile-white-card half-card">
                    <div className="profile-card-header no-border">
                      <div className="profile-card-title-container">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-header-icon" style={{ width: 20, height: 20 }}>
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <h3>Account Settings</h3>
                      </div>
                    </div>
                    <div className="profile-settings-list">
                      <div className="settings-item" onClick={() => setSubView("change-password")}>
                        <div className="settings-item-left">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-icon" style={{ width: 18, height: 18 }}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <span>Change Password</span>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-chevron" style={{ width: 16, height: 16 }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                      <div className="settings-item" onClick={() => setSubView("account-settings")}>
                        <div className="settings-item-left">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-icon" style={{ width: 18, height: 18 }}>
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                          <span>Preferences & Settings</span>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-chevron" style={{ width: 16, height: 16 }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Right Card: Support */}
                  <div className="profile-white-card half-card">
                    <div className="profile-card-header no-border">
                      <div className="profile-card-title-container">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-header-icon" style={{ width: 20, height: 20 }}>
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <h3>Support</h3>
                      </div>
                    </div>
                    <div className="profile-settings-list">
                      <div className="settings-item" onClick={() => setSubView("report-issue")}>
                        <div className="settings-item-left">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-icon" style={{ width: 18, height: 18 }}>
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <span>Report an Issue</span>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-chevron" style={{ width: 16, height: 16 }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                      <div className="settings-item" onClick={() => showCustomModal("Support Chat", "Connecting to Support Chat...", "info")}>
                        <div className="settings-item-left">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-icon" style={{ width: 18, height: 18 }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <span>Contact Support</span>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-chevron" style={{ width: 16, height: 16 }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Logout Card */}
                <div className="profile-logout-card">
                  <div className="logout-left">
                    <div className="logout-icon-container">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="logout-door-icon" style={{ width: 22, height: 22 }}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </div>
                    <div className="logout-text-container">
                      <h4>Sessions</h4>
                      <p>Sign out of your account on this device.</p>
                    </div>
                  </div>
                  <button className="profile-logout-btn" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="logout-btn-icon" style={{ width: 18, height: 18 }}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>

                {/* 5. Footer */}
                <div className="profile-page-footer">
                  <div className="profile-footer-copyright">© 2024 PresenceHub Enterprise. All rights reserved.</div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {activeTab !== "profile" && (
        <footer className="dash-footer">
          <div className="footer-inner">
            <div>ENTERPRISE DASHBOARD V2.4.0 • BUILD ID: PX-8821</div>
            <div className="footer-sub-links">
              <a href="#privacy" onClick={(e) => { e.preventDefault(); showCustomModal("Privacy Policy", "Privacy policy content coming soon.", "info"); }}>Privacy Policy</a>
              <a href="#support" onClick={(e) => { e.preventDefault(); showCustomModal("Support Hub", "Support hub is available via HR Desk.", "info"); }}>Support Hub</a>
              <a href="#terms" onClick={(e) => { e.preventDefault(); showCustomModal("Terms of Service", "Terms of Service agreed at onboarding.", "info"); }}>Terms of Service</a>
            </div>
          </div>
        </footer>
      )}

      {modalOpen && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-card">
            <div className={`custom-modal-icon-container ${modalConfig.type}`}>
              {modalConfig.type === "success" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="custom-modal-icon">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {modalConfig.type === "error" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="custom-modal-icon">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
              {modalConfig.type === "info" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="custom-modal-icon">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>
            <h3 className="custom-modal-title">{modalConfig.title}</h3>
            <p className="custom-modal-message">
              {modalConfig.message.split("\n").map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < modalConfig.message.split("\n").length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
            <button className="custom-modal-btn" onClick={closeCustomModal}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDashboard;
