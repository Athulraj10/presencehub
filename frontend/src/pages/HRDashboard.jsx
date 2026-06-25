import React, { useState, useEffect } from "react";
import api from "../services/api";
import attendanceApi from "../services/attendanceApi";
import "../HRDashboard.css";

function HRDashboard() {
  const employeeId = localStorage.getItem("employeeId");
  const token = localStorage.getItem("token");

  // Tab state: "dashboard" | "employees" | "attendance" | "profile"
  const [activeTab, setActiveTab] = useState("dashboard");

  // Global Data States
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentEmployeeData, setCurrentEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters and Selection States
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    // format as YYYY-MM-DD
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [deptFilterDashboard, setDeptFilterDashboard] = useState("All");

  // Add/Edit Modals & Drawer States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [employeeToView, setEmployeeToView] = useState(null);
  const [showEditAttendanceModal, setShowEditAttendanceModal] = useState(false);
  const [attendanceToEdit, setAttendanceToEdit] = useState(null);
  const [activeActionsMenu, setActiveActionsMenu] = useState(null); // employeeId of active dropdown

  // Form states - Add Employee
  const [addForm, setAddForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    password: "",
    confirmPassword: ""
  });

  // Form states - Edit Employee
  const [editForm, setEditForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: ""
  });

  // Form states - Edit Attendance
  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: "",
    employeeName: "",
    date: "",
    punchIn: "",
    punchOut: "",
    status: "Present"
  });

  // Headers helper
  const headers = {
    Authorization: `Bearer ${token}`
  };

  // 1. Fetch data on mount / tab change
  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch current logged-in HR details
      if (employeeId && token) {
        const HRResponse = await api.get(`/employees/${employeeId}`, { headers });
        if (HRResponse.data && HRResponse.data.success) {
          setCurrentEmployeeData(HRResponse.data.data);
        }
      }

      // Fetch all employees
      const empResponse = await api.get("/employees", { headers });
      if (empResponse.data && empResponse.data.success) {
        setEmployees(empResponse.data.data || []);
      }

      // Fetch attendance for selectedDate
      const attResponse = await attendanceApi.get(`/attendance/date/${selectedDate}`);
      if (attResponse.data && attResponse.data.success) {
        setAttendanceRecords(attResponse.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching HR Dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [selectedDate]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Helper: Format Dates
  const getFormattedDateString = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getWeekDays = () => {
    const curr = new Date(selectedDate);
    const first = curr.getDate() - curr.getDay() + 1; // Monday
    const days = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(curr.getTime());
      next.setDate(first + i);
      days.push(next);
    }
    return days;
  };

  // Calculate status for each employee
  const getEmployeeStatus = (empId) => {
    const record = attendanceRecords.find(r => r.employee_id === empId);
    if (!record) return "Absent";
    if (record.punch_in === null && record.punch_out === null) return "Leave";
    
    // Check if late (> 09:00 AM)
    if (record.punch_in) {
      const pinDate = new Date(record.punch_in);
      const hours = pinDate.getHours();
      const minutes = pinDate.getMinutes();
      if (hours > 9 || (hours === 9 && minutes > 0)) {
        return "Late";
      }
    }
    return "Present";
  };

  // Format timestamp to Time
  const formatTime = (timeStr) => {
    if (!timeStr) return "--:-- --";
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // Add Employee Submit handler
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (addForm.password !== addForm.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const payload = {
        employeeId: addForm.employeeId,
        name: addForm.name,
        email: addForm.email,
        department: addForm.department,
        password: addForm.password
      };
      const response = await api.post("/employees/register", payload);
      if (response.data && response.data.success) {
        alert("Employee created successfully!");
        setShowAddModal(false);
        // Reset form
        setAddForm({
          employeeId: "",
          name: "",
          email: "",
          phone: "",
          department: "",
          designation: "",
          password: "",
          confirmPassword: ""
        });
        fetchAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to register employee");
    }
  };

  // Edit Employee Submit handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        department: editForm.department
      };
      const response = await api.put(`/employees/${editForm.employeeId}`, payload, { headers });
      if (response.data && response.data.success) {
        alert("Employee updated successfully!");
        setShowEditModal(false);
        setShowDrawer(false);
        fetchAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update employee");
    }
  };

  // Delete Employee handler
  const handleDeleteEmployee = async (empId) => {
    if (window.confirm(`Are you sure you want to delete employee ${empId}?`)) {
      try {
        const response = await api.delete(`/employees/${empId}`, { headers });
        if (response.data && response.data.success) {
          alert("Employee deleted successfully!");
          setShowDrawer(false);
          fetchAllData();
        }
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete employee");
      }
    }
  };

  // Edit Attendance Submit handler
  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        employeeId: attendanceForm.employeeId,
        date: attendanceForm.date,
        punchIn: attendanceForm.punchIn,
        punchOut: attendanceForm.punchOut,
        status: attendanceForm.status
      };
      const response = await attendanceApi.put("/attendance/update", payload);
      if (response.data && response.data.success) {
        alert("Attendance updated successfully!");
        setShowEditAttendanceModal(false);
        fetchAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update attendance");
    }
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee ID,Name,Email,Department,Join Date\n";
    employees.forEach(emp => {
      csvContent += `${emp.employee_id},"${emp.name}",${emp.email},"${emp.department}",${emp.created_at ? emp.created_at.substring(0,10) : ""}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `employees_export_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render content based on activeTab
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="hr-loading-container">
          <p>Loading HR Dashboard data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard": {
        // Compute statistics
        const totalEmp = employees.length;
        const presentToday = attendanceRecords.filter(r => r.punch_in).length;
        const absentToday = totalEmp - presentToday;
        const lateToday = attendanceRecords.filter(r => {
          if (!r.punch_in) return false;
          const pin = new Date(r.punch_in);
          return pin.getHours() > 9 || (pin.getHours() === 9 && pin.getMinutes() > 0);
        }).length;
        const capacityPercent = totalEmp > 0 ? ((presentToday / totalEmp) * 100).toFixed(1) : "0.0";

        // Filter recent activity
        const recentActivity = attendanceRecords.map(record => {
          const emp = employees.find(e => e.employee_id === record.employee_id);
          const status = getEmployeeStatus(record.employee_id);
          return {
            id: record.employee_id,
            name: emp?.name || record.employee_id,
            department: emp?.department || "Information Technology",
            event: status === "Late" || status === "Present" ? "Marked Present" : status === "Leave" ? "Requested Leave" : "Marked Absent",
            time: record.punch_in ? formatTime(record.punch_in) : "--:-- --",
            status: status
          };
        }).filter(item => {
          if (deptFilterDashboard === "All") return true;
          return item.department === deptFilterDashboard;
        });

        return (
          <div className="hr-tab-dashboard">
            <div className="hr-greeting-block">
              <h1>Good Morning, {currentEmployeeData?.name || "Admin"}</h1>
              <p>{getFormattedDateString(selectedDate)} | PresenceHub Global Dashboard</p>
            </div>

            {/* Stats Cards Row */}
            <div className="hr-stats-row">
              <div className="hr-stat-card">
                <div className="hr-stat-card-top">
                  <div className="hr-stat-info">
                    <span className="hr-stat-label">TOTAL EMPLOYEES</span>
                    <span className="hr-stat-value">{totalEmp}</span>
                  </div>
                  <div className="hr-stat-icon-box bg-blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hr-stat-icon">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
                <div className="hr-stat-card-bottom text-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="arrow-icon">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                  <span>+4 this month</span>
                </div>
              </div>

              <div className="hr-stat-card">
                <div className="hr-stat-card-top">
                  <div className="hr-stat-info">
                    <span className="hr-stat-label">PRESENT TODAY</span>
                    <span className="hr-stat-value">{presentToday}</span>
                  </div>
                  <div className="hr-stat-icon-box bg-green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hr-stat-icon">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>
                <div className="hr-stat-card-bottom">
                  <div className="hr-progress-container">
                    <div className="hr-progress-bar">
                      <div className="hr-progress-fill bg-blue" style={{ width: `${capacityPercent}%` }}></div>
                    </div>
                    <span>{capacityPercent}% Capacity</span>
                  </div>
                </div>
              </div>

              <div className="hr-stat-card">
                <div className="hr-stat-card-top">
                  <div className="hr-stat-info">
                    <span className="hr-stat-label">ABSENT TODAY</span>
                    <span className="hr-stat-value text-red">{absentToday}</span>
                  </div>
                  <div className="hr-stat-icon-box bg-red">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hr-stat-icon">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <line x1="10" y1="14" x2="14" y2="18" />
                      <line x1="14" y1="14" x2="10" y2="18" />
                    </svg>
                  </div>
                </div>
                <div className="hr-stat-card-bottom">
                  <div className="hr-absent-details">
                    <span className="dot bg-red"></span> {lateToday} Late
                    <span className="dot bg-black ml-10"></span> {absentToday - lateToday > 0 ? absentToday - lateToday : 0} Other
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="hr-activity-card">
              <div className="hr-activity-header">
                <div className="hr-activity-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hr-title-icon">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <h2>Recent Activity</h2>
                </div>
                <div className="hr-activity-actions">
                  <select 
                    className="hr-activity-select" 
                    value={deptFilterDashboard}
                    onChange={(e) => setDeptFilterDashboard(e.target.value)}
                  >
                    <option value="All">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Product Design">Product Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Operations">Operations</option>
                  </select>
                  <button className="hr-view-all-btn" onClick={() => setActiveTab("attendance")}>View All</button>
                </div>
              </div>

              <table className="hr-activity-table">
                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>EVENT</th>
                    <th>TIME</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", color: "#64748b", padding: "30px" }}>
                        No punch-in events recorded today.
                      </td>
                    </tr>
                  ) : (
                    recentActivity.slice(0, 5).map((activity) => (
                      <tr key={activity.id}>
                        <td>
                          <div className="hr-employee-cell">
                            <div className="hr-avatar-circle">
                              {activity.name ? activity.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "EM"}
                            </div>
                            <div className="hr-employee-meta">
                              <span className="hr-employee-name">{activity.name}</span>
                              <span className="hr-employee-dept">{activity.department}</span>
                            </div>
                          </div>
                        </td>
                        <td>{activity.event}</td>
                        <td>{activity.time}</td>
                        <td>
                          <span className={`hr-badge ${
                            activity.status === "Late" ? "badge-late" :
                            activity.status === "Present" ? "badge-present" :
                            activity.status === "Leave" ? "badge-leave" : "badge-absent"
                          }`}>
                            {activity.status === "Late" ? "LATE" :
                             activity.status === "Present" ? "ON TIME" :
                             activity.status === "Leave" ? "PENDING" : "SICK LEAVE"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case "employees": {
        // Search and Filter employees
        const filteredEmployees = employees.filter((emp) => {
          const matchSearch =
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
          const matchDept = selectedDept === "All" || emp.department === selectedDept;
          const status = getEmployeeStatus(emp.employee_id);
          const matchStatus =
            selectedStatus === "All" ||
            (selectedStatus === "Active" && status !== "Absent" && status !== "Leave") ||
            (selectedStatus === "On Leave" && status === "Leave");
          return matchSearch && matchDept && matchStatus;
        });

        return (
          <div className="hr-tab-employees">
            <div className="hr-header-row">
              <div className="hr-greeting-block">
                <h1>Employees</h1>
                <p>Manage your organization's workforce and employee records.</p>
              </div>
              <div className="hr-header-buttons">
                <button className="hr-btn-primary" onClick={() => setShowAddModal(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Employee
                </button>
                <button className="hr-btn-secondary" onClick={handleExportCSV}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            <div className="hr-filters-panel">
              <div className="hr-search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search by Employee Name or Employee ID" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="hr-filters-right">
                <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product Design">Product Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Operations">Operations</option>
                </select>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="All">Any Status</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
                <button className="hr-btn-filters-more">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  More Filters
                </button>
              </div>
            </div>

            {/* Employees List Card */}
            <div className="hr-table-card">
              <table className="hr-data-table">
                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>DEPARTMENT</th>
                    <th>DESIGNATION</th>
                    <th>STATUS</th>
                    <th>Join Date</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                        No employees found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const empStatus = getEmployeeStatus(emp.employee_id);
                      const isLeave = empStatus === "Leave";
                      const isActive = empStatus !== "Absent";
                      const mockDesignation = emp.employee_id === "ADMIN001" ? "System Admin" : "Lead Developer";
                      return (
                        <tr key={emp.employee_id}>
                          <td>
                            <div className="hr-employee-cell">
                              <img src="/employee_avatar.jpg" alt="Avatar" className="hr-avatar-img-circle" />
                              <div className="hr-employee-meta">
                                <span className="hr-employee-name">{emp.name}</span>
                                <span className="hr-employee-id">{emp.employee_id}</span>
                              </div>
                            </div>
                          </td>
                          <td>{emp.department}</td>
                          <td>{emp.designation || mockDesignation}</td>
                          <td>
                            <span className={`hr-badge ${isLeave ? "badge-leave" : isActive ? "badge-present" : "badge-absent"}`}>
                              {isLeave ? "ON LEAVE" : isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>
                          <td>{emp.created_at ? emp.created_at.substring(0, 10) : "2026-06-18"}</td>
                          <td style={{ textAlign: "center", position: "relative" }}>
                            <button className="hr-btn-actions-dots" onClick={() => setActiveActionsMenu(activeActionsMenu === emp.employee_id ? null : emp.employee_id)}>
                              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
                                <circle cx="12" cy="5" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="12" cy="19" r="2" />
                              </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {activeActionsMenu === emp.employee_id && (
                              <div className="hr-actions-dropdown">
                                <button onClick={() => {
                                  setEmployeeToView(emp);
                                  setShowDrawer(true);
                                  setActiveActionsMenu(null);
                                }}>
                                  View Employee
                                </button>
                                <button onClick={() => {
                                  setEmployeeToEdit(emp);
                                  setEditForm({
                                    employeeId: emp.employee_id,
                                    name: emp.name,
                                    email: emp.email,
                                    phone: emp.phone || "+1 (234) 567-8901",
                                    department: emp.department,
                                    designation: emp.designation || "Lead Developer"
                                  });
                                  setShowEditModal(true);
                                  setActiveActionsMenu(null);
                                }}>
                                  Edit Employee
                                </button>
                                <button onClick={() => {
                                  handleDeleteEmployee(emp.employee_id);
                                  setActiveActionsMenu(null);
                                }} className="hr-text-red">
                                  Delete Employee
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              <div className="hr-table-footer">
                <span className="hr-showing-text">Showing {filteredEmployees.length} of {employees.length} employees</span>
                <div className="hr-pagination-btns">
                  <button className="hr-page-arrow" disabled>&lt;</button>
                  <button className="hr-page-arrow" disabled>&gt;</button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "attendance": {
        // Compute dynamic counts
        const totalEmp = employees.length;
        const presentToday = attendanceRecords.filter(r => r.punch_in).length;
        const absentToday = totalEmp - presentToday;
        const lateToday = attendanceRecords.filter(r => {
          if (!r.punch_in) return false;
          const pin = new Date(r.punch_in);
          return pin.getHours() > 9 || (pin.getHours() === 9 && pin.getMinutes() > 0);
        }).length;

        // Render Mon-Sun WeekSelector
        const weekDays = getWeekDays();

        // Process Attendance Log
        const attendanceLog = employees.map(emp => {
          const record = attendanceRecords.find(r => r.employee_id === emp.employee_id);
          const status = getEmployeeStatus(emp.employee_id);
          return {
            employeeId: emp.employee_id,
            name: emp.name,
            department: emp.department,
            checkIn: record?.punch_in ? formatTime(record.punch_in) : "--:-- --",
            checkOut: record?.punch_out ? formatTime(record.punch_out) : "--:-- --",
            status: status,
            recordObj: record
          };
        });

        return (
          <div className="hr-tab-attendance">
            <div className="hr-header-row">
              <div className="hr-greeting-block">
                <h1>Attendance</h1>
                <p>Real-time workforce monitoring for today.</p>
              </div>
              <div className="hr-header-buttons">
                <button className="hr-btn-secondary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  Filters
                </button>
                <button className="hr-btn-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Export Report
                </button>
              </div>
            </div>

            {/* Week Selector strip */}
            <div className="hr-week-strip">
              {weekDays.map((day, idx) => {
                const dayStr = day.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
                const dateNum = day.getDate();
                
                // Format day to match selectedDate
                const y = day.getFullYear();
                const m = String(day.getMonth() + 1).padStart(2, "0");
                const d = String(day.getDate()).padStart(2, "0");
                const thisDayKey = `${y}-${m}-${d}`;
                const isActive = thisDayKey === selectedDate;

                return (
                  <div 
                    key={idx} 
                    className={`hr-week-card ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedDate(thisDayKey)}
                  >
                    <span className="hr-week-day">{dayStr}</span>
                    <span className="hr-week-date">{dateNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Summary Cards */}
            <div className="hr-stats-row horizontal-stats">
              <div className="hr-stat-card text-center border-blue-bottom">
                <span className="hr-stat-label">TOTAL STAFF</span>
                <span className="hr-stat-value">{totalEmp}</span>
              </div>
              <div className="hr-stat-card text-center border-green-bottom">
                <span className="hr-stat-label">PRESENT TODAY</span>
                <span className="hr-stat-value text-green">{presentToday}</span>
              </div>
              <div className="hr-stat-card text-center border-orange-bottom">
                <span className="hr-stat-label">LATE ENTRIES</span>
                <span className="hr-stat-value text-orange">{lateToday}</span>
              </div>
              <div className="hr-stat-card text-center border-red-bottom">
                <span className="hr-stat-label">ABSENT</span>
                <span className="hr-stat-value text-red">{absentToday}</span>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="hr-table-card">
              <div className="hr-activity-header">
                <div className="hr-activity-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hr-title-icon">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                    <line x1="9" y1="17" x2="15" y2="17" />
                  </svg>
                  <h2>Employee Attendance Log</h2>
                </div>
                <span className="hr-showing-text">Showing {attendanceLog.length} of {totalEmp} records</span>
              </div>

              <table className="hr-data-table">
                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>DEPARTMENT</th>
                    <th>CHECK-IN TIME</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: "center" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLog.map((log) => (
                    <tr key={log.employeeId}>
                      <td>
                        <div className="hr-employee-cell">
                          <img src="/employee_avatar.jpg" alt="Avatar" className="hr-avatar-img-circle" />
                          <span className="hr-employee-name">{log.name}</span>
                        </div>
                      </td>
                      <td>{log.department}</td>
                      <td>{log.checkIn}</td>
                      <td>
                        <span className={`hr-badge ${
                          log.status === "Present" ? "badge-present" :
                          log.status === "Late" ? "badge-late" :
                          log.status === "Leave" ? "badge-leave" : "badge-absent"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button 
                          className="hr-btn-actions-dots"
                          onClick={() => {
                            setAttendanceForm({
                              employeeId: log.employeeId,
                              employeeName: log.name,
                              date: selectedDate,
                              punchIn: log.recordObj?.punch_in ? log.recordObj.punch_in.substring(11, 16) : "09:00",
                              punchOut: log.recordObj?.punch_out ? log.recordObj.punch_out.substring(11, 16) : "18:00",
                              status: log.status
                            });
                            setShowEditAttendanceModal(true);
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
                            <circle cx="5" cy="12" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="19" cy="12" r="2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="hr-table-footer">
                <span className="hr-showing-text">Page 1 of 1</span>
                <div className="hr-pagination-btns">
                  <button className="hr-btn-pagination disabled" disabled>Previous</button>
                  <button className="hr-btn-pagination active">Next</button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "profile": {
        const hrName = currentEmployeeData?.name || "Jessica Wu";
        const hrDesignation = currentEmployeeData?.role === "admin" ? "Global Admin" : "HR Manager";
        const hrEmail = currentEmployeeData?.email || "jessica.wu@presencehub.co";
        const hrPhone = currentEmployeeData?.phone || "+1 (415) 555-0198";
        const hrLocation = currentEmployeeData?.location || "San Francisco HQ — Floor 4, Suite 402";

        return (
          <div className="hr-tab-profile">
            {/* Blue Hero Header Card */}
            <div className="hr-profile-hero">
              <div className="hr-profile-hero-inner">
                <img src="/girl_avatar.jpg" alt="Avatar" className="hr-profile-hero-avatar" />
                <div className="hr-profile-hero-details">
                  <h2>{hrName}</h2>
                  <p className="hr-profile-designation">{hrDesignation}</p>
                  <p className="hr-profile-location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="loc-pin-icon" style={{ width: 16, height: 16, marginRight: 6 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    San Francisco, CA
                  </p>
                </div>
              </div>
              <button className="hr-btn-edit-profile" onClick={() => alert("Profile edits must be configured in Settings.")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon" style={{ width: 16, height: 16, marginRight: 6 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Profile
              </button>
            </div>

            {/* White Info Cards */}
            <div className="hr-profile-cards-container">
              {/* Contact Details Card */}
              <div className="profile-white-card">
                <div className="profile-card-header no-border">
                  <div className="profile-card-title-container">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-header-icon" style={{ width: 20, height: 20 }}>
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <line x1="7" y1="8" x2="17" y2="8" />
                      <line x1="7" y1="12" x2="17" y2="12" />
                      <line x1="7" y1="16" x2="13" y2="16" />
                    </svg>
                    <h3>Contact Details</h3>
                  </div>
                </div>

                <div className="hr-contact-details-form">
                  <div className="hr-input-row-two">
                    <div className="hr-field">
                      <label>EMAIL ADDRESS</label>
                      <div className="hr-disabled-input-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="field-icon">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <input type="text" value={hrEmail} disabled />
                      </div>
                    </div>
                    <div className="hr-field">
                      <label>PHONE NUMBER</label>
                      <div className="hr-disabled-input-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="field-icon">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <input type="text" value={hrPhone} disabled />
                      </div>
                    </div>
                  </div>

                  <div className="hr-field full-width">
                    <label>OFFICE LOCATION</label>
                    <div className="hr-disabled-input-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="field-icon">
                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                        <line x1="9" y1="22" x2="9" y2="16" />
                        <line x1="15" y1="22" x2="15" y2="16" />
                        <line x1="9" y1="16" x2="15" y2="16" />
                        <path d="M9 6h6v4H9V6z" />
                      </svg>
                      <input type="text" value={hrLocation} disabled />
                    </div>
                  </div>
                </div>
              </div>

              {/* Two columns below */}
              <div className="profile-columns-row">
                <div className="profile-white-card half-card">
                  <div className="profile-card-header no-border">
                    <div className="profile-card-title-container">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-header-icon" style={{ width: 20, height: 20 }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <h3>Account &amp; Security</h3>
                    </div>
                  </div>
                  <div className="profile-settings-list">
                    <div className="settings-item" onClick={() => alert("Change Password is managed by Identity Admin.")}>
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
                    <div className="settings-item" onClick={() => alert("Notifications managed by corporate policy.")}>
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

                <div className="profile-white-card half-card">
                  <div className="profile-card-header no-border">
                    <div className="profile-card-title-container">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile-header-icon" style={{ width: 20, height: 20 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <h3>Support Center</h3>
                    </div>
                  </div>
                  <div className="profile-settings-list">
                    <div className="settings-item" onClick={() => alert("Report Issue portal loading...")}>
                      <div className="settings-item-left">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-icon" style={{ width: 18, height: 18 }}>
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span>Report Issue</span>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-chevron" style={{ width: 16, height: 16 }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                    <div className="settings-item" onClick={() => alert("Contact support portal loading...")}>
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

              {/* Logout Button */}
              <button className="hr-profile-signout-btn" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="signout-icon" style={{ width: 18, height: 18, marginRight: 8 }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const navName = currentEmployeeData?.name || "Admin User";
  const navPhoto = currentEmployeeData?.role === "admin" ? "/man_avatar.jpg" : "/girl_avatar.jpg";

  return (
    <div className="hr-dashboard-layout">
      {/* 1. TOP HEADER NAVBAR */}
      <header className="hr-dash-header">
        <div className="hr-header-inner">
          <div className="hr-dash-logo">PresenceHub</div>
          <nav className="hr-dash-nav">
            <a 
              href="#dashboard" 
              className={activeTab === "dashboard" ? "active-link" : ""}
              onClick={(e) => { e.preventDefault(); setActiveTab("dashboard"); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="nav-icon-svg" style={{ width: 16, height: 16, marginRight: 6 }}>
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              Dashboard
            </a>
            <a 
              href="#employees" 
              className={activeTab === "employees" ? "active-link" : ""}
              onClick={(e) => { e.preventDefault(); setActiveTab("employees"); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="nav-icon-svg" style={{ width: 16, height: 16, marginRight: 6 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Employees
            </a>
            <a 
              href="#attendance" 
              className={activeTab === "attendance" ? "active-link" : ""}
              onClick={(e) => { e.preventDefault(); setActiveTab("attendance"); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="nav-icon-svg" style={{ width: 16, height: 16, marginRight: 6 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Attendance
            </a>
            <a 
              href="#profile" 
              className={activeTab === "profile" ? "active-link" : ""}
              onClick={(e) => { e.preventDefault(); setActiveTab("profile"); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="nav-icon-svg" style={{ width: 16, height: 16, marginRight: 6 }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile
            </a>
          </nav>
          <div className="hr-dash-utils">
            <button className="hr-util-btn hr-relative-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              <span className="hr-notification-dot"></span>
            </button>
            <div className="hr-user-badge">
              <img src={navPhoto} alt="User Avatar" className="hr-user-avatar" />
              <div className="hr-user-info">
                <span className="hr-user-name">{navName}</span>
                <span className="hr-user-role">Global Access</span>
              </div>
            </div>
            <button className="hr-util-btn" onClick={() => setActiveTab("profile")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="hr-dash-main">
        {renderTabContent()}
      </main>

      {/* 3. FOOTER */}
      <footer className="hr-dash-footer">
        <div className="hr-footer-inner">
          <div>PresenceHub Enterprise v2.4.0 • © 2026 • All rights reserved</div>
          <div className="hr-footer-sub-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a href="#support" onClick={(e) => e.preventDefault()}>Support</a>
          </div>
        </div>
      </footer>

      {/* 4. MODALS & DRAWER */}
      
      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="hr-modal-overlay">
          <div className="hr-modal-box">
            <div className="hr-modal-header">
              <h3>Add Employee</h3>
              <button className="hr-close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="hr-modal-body">
                <div className="hr-form-row">
                  <div className="hr-form-group">
                    <label>Employee ID</label>
                    <input 
                      type="text" 
                      placeholder="PH-XXXX" 
                      required
                      value={addForm.employeeId} 
                      onChange={(e) => setAddForm({...addForm, employeeId: e.target.value})}
                    />
                  </div>
                  <div className="hr-form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter name" 
                      required
                      value={addForm.name} 
                      onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="hr-form-row">
                  <div className="hr-form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="email@presencehub.com" 
                      required
                      value={addForm.email} 
                      onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                    />
                  </div>
                  <div className="hr-form-group">
                    <label>Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="+1 (555) 000-0000" 
                      value={addForm.phone} 
                      onChange={(e) => setAddForm({...addForm, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="hr-form-row">
                  <div className="hr-form-group">
                    <label>Department</label>
                    <select 
                      required
                      value={addForm.department} 
                      onChange={(e) => setAddForm({...addForm, department: e.target.value})}
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Product Design">Product Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                  <div className="hr-form-group">
                    <label>Designation</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Senior Manager" 
                      value={addForm.designation} 
                      onChange={(e) => setAddForm({...addForm, designation: e.target.value})}
                    />
                  </div>
                </div>
                <div className="hr-form-row">
                  <div className="hr-form-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      placeholder="........." 
                      required
                      value={addForm.password} 
                      onChange={(e) => setAddForm({...addForm, password: e.target.value})}
                    />
                  </div>
                  <div className="hr-form-group">
                    <label>Confirm Password</label>
                    <input 
                      type="password" 
                      placeholder="........." 
                      required
                      value={addForm.confirmPassword} 
                      onChange={(e) => setAddForm({...addForm, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="hr-modal-footer">
                <button type="button" className="hr-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="hr-btn-submit">Create Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {showEditModal && (
        <div className="hr-modal-overlay">
          <div className="hr-modal-box">
            <div className="hr-modal-header">
              <h3>Edit Employee</h3>
              <button className="hr-close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="hr-modal-body">
                <div className="hr-form-row">
                  <div className="hr-form-group">
                    <label>Employee ID</label>
                    <input type="text" value={editForm.employeeId} disabled />
                  </div>
                  <div className="hr-form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter name" 
                      required
                      value={editForm.name} 
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="hr-form-row">
                  <div className="hr-form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="email@presencehub.com" 
                      required
                      value={editForm.email} 
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    />
                  </div>
                  <div className="hr-form-group">
                    <label>Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="+1 (555) 000-0000" 
                      value={editForm.phone} 
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="hr-form-row">
                  <div className="hr-form-group">
                    <label>Department</label>
                    <select 
                      required
                      value={editForm.department} 
                      onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Product Design">Product Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                  <div className="hr-form-group">
                    <label>Designation</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Senior Manager" 
                      value={editForm.designation} 
                      onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="hr-modal-footer">
                <button type="button" className="hr-btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="hr-btn-submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ATTENDANCE MODAL */}
      {showEditAttendanceModal && (
        <div className="hr-modal-overlay">
          <div className="hr-modal-box narrow">
            <div className="hr-modal-header">
              <h3>Edit Attendance</h3>
              <button className="hr-close-btn" onClick={() => setShowEditAttendanceModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAttendanceSubmit}>
              <div className="hr-modal-body">
                <div className="hr-form-group">
                  <label>Employee</label>
                  <input type="text" value={attendanceForm.employeeName} disabled />
                </div>
                <div className="hr-form-group mt-15">
                  <label>Date</label>
                  <input type="text" value={attendanceForm.date} disabled />
                </div>
                <div className="hr-form-group mt-15">
                  <label>Attendance Status</label>
                  <select 
                    value={attendanceForm.status} 
                    onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="Leave">Leave</option>
                  </select>
                </div>
                {attendanceForm.status !== "Absent" && (
                  <div className="hr-form-row mt-15">
                    <div className="hr-form-group">
                      <label>Check In Time</label>
                      <input 
                        type="time" 
                        value={attendanceForm.punchIn} 
                        onChange={(e) => setAttendanceForm({...attendanceForm, punchIn: e.target.value})}
                      />
                    </div>
                    <div className="hr-form-group">
                      <label>Check Out Time</label>
                      <input 
                        type="time" 
                        value={attendanceForm.punchOut} 
                        onChange={(e) => setAttendanceForm({...attendanceForm, punchOut: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="hr-modal-footer">
                <button type="button" className="hr-btn-cancel" onClick={() => setShowEditAttendanceModal(false)}>Cancel</button>
                <button type="submit" className="hr-btn-submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW EMPLOYEE SLIDING DRAWER */}
      {showDrawer && employeeToView && (
        <div className="hr-drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="hr-drawer-box" onClick={(e) => e.stopPropagation()}>
            <div className="hr-drawer-header">
              <h3>Employee Details</h3>
              <button className="hr-drawer-close" onClick={() => setShowDrawer(false)}>&times;</button>
            </div>
            
            <div className="hr-drawer-body">
              <div className="hr-drawer-profile-section">
                <img src="/employee_avatar.jpg" alt="Profile" className="hr-drawer-avatar" />
                <h2>{employeeToView.name}</h2>
                <p className="hr-drawer-designation">{employeeToView.designation || "Lead Developer"}</p>
              </div>

              <div className="hr-drawer-info-grid">
                <div className="hr-drawer-info-row">
                  <div className="hr-drawer-info-col">
                    <span className="hr-drawer-label">EMPLOYEE ID</span>
                    <span className="hr-drawer-value">{employeeToView.employee_id}</span>
                  </div>
                  <div className="hr-drawer-info-col">
                    <span className="hr-drawer-label">STATUS</span>
                    <span className={`hr-badge ${getEmployeeStatus(employeeToView.employee_id) === "Leave" ? "badge-leave" : getEmployeeStatus(employeeToView.employee_id) !== "Absent" ? "badge-present" : "badge-absent"}`}>
                      {getEmployeeStatus(employeeToView.employee_id) === "Leave" ? "ON LEAVE" : getEmployeeStatus(employeeToView.employee_id) !== "Absent" ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>

                <div className="hr-drawer-info-field">
                  <span className="hr-drawer-label">EMAIL ADDRESS</span>
                  <span className="hr-drawer-value">{employeeToView.email}</span>
                </div>

                <div className="hr-drawer-info-field">
                  <span className="hr-drawer-label">PHONE NUMBER</span>
                  <span className="hr-drawer-value">{employeeToView.phone || "+1 (234) 567-8901"}</span>
                </div>

                <div className="hr-drawer-info-field">
                  <span className="hr-drawer-label">DEPARTMENT</span>
                  <span className="hr-drawer-value">{employeeToView.department}</span>
                </div>

                <div className="hr-drawer-info-field">
                  <span className="hr-drawer-label">JOIN DATE</span>
                  <span className="hr-drawer-value">
                    {employeeToView.created_at 
                      ? new Date(employeeToView.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) 
                      : "June 18, 2026"}
                  </span>
                </div>
              </div>
            </div>

            <div className="hr-drawer-footer">
              <button 
                className="hr-drawer-btn-edit" 
                onClick={() => {
                  setEmployeeToEdit(employeeToView);
                  setEditForm({
                    employeeId: employeeToView.employee_id,
                    name: employeeToView.name,
                    email: employeeToView.email,
                    phone: employeeToView.phone || "+1 (234) 567-8901",
                    department: employeeToView.department,
                    designation: employeeToView.designation || "Lead Developer"
                  });
                  setShowEditModal(true);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon" style={{ width: 16, height: 16, marginRight: 6 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
              <button 
                className="hr-drawer-btn-delete" 
                onClick={() => handleDeleteEmployee(employeeToView.employee_id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon" style={{ width: 16, height: 16, marginRight: 6 }}>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRDashboard;
