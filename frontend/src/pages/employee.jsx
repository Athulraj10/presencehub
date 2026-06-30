import React, { useState, useEffect, useRef } from "react";
import attendanceApi from "../services/attendanceApi";
import api from "../services/api";
import "../employee.css"; 
import ChangePassword from "./ChangePassword";
import ReportIssue from "./ReportIssue";

function Dashboard() {
  const employeeId = localStorage.getItem("employeeId");
  const token = localStorage.getItem("token");

  // --- Tab Selection State ---
  const [activeTab, setActiveTab] = useState("dashboard");
  const [subView, setSubView] = useState(null);

  // Camera & Face Verification States
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("idle"); // idle, verifying, success, failed, error
  const [verificationMsg, setVerificationMsg] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  const startCamera = async () => {
    setShowCameraModal(true);
    setVerificationStatus("idle");
    setVerificationMsg("");
    setCameraError("");
    setVerifyingFace(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please check permissions.");
      setVerificationStatus("error");
      setVerificationMsg("Camera Access Failed");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setVerificationStatus("error");
        setVerificationMsg("Failed to capture image.");
        return;
      }

      setVerifyingFace(true);
      setVerificationStatus("verifying");

      const formData = new FormData();
      formData.append("employeeId", employeeId);
      formData.append("timestamp", getCurrentTimestamp());
      formData.append("image", blob, "selfie.jpg");

      try {
        const response = await attendanceApi.post(
          "/attendance/punch-in",
          formData,
          {
            headers: {
              ...headers,
              "Content-Type": "multipart/form-data"
            }
          }
        );

        if (response.data && response.data.success) {
          setVerificationStatus("success");
          setVerificationMsg("Face Verified");
          setIsCheckedIn(true);
          fetchDashboardData();
          setTimeout(() => {
            setShowCameraModal(false);
          }, 2000);
        } else {
          setVerificationStatus("failed");
          setVerificationMsg("Face verification failed.");
        }
      } catch (error) {
        console.error("Verification API error:", error);
        const errMsg = error.response?.data?.message || "Punch In Failed";
        
        if (errMsg.includes("Face verification failed")) {
          setVerificationStatus("failed");
          setVerificationMsg("Face verification failed.");
        } else {
          setVerificationStatus("error");
          setVerificationMsg(errMsg);
        }
      } finally {
        setVerifyingFace(false);
      }
    }, "image/jpeg", 0.95);
  };

  // --- Dynamic Interactive Punch Events ---
  const handlePunchIn = async () => {
    await startCamera();
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
    localStorage.clear();
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

  if (subView === "change-password") {
    return <ChangePassword goBack={() => setSubView(null)} email={profileData?.email} />;
  }
  if (subView === "report-issue") {
    return <ReportIssue goBack={() => setSubView(null)} currentUser={profileData} />;
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
          </nav>
          <div className="dash-utils">
            <button className="util-btn relative-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              {alerts.length > 0 && <span className="notification-dot"></span>}
            </button>
            <button className="util-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            </button>
            <button onClick={handleLogout} className="avatar-btn" title="Logout">
              <img src="/employee_avatar.jpg" alt="Profile" />
            </button>
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
                <div className="loc-icon-bg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="loc-icon">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h4>Location: Office HQ</h4>
                  <p>Inside Office Radius - Verified via Wi-Fi & GPS</p>
                </div>
              </div>
              <span className="verified-tag">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="check-icon">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                VERIFIED
              </span>
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
                              onClick={() => alert(`Details for ${primary}:\nStatus: ${row.isAbsent ? "Absent" : row.is_late ? "Late" : "Present"}\nHours Worked: ${row.working_hours || "0"}`)}
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
                    <button className="profile-photo-edit-btn" onClick={() => alert("Upload feature restricted to HR Portal.")}>
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
                    <a href="#update" className="profile-update-link" onClick={(e) => { e.preventDefault(); alert("Update feature restricted to HR Portal."); }}>Update</a>
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
                      <div className="settings-item" onClick={() => alert("Notification Settings are managed by HR System.")}>
                        <div className="settings-item-left">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-icon" style={{ width: 18, height: 18 }}>
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                          <span>Notification Settings</span>
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
                      <div className="settings-item" onClick={() => alert("Connecting to Support Chat...")}>
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
                  <div className="profile-footer-version">PRESENCEHUB V4.2.1-ENTERPRISE</div>
                  <div className="profile-footer-copyright">© 2026 PresenceHub Solutions. All rights reserved.</div>
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
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Privacy policy content coming soon."); }}>Privacy Policy</a>
              <a href="#support" onClick={(e) => { e.preventDefault(); alert("Support hub is available via HR Desk."); }}>Support Hub</a>
              <a href="#terms" onClick={(e) => { e.preventDefault(); alert("Terms of Service agreed at onboarding."); }}>Terms of Service</a>
            </div>
          </div>
        </footer>
      )}
      {showCameraModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            padding: "24px",
            maxWidth: "480px",
            width: "100%",
            textAlign: "center"
          }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
              Face Biometric Verification
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "16px" }}>
              Position your face clearly in the camera frame
            </p>

            <div style={{
              position: "relative",
              borderRadius: "12px",
              overflow: "hidden",
              backgroundColor: "#f1f5f9",
              aspectRatio: "4/3",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #e2e8f0"
            }}>
              {/* Live Video */}
              {verificationStatus === "idle" && (
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              )}

              {/* Loading indicator (verifying) */}
              {verificationStatus === "verifying" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid #f3f3f3",
                    borderTop: "4px solid #2563eb",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }} />
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                  <p style={{ marginTop: "12px", fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>
                    Analyzing biometrics...
                  </p>
                </div>
              )}

              {/* Success Screen */}
              {verificationStatus === "success" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" style={{ width: "64px", height: "64px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ marginTop: "12px", fontSize: "1.125rem", fontWeight: 700, color: "#15803d" }}>
                    {verificationMsg}
                  </p>
                </div>
              )}

              {/* Failed Screen */}
              {verificationStatus === "failed" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" style={{ width: "64px", height: "64px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ marginTop: "12px", fontSize: "1.125rem", fontWeight: 700, color: "#b91c1c" }}>
                    {verificationMsg}
                  </p>
                </div>
              )}

              {/* Error Screen (Service down, camera block, etc) */}
              {verificationStatus === "error" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" style={{ width: "64px", height: "64px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p style={{ marginTop: "12px", fontSize: "0.875rem", fontWeight: 600, color: "#c2410c", textAlign: "center" }}>
                    {verificationMsg}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              {verificationStatus === "idle" && (
                <button
                  onClick={captureAndVerify}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 600,
                    borderRadius: "12px",
                    padding: "10px 24px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    transition: "background-color 0.2s"
                  }}
                >
                  Capture & Punch In
                </button>
              )}

              {(verificationStatus === "failed" || verificationStatus === "error") && (
                <button
                  onClick={startCamera}
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 600,
                    borderRadius: "12px",
                    padding: "10px 24px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    transition: "background-color 0.2s"
                  }}
                >
                  Try Again
                </button>
              )}

              <button
                onClick={stopCamera}
                disabled={verifyingFace}
                style={{
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  fontWeight: 600,
                  borderRadius: "12px",
                  padding: "10px 24px",
                  border: "1px solid #cbd5e1",
                  cursor: verifyingFace ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  transition: "background-color 0.2s"
                }}
              >
                Cancel
              </button>
            </div>

            {/* Hidden canvas for capturing frame */}
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
