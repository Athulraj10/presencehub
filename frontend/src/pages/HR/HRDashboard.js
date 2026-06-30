import React, { useState, useEffect } from "react";
import { 
  Users, Shield, ClipboardList, AlertCircle, CheckCircle2, 
  Bell, Search, Filter, MoreVertical, Download, Plus, 
  X, Mail, Lock, Eye, EyeOff, GitBranch, Calendar, Clock,
  ArrowRight, Check, Trash2, LogOut, User, ShieldCheck,
  FileText, HelpCircle, KeyRound, Phone, MapPin, Edit, XCircle
} from "lucide-react";
import api from "../../services/api";
import attendanceApi from "../../services/attendanceApi";
import ChangePassword from "../ChangePassword";
import ReportIssue from "../ReportIssue";
import "./HRDashboard.css";

function HRDashboard() {
  const employeeId = localStorage.getItem("employeeId");
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  // Subview State (for full screen subviews: Change Password / Report Issue)
  const [subView, setSubView] = useState(null); // 'change-password' | 'report-issue'

  // Navigation state: "dashboard" | "employees" | "attendance" | "profile"
  const [activeTab, setActiveTab] = useState("dashboard");

  // Profile Dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Data states
  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [dailyAttendance, setDailyAttendance] = useState([]);

  // Time & Date states
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Week Selector state (for Attendance page)
  const [selectedDate, setSelectedDate] = useState(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date())
  );

  // Filter and Search states
  const [empSearch, setEmpSearch] = useState("");
  const [empDeptFilter, setEmpDeptFilter] = useState("All");
  const [empStatusFilter, setEmpStatusFilter] = useState("All");
  const [activeEmpMenu, setActiveEmpMenu] = useState(null);

  // Modal and Drawer states
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showEditEmpModal, setShowEditEmpModal] = useState(false);
  const [showViewDrawer, setShowViewDrawer] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEditAttendanceModal, setShowEditAttendanceModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  // Forms state
  const [addEmpForm, setAddEmpForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    password: "",
    confirmPassword: ""
  });
  const [showAddPass, setShowAddPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [editEmpForm, setEditEmpForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: ""
  });

  const [editAttendanceForm, setEditAttendanceForm] = useState({
    punchIn: "",
    punchOut: "",
    status: "Present"
  });

  // Fetch local date in Koltaka timezone
  const getLocalDateString = (date) => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  };

  // Generate week selector days
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      days.push({
        dateStr: getLocalDateString(d),
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
        dayNum: d.getDate()
      });
    }
    return days;
  };
  const weekDays = getWeekDays();

  // Load stats and list data
  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch logged-in user profile
      if (employeeId && token) {
        const profileRes = await api.get(`/employees/${employeeId}`, { headers });
        if (profileRes.data && profileRes.data.success) {
          setCurrentUser(profileRes.data.data);
        }
      }

      // Fetch all employees
      const empRes = await api.get("/employees", { headers });
      if (empRes.data && empRes.data.success) {
        setEmployees(empRes.data.data || []);
      }

      // Fetch today's attendance
      const todayStr = getLocalDateString(new Date());
      const attendanceRes = await attendanceApi.get(`/attendance/date/${todayStr}`, { headers });
      if (attendanceRes.data && attendanceRes.data.success) {
        setTodayAttendance(attendanceRes.data.data || []);
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForSelectedDate = async () => {
    try {
      setAttendanceLoading(true);
      const res = await attendanceApi.get(`/attendance/date/${selectedDate}`, { headers });
      if (res.data && res.data.success) {
        setDailyAttendance(res.data.data || []);
      }
    } catch (err) {
      console.error("Error loading attendance for date:", err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Clock update
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAttendanceForSelectedDate();
  }, [selectedDate]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.clear();
    alert("Logged Out Successfully");
    window.location.reload();
  };

  // Helper for generating colored initials avatars
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

  const getDesignation = (dept) => {
    if (dept === "Engineering") return "Senior Developer";
    if (dept === "HR") return "HR Specialist";
    if (dept === "IT") return "System Administrator";
    if (dept === "Finance") return "Financial Analyst";
    if (dept === "Marketing") return "Marketing Lead";
    return "Associate";
  };

  const formatDateString = (dateStr) => {
    if (!dateStr) return "Oct 20, 2023"; // Fallback default
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
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

  // Filter Employees
  const filteredEmployees = employees.filter(emp => {
    // Only manage employee role in lists
    const isEmployee = emp.role === "employee" || !emp.role;
    if (!isEmployee) return false;

    const matchesSearch = emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
                          emp.employee_id.toLowerCase().includes(empSearch.toLowerCase());
    const matchesDept = empDeptFilter === "All" || emp.department === empDeptFilter;
    const matchesStatus = empStatusFilter === "All" || (empStatusFilter === "Active"); // Mock active
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Export CSV helper
  const exportEmployeesToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee ID,Name,Email,Department,Designation,Join Date\n";
    filteredEmployees.forEach(emp => {
      const joinDate = formatDateString(emp.created_at);
      const designation = getDesignation(emp.department);
      csvContent += `${emp.employee_id},${emp.name},${emp.email},${emp.department},${designation},${joinDate}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employees_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Actions trigger functions
  const handleViewEmployee = (emp) => {
    setSelectedEmployee(emp);
    setShowViewDrawer(true);
  };

  const handleEditEmployee = (emp) => {
    setSelectedEmployee(emp);
    setEditEmpForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone || "+91 98765 43210",
      department: emp.department,
      designation: emp.designation || getDesignation(emp.department)
    });
    setShowViewDrawer(false);
    setShowEditEmpModal(true);
  };

  const handleDeleteEmployee = async (emp) => {
    if (!window.confirm(`Are you sure you want to delete employee ${emp.name} (${emp.employee_id})?`)) {
      return;
    }
    try {
      const res = await api.delete(`/employees/${emp.employee_id}`, { headers });
      if (res.data && res.data.success) {
        alert("Employee deleted successfully");
        setShowViewDrawer(false);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete employee");
    }
  };

  // Add Employee Form submit
  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (addEmpForm.password !== addEmpForm.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const res = await api.post("/employees/register", {
        employeeId: addEmpForm.employeeId,
        name: addEmpForm.name,
        email: addEmpForm.email,
        department: addEmpForm.department,
        password: addEmpForm.password,
        role: "employee"
      }, { headers });

      if (res.data && res.data.success) {
        alert("Employee registered successfully!");
        setShowAddEmpModal(false);
        setAddEmpForm({
          employeeId: "",
          name: "",
          email: "",
          phone: "",
          department: "",
          designation: "",
          password: "",
          confirmPassword: ""
        });
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  // Edit Employee Form submit
  const handleEditEmployeeSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/employees/${selectedEmployee.employee_id}`, {
        name: editEmpForm.name,
        email: editEmpForm.email,
        department: editEmpForm.department
      }, { headers });

      if (res.data && res.data.success) {
        alert("Employee details updated successfully!");
        setShowEditEmpModal(false);
        setSelectedEmployee(null);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  // Trigger Edit Attendance Modal
  const handleOpenEditAttendance = (record) => {
    // format existing punch times if they exist
    const formatTimeForInput = (dateTimeStr) => {
      if (!dateTimeStr) return "";
      const d = new Date(dateTimeStr);
      if (isNaN(d.getTime())) return "";
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    setSelectedAttendance(record);
    setEditAttendanceForm({
      punchIn: formatTimeForInput(record.punch_in),
      punchOut: formatTimeForInput(record.punch_out),
      status: record.status || "Present"
    });
    setShowEditAttendanceModal(true);
  };

  // Submit Edit Attendance
  const handleEditAttendanceSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await attendanceApi.put("/attendance/update", {
        employeeId: selectedAttendance.employee_id,
        date: selectedDate,
        punchIn: editAttendanceForm.punchIn,
        punchOut: editAttendanceForm.punchOut,
        status: editAttendanceForm.status
      }, { headers });

      if (res.data && res.data.success) {
        alert("Attendance record updated successfully!");
        setShowEditAttendanceModal(false);
        setSelectedAttendance(null);
        fetchAttendanceForSelectedDate();
        loadData(); // Sync today's stats too
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update attendance");
    }
  };

  // Calculate statistics counts
  const totalEmployeesCount = employees.filter(e => e.role === "employee" || !e.role).length;
  const presentTodayCount = todayAttendance.filter(a => a.punch_in && a.status !== "Absent" && a.status !== "Leave").length;
  const leaveTodayCount = todayAttendance.filter(a => a.status === "Leave").length;
  const absentTodayCount = Math.max(0, totalEmployeesCount - presentTodayCount - leaveTodayCount);

  // Present Attendance Percentage
  const calculatedPercentage = totalEmployeesCount > 0 ? Math.round((presentTodayCount / totalEmployeesCount) * 100) : 0;

  // Build daily attendance list
  const attendanceList = employees.filter(e => e.role === "employee" || !e.role).map(emp => {
    const att = dailyAttendance.find(a => a.employee_id === emp.employee_id);
    return {
      employee_id: emp.employee_id,
      name: emp.name,
      department: emp.department,
      punch_in: att ? att.punch_in : null,
      punch_out: att ? att.punch_out : null,
      status: att ? att.status : "Absent"
    };
  });

  // Activity stream for today's logs
  const recentActivities = todayAttendance.map(att => {
    const emp = employees.find(e => e.employee_id === att.employee_id);
    return {
      id: att.id || att.employee_id,
      employee_id: att.employee_id,
      name: emp ? emp.name : "Unknown Employee",
      department: emp ? emp.department : "N/A",
      punch_in: att.punch_in,
      punch_out: att.punch_out,
      status: att.status
    };
  }).slice(0, 5);

  // Subview intercept checks
  if (subView === "change-password") {
    return <ChangePassword goBack={() => setSubView(null)} email={currentUser?.email} />;
  }
  if (subView === "report-issue") {
    return <ReportIssue goBack={() => setSubView(null)} currentUser={currentUser} />;
  }

  return (
    <div className="hr-dashboard-layout">
      {/* 1. APP NAVIGATION BAR */}
      <header className="hr-dash-header">
        <div className="hr-header-inner">
          <div className="hr-dash-logo">PresenceHub</div>
          <nav className="hr-dash-nav">
            <a 
              href="#dashboard" 
              className={activeTab === "dashboard" ? "active-link" : ""}
              onClick={(e) => { e.preventDefault(); setActiveTab("dashboard"); }}
            >
              Dashboard
            </a>
            <a 
              href="#employees" 
              className={activeTab === "employees" ? "active-link" : ""}
              onClick={(e) => { e.preventDefault(); setActiveTab("employees"); }}
            >
              Employees
            </a>
            <a 
              href="#attendance" 
              className={activeTab === "attendance" ? "active-link" : ""}
              onClick={(e) => { e.preventDefault(); setActiveTab("attendance"); }}
            >
              Attendance
            </a>
            <a 
              href="#profile" 
              className={activeTab === "profile" ? "active-link" : ""}
              onClick={(e) => { e.preventDefault(); setActiveTab("profile"); }}
            >
              Profile
            </a>
          </nav>

          <div className="hr-dash-utils">
            <button className="hr-util-btn hr-relative-btn">
              <Bell className="btn-icon" />
              <span className="hr-notification-dot"></span>
            </button>

            {/* Profile Avatar */}
            <div className="hr-user-badge relative">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className={`w-9 h-9 rounded-full overflow-hidden border border-slate-200 focus:outline-none flex items-center justify-center text-white font-bold ${getAvatarBg(currentUser?.name || "HR")}`}
              >
                {currentUser?.name ? getInitials(currentUser.name) : "HR"}
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)}></div>
                  <div className="hr-actions-dropdown" style={{ right: 0, top: "45px" }}>
                    <button 
                      onClick={() => { setShowProfileDropdown(false); setActiveTab("profile"); }}
                    >
                      View Profile
                    </button>
                    <button 
                      onClick={() => { setShowProfileDropdown(false); setSubView("change-password"); }}
                    >
                      Change Password
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="hr-text-red"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="hr-dash-main">
        {loading ? (
          <div className="hr-loading-container">
            <p>Loading HR portal details...</p>
          </div>
        ) : (
          <>
            {/* A. DASHBOARD VIEW */}
            {activeTab === "dashboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
  
 

 <div className="hr-header-row">
  <div className="hr-greeting-block">
    <h1>Good Morning, {currentUser?.name || "HR Manager"}</h1>
    <p>{currentDate} • {currentTime}</p>
  </div>

  <button
    className="hr-btn-primary"
    onClick={() => {
      alert("My Attendance page will be connected after routing is implemented.");
    }}
  >
    My Attendance
  </button>
</div>


                {/* Dashboard Summary Cards */}
                <div className="hr-stats-row horizontal-stats">
                  {/* Card 1: Total Employees */}
                  <div className="hr-stat-card">
                    <div className="hr-stat-card-top">
                      <div className="hr-stat-info">
                        <span className="hr-stat-label">TOTAL EMPLOYEES</span>
                        <span className="hr-stat-value">{totalEmployeesCount}</span>
                      </div>
                      <div className="hr-stat-icon-box bg-blue">
                        <Users className="hr-stat-icon" />
                      </div>
                    </div>
                    <div className="hr-stat-card-bottom" style={{ color: "#64748b" }}>
                      <span>Total registered workforce</span>
                    </div>
                  </div>

                  {/* Card 2: Present Today */}
                  <div className="hr-stat-card">
                    <div className="hr-stat-card-top">
                      <div className="hr-stat-info">
                        <span className="hr-stat-label">PRESENT TODAY</span>
                        <span className="hr-stat-value">{presentTodayCount}</span>
                      </div>
                      <div className="hr-stat-icon-box bg-green">
                        <CheckCircle2 className="hr-stat-icon" />
                      </div>
                    </div>
                    <div className="hr-stat-card-bottom hr-progress-container">
                      <div className="hr-progress-bar">
                        <div className="hr-progress-fill bg-blue" style={{ width: `${calculatedPercentage}%` }}></div>
                      </div>
                      <span className="hr-showing-text" style={{ fontSize: "11px" }}>{calculatedPercentage}% Present</span>
                    </div>
                  </div>

                  {/* Card 3: Absent Today */}
                  <div className="hr-stat-card">
                    <div className="hr-stat-card-top">
                      <div className="hr-stat-info">
                        <span className="hr-stat-label">ABSENT TODAY</span>
                        <span className="hr-stat-value">{absentTodayCount}</span>
                      </div>
                      <div className="hr-stat-icon-box bg-red">
                        <XCircle className="hr-stat-icon" />
                      </div>
                    </div>
                    <div className="hr-stat-card-bottom" style={{ color: "#ef4444" }}>
                      <span>Requires attention</span>
                    </div>
                  </div>

                  {/* Card 4: Leave Today */}
                  <div className="hr-stat-card">
                    <div className="hr-stat-card-top">
                      <div className="hr-stat-info">
                        <span className="hr-stat-label">LEAVE TODAY</span>
                        <span className="hr-stat-value">{leaveTodayCount}</span>
                      </div>
                      <div className="hr-stat-icon-box bg-blue">
                        <Calendar className="hr-stat-icon" />
                      </div>
                    </div>
                    <div className="hr-stat-card-bottom" style={{ color: "#3b82f6" }}>
                      <span>Approved leaves</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Card */}
                <div className="hr-activity-card">
                  <div className="hr-activity-header">
                    <div className="hr-activity-title">
                      <ClipboardList className="hr-title-icon" />
                      <h2>Recent Activity</h2>
                    </div>
                    <button className="hr-view-all-btn" onClick={() => setActiveTab("attendance")}>
                      View Attendance
                    </button>
                  </div>

                  <table className="hr-activity-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivities.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                            No activity logged today.
                          </td>
                        </tr>
                      ) : (
                        recentActivities.map(act => (
                          <tr key={act.id}>
                            <td>
                              <div className="hr-employee-cell">
                                <span className={`hr-avatar-circle ${getAvatarBg(act.name)} text-white`}>
                                  {getInitials(act.name)}
                                </span>
                                <div className="hr-employee-meta">
                                  <span className="hr-employee-name">{act.name}</span>
                                  <span className="hr-employee-id">{act.employee_id}</span>
                                </div>
                              </div>
                            </td>
                            <td>{act.department}</td>
                            <td>{act.punch_in ? formatTime(act.punch_in) : "—"}</td>
                            <td>{act.punch_out ? formatTime(act.punch_out) : act.punch_in ? "Active" : "—"}</td>
                            <td>
                              <span className={`hr-badge ${
                                act.status === "Present" ? "badge-present" :
                                act.status === "Late" ? "badge-late" :
                                act.status === "Leave" ? "badge-leave" : "badge-absent"
                              }`}>
                                {act.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* B. EMPLOYEES PAGE */}
            {activeTab === "employees" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Filters Row */}
                <div className="hr-filters-panel">
                  <div className="hr-search-box">
                    <Search className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Search employee..." 
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                    />
                  </div>

                  <div className="hr-filters-right">
                    <select 
                      value={empDeptFilter} 
                      onChange={(e) => setEmpDeptFilter(e.target.value)}
                    >
                      <option value="All">All Departments</option>
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="IT">IT</option>
                      <option value="Finance">Finance</option>
                      <option value="Marketing">Marketing</option>
                    </select>

                    <select 
                      value={empStatusFilter} 
                      onChange={(e) => setEmpStatusFilter(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>

                    <button 
                      className="hr-btn-primary" 
                      onClick={() => setShowAddEmpModal(true)}
                    >
                      <Plus className="btn-icon" />
                      <span>Add Employee</span>
                    </button>

                    <button 
                      className="hr-btn-secondary" 
                      onClick={exportEmployeesToCSV}
                    >
                      <Download className="btn-icon" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Employees List Table */}
                <div className="hr-table-card">
                  <table className="hr-data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Status</th>
                        <th>Join Date</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                            No employees found.
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map(emp => (
                          <tr key={emp.employee_id}>
                            <td>
                              <div className="hr-employee-cell">
                                <span className={`hr-avatar-circle ${getAvatarBg(emp.name)} text-white`}>
                                  {getInitials(emp.name)}
                                </span>
                                <div className="hr-employee-meta">
                                  <span className="hr-employee-name">{emp.name}</span>
                                  <span className="hr-employee-id">{emp.employee_id}</span>
                                </div>
                              </div>
                            </td>
                            <td>{emp.department}</td>
                            <td>{getDesignation(emp.department)}</td>
                            <td>
                              <span className="hr-badge badge-present">
                                Active
                              </span>
                            </td>
                            <td>{formatDateString(emp.created_at)}</td>
                            <td style={{ textAlign: "right", position: "relative" }}>
                              <button 
                                className="hr-btn-actions-dots"
                                onClick={() => setActiveEmpMenu(activeEmpMenu === emp.employee_id ? null : emp.employee_id)}
                              >
                                <MoreVertical className="btn-icon" />
                              </button>

                              {/* Row Dropdown */}
                              {activeEmpMenu === emp.employee_id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setActiveEmpMenu(null)}></div>
                                  <div className="hr-actions-dropdown">
                                    <button 
                                      onClick={() => { setActiveEmpMenu(null); handleViewEmployee(emp); }}
                                    >
                                      View Employee
                                    </button>
                                    <button 
                                      onClick={() => { setActiveEmpMenu(null); handleEditEmployee(emp); }}
                                    >
                                      Edit Employee
                                    </button>
                                    <button 
                                      className="hr-text-red"
                                      onClick={() => { setActiveEmpMenu(null); handleDeleteEmployee(emp); }}
                                    >
                                      Delete Employee
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Table Footer */}
                  <div className="hr-table-footer">
                    <span className="hr-showing-text">
                      Showing 1 to {filteredEmployees.length} of {filteredEmployees.length} entries
                    </span>
                    <div className="hr-pagination-btns">
                      <button className="hr-page-arrow" disabled>&lt;</button>
                      <button className="hr-btn-pagination active">1</button>
                      <button className="hr-page-arrow" disabled>&gt;</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* C. ATTENDANCE PAGE */}
            {activeTab === "attendance" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Week Selector Strip */}
                <div className="hr-week-strip">
                  {weekDays.map(day => (
                    <div 
                      key={day.dateStr} 
                      className={`hr-week-card ${selectedDate === day.dateStr ? "active" : ""}`}
                      onClick={() => setSelectedDate(day.dateStr)}
                    >
                      <span className="hr-week-day">{day.dayName}</span>
                      <span className="hr-week-date">{day.dayNum}</span>
                    </div>
                  ))}
                </div>

                {/* Attendance stats */}
                <div className="hr-stats-row horizontal-stats">
                  <div className="hr-stat-card border-blue-bottom">
                    <div className="hr-stat-card-top">
                      <div className="hr-stat-info">
                        <span className="hr-stat-label">TOTAL SCHEDULED</span>
                        <span className="hr-stat-value">{totalEmployeesCount}</span>
                      </div>
                      <div className="hr-stat-icon-box bg-blue">
                        <Users className="hr-stat-icon" />
                      </div>
                    </div>
                  </div>

                  <div className="hr-stat-card border-green-bottom">
                    <div className="hr-stat-card-top">
                      <div className="hr-stat-info">
                        <span className="hr-stat-label">PRESENT</span>
                        <span className="hr-stat-value">
                          {attendanceList.filter(a => a.status === "Present" || a.status === "Late").length}
                        </span>
                      </div>
                      <div className="hr-stat-icon-box bg-green">
                        <CheckCircle2 className="hr-stat-icon" />
                      </div>
                    </div>
                  </div>

                  <div className="hr-stat-card border-orange-bottom">
                    <div className="hr-stat-card-top">
                      <div className="hr-stat-info">
                        <span className="hr-stat-label">LATE ARRIVAL</span>
                        <span className="hr-stat-value">
                          {dailyAttendance.filter(a => a.is_late).length}
                        </span>
                      </div>
                      <div className="hr-stat-icon-box bg-red" style={{ background: "#fef3c7", color: "#d97706" }}>
                        <Clock className="hr-stat-icon" />
                      </div>
                    </div>
                  </div>

                  <div className="hr-stat-card border-red-bottom">
                    <div className="hr-stat-card-top">
                      <div className="hr-stat-info">
                        <span className="hr-stat-label">ABSENT</span>
                        <span className="hr-stat-value">
                          {attendanceList.filter(a => a.status === "Absent").length}
                        </span>
                      </div>
                      <div className="hr-stat-icon-box bg-red">
                        <XCircle className="hr-stat-icon" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance logs list */}
                <div className="hr-table-card">
                  {attendanceLoading ? (
                    <div className="hr-loading-container" style={{ padding: "50px 0" }}>
                      <p>Loading attendance record...</p>
                    </div>
                  ) : (
                    <table className="hr-data-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Department</th>
                          <th>Check In</th>
                          <th>Check Out</th>
                          <th>Attendance Status</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceList.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                              No scheduled employees.
                            </td>
                          </tr>
                        ) : (
                          attendanceList.map(record => (
                            <tr key={record.employee_id}>
                              <td>
                                <div className="hr-employee-cell">
                                  <span className={`hr-avatar-circle ${getAvatarBg(record.name)} text-white`}>
                                    {getInitials(record.name)}
                                  </span>
                                  <div className="hr-employee-meta">
                                    <span className="hr-employee-name">{record.name}</span>
                                    <span className="hr-employee-id">{record.employee_id}</span>
                                  </div>
                                </div>
                              </td>
                              <td>{record.department}</td>
                              <td>{record.punch_in ? formatTime(record.punch_in) : "—"}</td>
                              <td>{record.punch_out ? formatTime(record.punch_out) : record.punch_in ? "Active" : "—"}</td>
                              <td>
                                <span className={`hr-badge ${
                                  record.status === "Present" ? "badge-present" :
                                  record.status === "Late" ? "badge-late" :
                                  record.status === "Leave" ? "badge-leave" : "badge-absent"
                                }`}>
                                  {record.status}
                                </span>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <button 
                                  className="hr-btn-secondary" 
                                  style={{ display: "inline-flex", padding: "6px 12px", height: "auto" }}
                                  onClick={() => handleOpenEditAttendance(record)}
                                >
                                  <Edit className="btn-icon" />
                                  <span>Edit</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* D. HR PROFILE PAGE */}
            {activeTab === "profile" && currentUser && (
              <div className="hr-tab-profile">
                {/* Blue Hero Section */}
                <div className="hr-profile-hero">
                  <div className="hr-profile-hero-inner">
                    <div className={`hr-profile-hero-avatar text-white flex items-center justify-center text-4xl font-bold ${getAvatarBg(currentUser.name)}`}>
                      {getInitials(currentUser.name)}
                    </div>
                    <div className="hr-profile-hero-details">
                      <h2>{currentUser.name}</h2>
                      <p className="hr-profile-designation">HR Manager</p>
                      <p className="hr-profile-location">
                        <MapPin style={{ width: "16px", height: "16px", marginRight: "4px" }} />
                        <span>Office HQ</span>
                      </p>
                    </div>
                  </div>
                  <button className="hr-btn-edit-profile" onClick={() => alert("Registration and details update functions are fully aligned.")}>
                    <Edit className="btn-icon" style={{ marginRight: "6px" }} />
                    <span>Edit Profile</span>
                  </button>
                </div>

                {/* Profile Settings Panels */}
                <div className="hr-profile-cards-container">
                  {/* Contact Details */}
                  <div className="hr-table-card" style={{ padding: "24px" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: "700", color: "#002366" }}>Contact Details</h3>
                    <div className="hr-contact-details-form">
                      <div className="hr-input-row-two">
                        <div className="hr-field">
                          <label>EMAIL ADDRESS</label>
                          <div className="hr-disabled-input-box">
                            <Mail className="field-icon" />
                            <input type="text" value={currentUser.email} disabled />
                          </div>
                        </div>

                        <div className="hr-field">
                          <label>PHONE NUMBER</label>
                          <div className="hr-disabled-input-box">
                            <Phone className="field-icon" />
                            <input type="text" value={currentUser.phone || "+91 98765 43210"} disabled />
                          </div>
                        </div>
                      </div>

                      <div className="hr-field full-width">
                        <label>DEPARTMENT</label>
                        <div className="hr-disabled-input-box">
                          <GitBranch className="field-icon" />
                          <input type="text" value={currentUser.department || "HR Operations"} disabled />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account & Security */}
                  <div className="hr-table-card" style={{ padding: "24px" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#002366" }}>Account & Security</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <button 
                        className="hr-btn-secondary" 
                        style={{ justifyContent: "space-between", width: "100%", maxWidth: "350px" }}
                        onClick={() => setSubView("change-password")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <KeyRound className="btn-icon" />
                          <span>Change Password</span>
                        </div>
                        <ArrowRight className="btn-icon" />
                      </button>
                    </div>
                  </div>

                  {/* Support Center */}
                  <div className="hr-table-card" style={{ padding: "24px" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#002366" }}>Support Center</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <button 
                        className="hr-btn-secondary" 
                        style={{ justifyContent: "space-between", width: "100%", maxWidth: "350px" }}
                        onClick={() => setSubView("report-issue")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <FileText className="btn-icon" />
                          <span>Report an Issue</span>
                        </div>
                        <ArrowRight className="btn-icon" />
                      </button>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <button className="hr-profile-signout-btn" onClick={handleLogout}>
                    <LogOut className="btn-icon" style={{ marginRight: "8px" }} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. DRAWERS & MODALS */}

      {/* A. VIEW EMPLOYEE DRAWER */}
      {showViewDrawer && selectedEmployee && (
        <div className="hr-drawer-overlay" onClick={() => setShowViewDrawer(false)}>
          <div className="hr-drawer-box" onClick={(e) => e.stopPropagation()}>
            <div className="hr-drawer-header">
              <h3>Employee Details</h3>
              <button className="hr-drawer-close" onClick={() => setShowViewDrawer(false)}>
                <X className="btn-icon" />
              </button>
            </div>

            <div className="hr-drawer-body">
              <div className="hr-drawer-profile-section">
                <div className={`hr-drawer-avatar text-white flex items-center justify-center text-3xl font-bold ${getAvatarBg(selectedEmployee.name)}`}>
                  {getInitials(selectedEmployee.name)}
                </div>
                <h2>{selectedEmployee.name}</h2>
                <p className="hr-drawer-designation">{getDesignation(selectedEmployee.department)}</p>
              </div>

              <div className="hr-drawer-info-grid">
                <div className="hr-drawer-info-row">
                  <div className="hr-drawer-info-col">
                    <span className="hr-drawer-label">EMPLOYEE ID</span>
                    <span className="hr-drawer-value">{selectedEmployee.employee_id}</span>
                  </div>
                  <div className="hr-drawer-info-col">
                    <span className="hr-drawer-label">STATUS</span>
                    <span className="hr-badge badge-present" style={{ alignSelf: "flex-start" }}>Active</span>
                  </div>
                </div>

                <div className="hr-drawer-info-field">
                  <span className="hr-drawer-label">EMAIL ADDRESS</span>
                  <span className="hr-drawer-value">{selectedEmployee.email}</span>
                </div>

                <div className="hr-drawer-info-field">
                  <span className="hr-drawer-label">PHONE NUMBER</span>
                  <span className="hr-drawer-value">{selectedEmployee.phone || "+91 98765 43210"}</span>
                </div>

                <div className="hr-drawer-info-row" style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                  <div className="hr-drawer-info-col">
                    <span className="hr-drawer-label">DEPARTMENT</span>
                    <span className="hr-drawer-value">{selectedEmployee.department}</span>
                  </div>
                  <div className="hr-drawer-info-col">
                    <span className="hr-drawer-label">JOIN DATE</span>
                    <span className="hr-drawer-value">{formatDateString(selectedEmployee.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hr-drawer-footer">
              <button 
                className="hr-drawer-btn-edit"
                onClick={() => handleEditEmployee(selectedEmployee)}
              >
                <Edit className="btn-icon" style={{ marginRight: "6px" }} />
                <span>Edit</span>
              </button>
              <button 
                className="hr-drawer-btn-delete"
                onClick={() => handleDeleteEmployee(selectedEmployee)}
              >
                <Trash2 className="btn-icon" style={{ marginRight: "6px" }} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. ADD EMPLOYEE MODAL */}
      {showAddEmpModal && (
        <div className="hr-modal-overlay" onClick={() => setShowAddEmpModal(false)}>
          <div className="hr-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="hr-modal-header">
              <h3>Add Employee</h3>
              <button className="hr-close-btn" onClick={() => setShowAddEmpModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit}>
              <div className="hr-modal-body">
                <div className="hr-form-row">
                  <div className="hr-form-group">
                    <label>EMPLOYEE ID</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. EMP200"
                      value={addEmpForm.employeeId}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, employeeId: e.target.value })}
                    />
                  </div>

                  <div className="hr-form-group">
                    <label>FULL NAME</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. John Doe"
                      value={addEmpForm.name}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="hr-form-row">
                  <div className="hr-form-group">
                    <label>EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="e.g. name@company.com"
                      value={addEmpForm.email}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, email: e.target.value })}
                    />
                  </div>

                  <div className="hr-form-group">
                    <label>PHONE NUMBER</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. +91 98765 43210"
                      value={addEmpForm.phone}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="hr-form-row">
                  <div className="hr-form-group">
                    <label>DEPARTMENT</label>
                    <select 
                      required
                      value={addEmpForm.department}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, department: e.target.value, designation: getDesignation(e.target.value) })}
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="IT">IT</option>
                      <option value="Finance">Finance</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>

                  <div className="hr-form-group">
                    <label>DESIGNATION</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Designation will auto-assign"
                      value={addEmpForm.designation}
                      onChange={(e) => setAddEmpForm({ ...addEmpForm, designation: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="hr-form-row">
                  <div className="hr-form-group relative">
                    <label>PASSWORD</label>
                    <div style={{ position: "relative", width: "100%" }}>
                      <input 
                        type={showAddPass ? "text" : "password"}
                        required 
                        style={{ width: "100%", boxSizing: "border-box" }}
                        placeholder="Create strong password"
                        value={addEmpForm.password}
                        onChange={(e) => setAddEmpForm({ ...addEmpForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b" }}
                        onClick={() => setShowAddPass(!showAddPass)}
                      >
                        {showAddPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="hr-form-group relative">
                    <label>CONFIRM PASSWORD</label>
                    <div style={{ position: "relative", width: "100%" }}>
                      <input 
                        type={showConfirmPass ? "text" : "password"}
                        required 
                        style={{ width: "100%", boxSizing: "border-box" }}
                        placeholder="Repeat your password"
                        value={addEmpForm.confirmPassword}
                        onChange={(e) => setAddEmpForm({ ...addEmpForm, confirmPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b" }}
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hr-modal-footer">
                <button 
                  type="button" 
                  className="hr-btn-cancel" 
                  onClick={() => setShowAddEmpModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="hr-btn-submit">Create Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. EDIT EMPLOYEE MODAL */}
      {showEditEmpModal && selectedEmployee && (
        <div className="hr-modal-overlay" onClick={() => setShowEditEmpModal(false)}>
          <div className="hr-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="hr-modal-header">
              <h3>Edit Employee</h3>
              <button className="hr-close-btn" onClick={() => setShowEditEmpModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleEditEmployeeSubmit}>
              <div className="hr-modal-body">
                <div className="hr-form-row opacity-60">
                  <div className="hr-form-group">
                    <label>EMPLOYEE ID (READ ONLY)</label>
                    <input 
                      type="text" 
                      disabled
                      value={selectedEmployee.employee_id}
                    />
                  </div>

                  <div className="hr-form-group">
                    <label>FULL NAME</label>
                    <input 
                      type="text" 
                      required 
                      value={editEmpForm.name}
                      onChange={(e) => setEditEmpForm({ ...editEmpForm, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="hr-form-row">
                  <div className="hr-form-group">
                    <label>EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      required 
                      value={editEmpForm.email}
                      onChange={(e) => setEditEmpForm({ ...editEmpForm, email: e.target.value })}
                    />
                  </div>

                  <div className="hr-form-group">
                    <label>PHONE NUMBER</label>
                    <input 
                      type="text" 
                      required 
                      value={editEmpForm.phone}
                      onChange={(e) => setEditEmpForm({ ...editEmpForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="hr-form-row">
                  <div className="hr-form-group">
                    <label>DEPARTMENT</label>
                    <select 
                      required
                      value={editEmpForm.department}
                      onChange={(e) => setEditEmpForm({ ...editEmpForm, department: e.target.value, designation: getDesignation(e.target.value) })}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="IT">IT</option>
                      <option value="Finance">Finance</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>

                  <div className="hr-form-group">
                    <label>DESIGNATION</label>
                    <input 
                      type="text" 
                      required 
                      value={editEmpForm.designation}
                      onChange={(e) => setEditEmpForm({ ...editEmpForm, designation: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="hr-modal-footer">
                <button 
                  type="button" 
                  className="hr-btn-cancel" 
                  onClick={() => setShowEditEmpModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="hr-btn-submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. EDIT ATTENDANCE MODAL */}
      {showEditAttendanceModal && selectedAttendance && (
        <div className="hr-modal-overlay" onClick={() => setShowEditAttendanceModal(false)}>
          <div className="hr-modal-box narrow" onClick={(e) => e.stopPropagation()}>
            <div className="hr-modal-header">
              <h3>Edit Attendance</h3>
              <button className="hr-close-btn" onClick={() => setShowEditAttendanceModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleEditAttendanceSubmit}>
              <div className="hr-modal-body">
                <div className="hr-form-group" style={{ marginBottom: "8px" }}>
                  <label>EMPLOYEE</label>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#0f172a" }}>
                    {selectedAttendance.name} ({selectedAttendance.employee_id})
                  </p>
                </div>

                <div className="hr-form-group" style={{ marginBottom: "8px" }}>
                  <label>DATE</label>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>{selectedDate}</p>
                </div>

                <div className="hr-form-group">
                  <label>CHECK IN</label>
                  <input 
                    type="time"
                    value={editAttendanceForm.punchIn}
                    onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, punchIn: e.target.value })}
                  />
                </div>

                <div className="hr-form-group">
                  <label>CHECK OUT</label>
                  <input 
                    type="time"
                    value={editAttendanceForm.punchOut}
                    onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, punchOut: e.target.value })}
                  />
                </div>

                <div className="hr-form-group">
                  <label>STATUS</label>
                  <select 
                    value={editAttendanceForm.status}
                    onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, status: e.target.value })}
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="Leave">Leave</option>
                  </select>
                </div>
              </div>

              <div className="hr-modal-footer">
                <button 
                  type="button" 
                  className="hr-btn-cancel" 
                  onClick={() => setShowEditAttendanceModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="hr-btn-submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default HRDashboard;
