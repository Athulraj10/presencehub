import React, { useState, useEffect } from "react";
import { 
  Users, Shield, ClipboardList, AlertCircle, CheckCircle2, 
  Bell, Search, Filter, MoreVertical, Download, Plus, 
  X, Mail, Lock, Eye, EyeOff, GitBranch, Calendar, Clock,
  ArrowRight, Check, Trash2, LogOut, User, ShieldCheck,
  FileText, HelpCircle, KeyRound, UploadCloud
} from "lucide-react";
import api from "../services/api";
import attendanceApi from "../services/attendanceApi";
import ChangePassword from "./ChangePassword";
import ReportIssue from "./ReportIssue";

function HRDashboard() {
  const employeeId = localStorage.getItem("employeeId");
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // Subview State (for full screen subviews: Change Password / Report Issue)
  const [subView, setSubView] = useState(null); // 'change-password' | 'report-issue'

  // Navigation state: "dashboard" | "hrm" | "issues"
  const [activeTab, setActiveTab] = useState("dashboard");

  // Profile Dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Profile details drawer state (for current logged-in user)
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Data states
  const [employeesCount, setEmployeesCount] = useState(1248); // default fallback
  const [hrAccounts, setHrAccounts] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clock state
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // HR Management search and filter states
  const [hrSearch, setHrSearch] = useState("");
  const [hrDept, setHrDept] = useState("All Departments");
  
  // HR Modal states
  const [showAddHRModal, setShowAddHRModal] = useState(false);
  const [showEditHRModal, setShowEditHRModal] = useState(false);
  const [selectedHR, setSelectedHR] = useState(null); // HR selected for view/edit/delete
  const [showHRDrawer, setShowHRDrawer] = useState(false);
  const [activeHRActionMenu, setActiveHRActionMenu] = useState(null); // row id for dropdown

  // HR Form states
  const [addHRForm, setAddHRForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    department: "",
    password: ""
  });
  const [editHRForm, setEditHRForm] = useState({
    name: "",
    email: "",
    department: ""
  });
  const [showAddHRPassword, setShowAddHRPassword] = useState(false);

  // Issues states
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showIssueDrawer, setShowIssueDrawer] = useState(false);
  const [issueSearch, setIssueSearch] = useState("");
  const [issueStatusFilter, setIssueStatusFilter] = useState("Status");
  const [issuePriorityFilter, setIssuePriorityFilter] = useState("Priority");
  const [activeIssueActionMenu, setActiveIssueActionMenu] = useState(null);

  // Initializing mock issues database in localStorage if empty
  const initializeIssuesDb = () => {
    const defaultIssues = [
      {
        id: "#ISS-4291",
        subject: "Missing overtime pay in Oct invoice",
        description: "I noticed that my overtime hours from the first week of October (approx 8 hours) are not reflected in the latest draft invoice provided by the portal. I have already submitted my logs which were approved by the team lead.",
        reportedBy: "Alex Simmons",
        role: "Employee",
        priority: "High",
        status: "Open",
        reportedDate: "Oct 12, 2023",
        attachment: {
          name: "overtime_logs_oct.pdf",
          size: "1.2 MB",
          type: "PDF"
        }
      },
      {
        id: "#ISS-4288",
        subject: "Onboarding document upload error",
        description: "Encountered a system error code 500 when attempting to upload the signed employment agreement. Tried multiple file formats (PDF, JPG) but the upload remains stuck. Need IT assistance to complete the file attachment.",
        reportedBy: "Maria Jones",
        role: "HR Manager",
        priority: "Medium",
        status: "In Progress",
        reportedDate: "Oct 11, 2023",
        attachment: null
      },
      {
        id: "#ISS-4275",
        subject: "Login portal downtime report",
        description: "The authentication server was unresponsive between 9:00 AM and 9:45 AM. Multiple employees were locked out with a network timeout error message. Logging this for server health history check.",
        reportedBy: "Ryan Kholin",
        role: "Employee",
        priority: "Low",
        status: "Resolved",
        reportedDate: "Oct 10, 2023",
        attachment: {
          name: "downtime_screenshot.png",
          size: "820 KB",
          type: "PNG"
        }
      }
    ];

    if (!localStorage.getItem("issues_db")) {
      localStorage.setItem("issues_db", JSON.stringify(defaultIssues));
    }
  };

  // Load stats and list data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load issues from localStorage
      const storedIssues = localStorage.getItem("issues_db");
      if (storedIssues) {
        setIssues(JSON.parse(storedIssues));
      }

      // Fetch logged-in user profile
      if (employeeId && token) {
        const profileRes = await api.get(`/employees/${employeeId}`, { headers });
        if (profileRes.data && profileRes.data.success) {
          setCurrentAdmin(profileRes.data.data);
        }
      }

      // Fetch employees count
      try {
        const empRes = await api.get("/employees", { headers });
        if (empRes.data && empRes.data.success) {
          const empList = empRes.data.data || [];
          // Count those with role = 'employee'
          const count = empList.filter(e => e.role === "employee" || !e.role).length;
          setEmployeesCount(count > 0 ? count : 1248);
        }
      } catch (err) {
        console.error("Error fetching employees count:", err);
      }

      // Fetch HR accounts list
      try {
        const hrRes = await api.get("/hr", { headers });
        if (hrRes.data && hrRes.data.success) {
          setHrAccounts(hrRes.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching HR accounts:", err);
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeIssuesDb();
    loadData();

    // Clock update
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    // Listen to local changes to issue reports
    const handleStorageChange = () => {
      const stored = localStorage.getItem("issues_db");
      if (stored) {
        setIssues(JSON.parse(stored));
      }
    };
    window.addEventListener("storage_issues_changed", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage_issues_changed", handleStorageChange);
    };
  }, []);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employeeId");
    localStorage.removeItem("role");
    localStorage.removeItem("employeeEmail");
    // Hard refresh/redirect
    window.location.reload();
  };

  // Add HR Account API call
  const handleAddHR = async (e) => {
    e.preventDefault();
    if (!addHRForm.employeeId || !addHRForm.name || !addHRForm.email || !addHRForm.department || !addHRForm.password) {
      alert("All fields are required");
      return;
    }
    if (addHRForm.password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    try {
      const response = await api.post("/hr", addHRForm, { headers });
      if (response.data && response.data.success) {
        alert("HR Account created successfully");
        setShowAddHRModal(false);
        setAddHRForm({ employeeId: "", name: "", email: "", department: "", password: "" });
        loadData();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create HR account");
    }
  };

  // Open Edit HR Modal
  const openEditHR = (hr) => {
    setSelectedHR(hr);
    setEditHRForm({
      name: hr.name,
      email: hr.email,
      department: hr.department
    });
    setShowHRDrawer(false);
    setShowEditHRModal(true);
  };

  // Update HR Account API call
  const handleEditHR = async (e) => {
    e.preventDefault();
    if (!editHRForm.name || !editHRForm.email || !editHRForm.department) {
      alert("All fields are required");
      return;
    }

    try {
      const response = await api.put(`/hr/${selectedHR.employee_id}`, editHRForm, { headers });
      if (response.data && response.data.success) {
        alert("HR Account updated successfully");
        setShowEditHRModal(false);
        setSelectedHR(null);
        loadData();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update HR account");
    }
  };

  // Delete HR Account API call
  const handleDeleteHR = async (hrId) => {
    if (!window.confirm(`Are you sure you want to delete HR Account ${hrId}?`)) {
      return;
    }

    try {
      const response = await api.delete(`/hr/${hrId}`, { headers });
      if (response.data && response.data.success) {
        alert("HR Account deleted successfully");
        setShowHRDrawer(false);
        setSelectedHR(null);
        loadData();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete HR account");
    }
  };

  // Update Issue Status (localStorage)
  const handleUpdateIssueStatus = (issueId, newStatus) => {
    const updated = issues.map(iss => {
      if (iss.id === issueId) {
        return { ...iss, status: newStatus };
      }
      return iss;
    });
    localStorage.setItem("issues_db", JSON.stringify(updated));
    setIssues(updated);
    // Update active drawer details
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue({ ...selectedIssue, status: newStatus });
    }
  };

  // Delete Issue (localStorage)
  const handleDeleteIssue = (issueId) => {
    if (!window.confirm("Are you sure you want to delete this issue?")) {
      return;
    }
    const filtered = issues.filter(iss => iss.id !== issueId);
    localStorage.setItem("issues_db", JSON.stringify(filtered));
    setIssues(filtered);
    setShowIssueDrawer(false);
    setSelectedIssue(null);
  };

  // Export tables to CSV
  const exportHRToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee ID,Name,Email,Department,Created Date\n";
    hrAccounts.forEach(hr => {
      const dateFormatted = new Date(hr.created_at).toLocaleDateString();
      csvContent += `${hr.employee_id},${hr.name},${hr.email},${hr.department},${dateFormatted}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "hr_accounts_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportIssuesToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Issue ID,Subject,Reported By,Role,Priority,Status,Reported Date\n";
    issues.forEach(iss => {
      csvContent += `${iss.id},"${iss.subject}",${iss.reportedBy},${iss.role},${iss.priority},${iss.status},${iss.reportedDate}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "issues_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for generating colored initials avatars
  const getInitials = (name) => {
    if (!name) return "HR";
    const parts = name.split(" ");
    return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
  };

  const getAvatarBg = (name) => {
    const sum = (name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "bg-blue-600", "bg-emerald-600", "bg-violet-600", 
      "bg-amber-600", "bg-rose-600", "bg-indigo-600"
    ];
    return colors[sum % colors.length];
  };

  // Filtering calculations
  const filteredHR = hrAccounts.filter(hr => {
    const matchesSearch = hr.name.toLowerCase().includes(hrSearch.toLowerCase()) || 
                          hr.employee_id.toLowerCase().includes(hrSearch.toLowerCase()) ||
                          hr.email.toLowerCase().includes(hrSearch.toLowerCase());
    const matchesDept = hrDept === "All Departments" || hr.department === hrDept;
    return matchesSearch && matchesDept;
  });

  const filteredIssues = issues.filter(iss => {
    const matchesSearch = iss.subject.toLowerCase().includes(issueSearch.toLowerCase()) ||
                          iss.id.toLowerCase().includes(issueSearch.toLowerCase()) ||
                          iss.reportedBy.toLowerCase().includes(issueSearch.toLowerCase());
    const matchesStatus = issueStatusFilter === "Status" || iss.status === issueStatusFilter;
    const matchesPriority = issuePriorityFilter === "Priority" || iss.priority === issuePriorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate statistics counts
  const totalEmployeesCount = employeesCount;
  const totalHRCount = hrAccounts.length > 0 ? hrAccounts.length : 24;
  const totalIssuesCount = issues.length > 0 ? issues.length : 168;
  const openIssuesCount = issues.filter(i => i.status === "Open" || i.status === "In Progress").length;
  const resolvedIssuesCount = issues.filter(i => i.status === "Resolved").length;

  // Intercept for full-screen settings subviews
  if (subView === "change-password") {
    return <ChangePassword goBack={() => setSubView(null)} email={currentAdmin?.email} />;
  }
  if (subView === "report-issue") {
    return <ReportIssue goBack={() => setSubView(null)} currentUser={currentAdmin} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative text-slate-800">
      
      {/* 1. APP NAVIGATION BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 select-none">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left: Logo & Tabs */}
          <div className="flex items-center gap-10">
            <div className="text-[#2563EB] font-bold text-xl tracking-tight flex items-center gap-1">
              <span>PresenceHub</span>
            </div>
            <nav className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`py-2 px-3 text-sm font-semibold transition-all ${
                  activeTab === "dashboard" 
                    ? "text-[#2563EB] border-b-2 border-[#2563EB] rounded-none font-bold" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab("hrm")}
                className={`py-1.5 px-3 text-sm font-semibold transition-all rounded-lg ${
                  activeTab === "hrm" 
                    ? "bg-blue-50 text-blue-600 font-bold" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                HR Management
              </button>
              <button 
                onClick={() => setActiveTab("issues")}
                className={`py-2 px-3 text-sm font-semibold transition-all ${
                  activeTab === "issues" 
                    ? "text-[#2563EB] border-b-2 border-[#2563EB] rounded-none font-bold" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Issues
              </button>
            </nav>
          </div>

          {/* Right: Notifications & Profile dropdown */}
          <div className="flex items-center gap-4 relative">
            <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell className="w-5.5 h-5.5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>

            {/* Profile Avatar */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 focus:outline-none flex items-center justify-center bg-blue-600 text-white font-bold"
              >
                {currentAdmin?.name ? getInitials(currentAdmin.name) : "AD"}
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)}></div>
                  <div className="absolute right-0 mt-2.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                    <button 
                      onClick={() => { setShowProfileDropdown(false); setShowProfileDrawer(true); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>My Profile</span>
                    </button>
                    <button 
                      onClick={() => { setShowProfileDropdown(false); setSubView("change-password"); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <KeyRound className="w-4 h-4 text-slate-400" />
                      <span>Change Password</span>
                    </button>
                    <button 
                      onClick={() => { setShowProfileDropdown(false); setSubView("report-issue"); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Report Issue</span>
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8">
        
        {/* --- LOADING SCREEN --- */}
        {loading && (
          <div className="h-[60vh] flex items-center justify-center flex-col gap-2">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Loading system database...</p>
          </div>
        )}

        {/* --- DASHBOARD VIEW --- */}
        {!loading && activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good Morning, Admin</h1>
                <p className="text-sm text-slate-500 mt-1">{currentDate}</p>
              </div>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
                <Clock className="w-4.5 h-4.5 text-blue-500" />
                <span className="text-sm font-semibold text-slate-800">{currentTime}</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="space-y-6">
              {/* Row 1 (Two Large Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Employees */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Employees</p>
                      <h2 className="text-4xl font-bold text-slate-950 tracking-tight mt-1">{totalEmployeesCount.toLocaleString()}</h2>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* HR Accounts */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">HR Accounts</p>
                      <h2 className="text-4xl font-bold text-slate-950 tracking-tight mt-1">{totalHRCount}</h2>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2 (Three Smaller Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Issues */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col justify-between min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Issues</p>
                      <h2 className="text-3xl font-bold text-slate-950 tracking-tight mt-1">{totalIssuesCount}</h2>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Open Issues */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col justify-between min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Issues</p>
                      <h2 className="text-3xl font-bold text-red-600 tracking-tight mt-1">{openIssuesCount}</h2>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-6 right-16">
                    <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-rose-100">
                      High Priority
                    </span>
                  </div>
                </div>

                {/* Resolved Issues */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col justify-between min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved Issues</p>
                      <h2 className="text-3xl font-bold text-slate-950 tracking-tight mt-1">{resolvedIssuesCount}</h2>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-6 right-16">
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide border border-blue-100">
                      +12%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200/60 pt-6 mt-16 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-4">
              <p>© 2024 PresenceHub Enterprise. All rights reserved.</p>
              <div className="flex gap-4">
                <a href="#privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
                <a href="#terms" className="hover:text-slate-600 transition-colors">Terms of Service</a>
                <a href="#support" className="hover:text-slate-600 transition-colors">Support</a>
              </div>
            </footer>
          </div>
        )}

        {/* --- HR MANAGEMENT VIEW --- */}
        {!loading && activeTab === "hrm" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-950 tracking-tight">HR Management</h1>
                <p className="text-sm text-slate-500 mt-0.5">Manage Human Resource accounts</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={exportHRToCSV}
                  className="bg-white hover:bg-slate-50 text-blue-600 border border-blue-600 rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <Download className="w-4.5 h-4.5" />
                  <span>Export CSV</span>
                </button>
                <button 
                  onClick={() => setShowAddHRModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span>Add HR</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search HR (Name or ID)..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={hrSearch}
                  onChange={(e) => setHrSearch(e.target.value)}
                />
              </div>

              <div className="relative w-full sm:w-auto">
                <select 
                  className="w-full sm:w-48 pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                  value={hrDept}
                  onChange={(e) => setHrDept(e.target.value)}
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Recruitment">Recruitment</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-500">
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                      <th className="py-4.5 px-6">Employee ID</th>
                      <th className="py-4.5 px-6">Name</th>
                      <th className="py-4.5 px-6">Email</th>
                      <th className="py-4.5 px-6">Department</th>
                      <th className="py-4.5 px-6">Created Date</th>
                      <th className="py-4.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHR.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-sm text-slate-400 bg-white">
                          No HR accounts found matching the search.
                        </td>
                      </tr>
                    ) : (
                      filteredHR.map(hr => (
                        <tr 
                          key={hr.employee_id}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer text-sm"
                          onClick={() => { setSelectedHR(hr); setShowHRDrawer(true); }}
                        >
                          <td className="py-4 px-6 text-blue-600 font-medium">{hr.employee_id}</td>
                          <td className="py-4 px-6 font-semibold text-slate-900">
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold ${getAvatarBg(hr.name)}`}>
                                {getInitials(hr.name)}
                              </span>
                              <span>{hr.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-500">{hr.email}</td>
                          <td className="py-4 px-6">
                            <span className="bg-slate-100 border border-slate-200/60 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">
                              {hr.department}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-500">
                            {new Date(hr.created_at || Date.now()).toLocaleDateString("en-US", {
                              month: "short",
                              day: "2-digit",
                              year: "numeric"
                            })}
                          </td>
                          <td className="py-4 px-6 text-right relative" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => setActiveHRActionMenu(activeHRActionMenu === hr.employee_id ? null : hr.employee_id)}
                              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeHRActionMenu === hr.employee_id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveHRActionMenu(null)}></div>
                                <div className="absolute right-6 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-left">
                                  <button 
                                    onClick={() => { setActiveHRActionMenu(null); setSelectedHR(hr); setShowHRDrawer(true); }}
                                    className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    View Details
                                  </button>
                                  <button 
                                    onClick={() => { setActiveHRActionMenu(null); openEditHR(hr); }}
                                    className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    Edit Account
                                  </button>
                                  <div className="border-t border-slate-100 my-1"></div>
                                  <button 
                                    onClick={() => { setActiveHRActionMenu(null); handleDeleteHR(hr.employee_id); }}
                                    className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50/50 transition-colors"
                                  >
                                    Delete HR
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
              </div>

              {/* Table pagination */}
              <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 text-xs text-slate-500 gap-3">
                <p>Showing 1 to {filteredHR.length} of {hrAccounts.length} entries</p>
                <div className="flex items-center gap-1 font-semibold">
                  <button className="p-1 px-2 border border-slate-200 rounded hover:bg-white text-slate-400 transition-colors">{"<"}</button>
                  <button className="p-1 px-3.5 bg-blue-600 text-white rounded shadow-sm">1</button>
                  <button className="p-1 px-3 border border-slate-200 rounded hover:bg-white transition-colors">2</button>
                  <button className="p-1 px-3 border border-slate-200 rounded hover:bg-white transition-colors">3</button>
                  <span className="px-1">...</span>
                  <button className="p-1 px-3 border border-slate-200 rounded hover:bg-white transition-colors">10</button>
                  <button className="p-1 px-2 border border-slate-200 rounded hover:bg-white transition-colors">{">"}</button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200/60 pt-6 mt-16 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-4">
              <p>PresenceHub Enterprise v2.4.0 • © 2024 • All rights reserved</p>
              <div className="flex gap-4">
                <a href="#privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
                <a href="#terms" className="hover:text-slate-600 transition-colors">Terms of Service</a>
                <a href="#support" className="hover:text-slate-600 transition-colors">Support</a>
              </div>
            </footer>
          </div>
        )}

        {/* --- ISSUES VIEW --- */}
        {!loading && activeTab === "issues" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Issue Management</h1>
                <p className="text-sm text-slate-500 mt-0.5">Monitor and manage issues submitted by employees and HR.</p>
              </div>
              <div className="flex items-center">
                <button 
                  onClick={exportIssuesToCSV}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2 text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <Download className="w-4.5 h-4.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={issueSearch}
                  onChange={(e) => setIssueSearch(e.target.value)}
                />
              </div>

              <div className="relative w-full sm:w-auto">
                <select 
                  className="w-full sm:w-36 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer text-slate-600"
                  value={issueStatusFilter}
                  onChange={(e) => setIssueStatusFilter(e.target.value)}
                >
                  <option value="Status">Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="relative w-full sm:w-auto">
                <select 
                  className="w-full sm:w-36 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer text-slate-600"
                  value={issuePriorityFilter}
                  onChange={(e) => setIssuePriorityFilter(e.target.value)}
                >
                  <option value="Priority">Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                      <th className="py-4.5 px-6">Issue ID</th>
                      <th className="py-4.5 px-6">Subject</th>
                      <th className="py-4.5 px-6">Reported By</th>
                      <th className="py-4.5 px-6">Role</th>
                      <th className="py-4.5 px-6">Priority</th>
                      <th className="py-4.5 px-6">Status</th>
                      <th className="py-4.5 px-6">Reported Date</th>
                      <th className="py-4.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredIssues.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-sm text-slate-400 bg-white">
                          No issues found.
                        </td>
                      </tr>
                    ) : (
                      filteredIssues.map(iss => (
                        <tr 
                          key={iss.id}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer text-sm"
                          onClick={() => { setSelectedIssue(iss); setShowIssueDrawer(true); }}
                        >
                          <td className="py-4 px-6 text-blue-600 font-medium">{iss.id}</td>
                          <td className="py-4 px-6 font-semibold text-slate-900">{iss.subject}</td>
                          <td className="py-4 px-6 text-slate-700">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold ${getAvatarBg(iss.reportedBy)}`}>
                                {getInitials(iss.reportedBy)}
                              </span>
                              <span>{iss.reportedBy}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-500">{iss.role}</td>
                          <td className="py-4 px-6">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                iss.priority === "High" ? "bg-rose-500" : iss.priority === "Medium" ? "bg-amber-500" : "bg-emerald-500"
                              }`}></span>
                              <span>{iss.priority}</span>
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                              iss.status === "Open" 
                                ? "bg-rose-50 border-rose-100 text-rose-600" 
                                : iss.status === "In Progress"
                                ? "bg-amber-50 border-amber-100 text-amber-600" 
                                : "bg-emerald-50 border-emerald-100 text-emerald-600"
                            }`}>
                              {iss.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-500">{iss.reportedDate}</td>
                          <td className="py-4 px-6 text-right relative" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => setActiveIssueActionMenu(activeIssueActionMenu === iss.id ? null : iss.id)}
                              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeIssueActionMenu === iss.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveIssueActionMenu(null)}></div>
                                <div className="absolute right-6 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-left">
                                  <button 
                                    onClick={() => { setActiveIssueActionMenu(null); setSelectedIssue(iss); setShowIssueDrawer(true); }}
                                    className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    View Details
                                  </button>
                                  <button 
                                    onClick={() => { setActiveIssueActionMenu(null); handleUpdateIssueStatus(iss.id, "In Progress"); }}
                                    className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    Set In Progress
                                  </button>
                                  <button 
                                    onClick={() => { setActiveIssueActionMenu(null); handleUpdateIssueStatus(iss.id, "Resolved"); }}
                                    className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                                  >
                                    Set Resolved
                                  </button>
                                  <div className="border-t border-slate-100 my-1"></div>
                                  <button 
                                    onClick={() => { setActiveIssueActionMenu(null); handleDeleteIssue(iss.id); }}
                                    className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50/50 transition-colors"
                                  >
                                    Delete Issue
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
              </div>

              {/* Pagination */}
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200 text-xs text-slate-500">
                <p>Showing 1 to {filteredIssues.length} of {issues.length} issues</p>
                <div className="flex items-center gap-1">
                  <button className="p-1 px-2 border border-slate-200 rounded hover:bg-white text-slate-400 transition-colors">{"<"}</button>
                  <button className="p-1 px-2.5 border border-slate-200 rounded hover:bg-white text-slate-400 transition-colors">{">"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- DRAWERS & MODALS --- */}

      {/* A. HR DETAILS DRAWER (Slides from Right) */}
      {showHRDrawer && selectedHR && (
        <>
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-50 transition-opacity" onClick={() => setShowHRDrawer(false)}></div>
          <div className="fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col justify-between animate-in slide-in-from-right duration-350 select-none">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]">
              <h2 className="text-lg font-bold text-slate-900">HR Details</h2>
              <button onClick={() => setShowHRDrawer(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200/50 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Excludes Security Level) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Card */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className={`w-20 h-20 rounded-full text-white flex items-center justify-center text-2xl font-bold ${getAvatarBg(selectedHR.name)} mb-3 relative shadow-md`}>
                  {getInitials(selectedHR.name)}
                  <span className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 text-white border-2 border-white rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedHR.name}</h3>
                <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-100 mt-1 inline-block">
                  HR Manager
                </span>
              </div>

              {/* Info grid */}
              <div className="space-y-4">
                {/* Employee ID */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Employee ID</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedHR.employee_id}</p>
                  </div>
                </div>

                {/* Email Address */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedHR.email}</p>
                  </div>
                </div>

                {/* Department */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <GitBranch className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Department</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedHR.department}</p>
                  </div>
                </div>

                {/* Created Date */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Created Date</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(selectedHR.created_at || Date.now()).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-slate-100 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => openEditHR(selectedHR)}
                  className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-600 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <User className="w-4 h-4" />
                  <span>Edit HR</span>
                </button>
                <button 
                  onClick={() => handleDeleteHR(selectedHR.employee_id)}
                  className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-600 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete HR</span>
                </button>
              </div>
              <button 
                onClick={() => setShowHRDrawer(false)}
                className="w-full text-center py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* B. ISSUE DETAILS DRAWER (Slides from Right) */}
      {showIssueDrawer && selectedIssue && (
        <>
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-50 transition-opacity" onClick={() => setShowIssueDrawer(false)}></div>
          <div className="fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col justify-between animate-in slide-in-from-right duration-350 select-none">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Issue Details</h2>
                <p className="text-xs text-blue-600 font-semibold mt-0.5">{selectedIssue.id}</p>
              </div>
              <button onClick={() => setShowIssueDrawer(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200/50 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Excludes Assigned To) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Subject */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Subject</h4>
                <p className="text-base font-semibold text-slate-900 leading-snug">{selectedIssue.subject}</p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Description</h4>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                  "{selectedIssue.description}"
                </p>
              </div>

              {/* Priority & Status side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Priority</span>
                  <div className="flex items-center gap-2 mt-1 font-semibold text-sm">
                    <span className={`w-2 h-2 rounded-full ${
                      selectedIssue.priority === "High" ? "bg-rose-500" : selectedIssue.priority === "Medium" ? "bg-amber-500" : "bg-emerald-500"
                    }`}></span>
                    <span>{selectedIssue.priority}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</span>
                  <div className="flex items-center gap-2 mt-1 font-semibold text-sm">
                    <span className={`w-2 h-2 rounded-full ${
                      selectedIssue.status === "Open" ? "bg-rose-500" : selectedIssue.status === "In Progress" ? "bg-amber-500" : "bg-emerald-500"
                    }`}></span>
                    <span>{selectedIssue.status}</span>
                  </div>
                </div>
              </div>

              {/* Attachment Card */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Attachment</h4>
                {selectedIssue.attachment ? (
                  <div className="border border-slate-200 rounded-xl p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 max-w-[200px] truncate">{selectedIssue.attachment.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{selectedIssue.attachment.size} • {selectedIssue.attachment.type}</p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      <Download className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No attachments provided.</p>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions (Directly following Attachment, no Assigned To) */}
            <div className="p-6 border-t border-slate-100 space-y-4">
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleUpdateIssueStatus(selectedIssue.id, "In Progress")}
                  className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
                >
                  Mark In Progress
                </button>
                <button 
                  onClick={() => handleUpdateIssueStatus(selectedIssue.id, "Resolved")}
                  className="w-full bg-white hover:bg-blue-50 text-blue-600 border border-blue-600 font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
                >
                  Mark Resolved
                </button>
              </div>
              <button 
                onClick={() => handleDeleteIssue(selectedIssue.id)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors pt-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Issue</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* C. CREATE HR ACCOUNT MODAL (Centered, Blurred Backdrop) */}
      {showAddHRModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-lg w-full relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Create HR Account</h2>
              <button 
                onClick={() => setShowAddHRModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddHR} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Employee ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Employee ID</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Users className="w-4.5 h-4.5" />
                    </span>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., HR-1234"
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 bg-white"
                      value={addHRForm.employeeId}
                      onChange={(e) => setAddHRForm({ ...addHRForm, employeeId: e.target.value })}
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <User className="w-4.5 h-4.5" />
                    </span>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., John Doe"
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 bg-white"
                      value={addHRForm.name}
                      onChange={(e) => setAddHRForm({ ...addHRForm, name: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g., j.doe@presencehub.com"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 bg-white"
                    value={addHRForm.email}
                    onChange={(e) => setAddHRForm({ ...addHRForm, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Department Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Department</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <GitBranch className="w-4.5 h-4.5" />
                  </span>
                  <select 
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-700 bg-white cursor-pointer"
                    value={addHRForm.department}
                    onChange={(e) => setAddHRForm({ ...addHRForm, department: e.target.value })}
                  >
                    <option value="" disabled>Select Department</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Recruitment">Recruitment</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input 
                    type={showAddHRPassword ? "text" : "password"}
                    required
                    placeholder="Create a strong password"
                    className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 bg-white"
                    value={addHRForm.password}
                    onChange={(e) => setAddHRForm({ ...addHRForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddHRPassword(!showAddHRPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showAddHRPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Password must be at least 8 characters</p>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddHRModal(false)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all shadow-sm animate-pulse-once"
                >
                  Create HR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. EDIT HR ACCOUNT MODAL (Centered, Blurred Backdrop) */}
      {showEditHRModal && selectedHR && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 max-w-lg w-full relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Edit HR Account</h2>
              <button 
                onClick={() => setShowEditHRModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditHR} className="space-y-4">
              
              {/* Employee ID (Disabled) */}
              <div className="space-y-1.5 opacity-60">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Employee ID (Read Only)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Users className="w-4.5 h-4.5" />
                  </span>
                  <input 
                    type="text" 
                    disabled
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm"
                    value={selectedHR.employee_id}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-4.5 h-4.5" />
                  </span>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., John Doe"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 bg-white"
                    value={editHRForm.name}
                    onChange={(e) => setEditHRForm({ ...editHRForm, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g., j.doe@presencehub.com"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 bg-white"
                    value={editHRForm.email}
                    onChange={(e) => setEditHRForm({ ...editHRForm, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Department Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Department</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <GitBranch className="w-4.5 h-4.5" />
                  </span>
                  <select 
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-700 bg-white cursor-pointer"
                    value={editHRForm.department}
                    onChange={(e) => setEditHRForm({ ...editHRForm, department: e.target.value })}
                  >
                    <option value="" disabled>Select Department</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Recruitment">Recruitment</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowEditHRModal(false)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E. CURRENT LOGGED-IN ADMIN PROFILE DRAWER */}
      {showProfileDrawer && currentAdmin && (
        <>
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-50 transition-opacity" onClick={() => setShowProfileDrawer(false)}></div>
          <div className="fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col justify-between animate-in slide-in-from-right duration-350 select-none">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]">
              <h2 className="text-lg font-bold text-slate-900">My Profile</h2>
              <button onClick={() => setShowProfileDrawer(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200/50 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Card */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mb-3 relative shadow-md">
                  {getInitials(currentAdmin.name)}
                  <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{currentAdmin.name}</h3>
                <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-slate-200/60 mt-1 inline-block uppercase tracking-wider">
                  {currentAdmin.role === "admin" ? "System Admin" : "HR Manager"}
                </span>
              </div>

              {/* Info grid */}
              <div className="space-y-4">
                {/* Employee ID */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Employee ID</p>
                    <p className="text-sm font-semibold text-slate-800">{currentAdmin.employee_id}</p>
                  </div>
                </div>

                {/* Email Address */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</p>
                    <p className="text-sm font-semibold text-slate-800">{currentAdmin.email}</p>
                  </div>
                </div>

                {/* Department */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <GitBranch className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Department</p>
                    <p className="text-sm font-semibold text-slate-800">{currentAdmin.department || "Administration"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-slate-100 space-y-4">
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => { setShowProfileDrawer(false); setSubView("change-password"); }}
                  className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-600 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
                <button 
                  onClick={() => { setShowProfileDrawer(false); setSubView("report-issue"); }}
                  className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-600 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>Report an Issue</span>
                </button>
              </div>
              <button 
                onClick={() => setShowProfileDrawer(false)}
                className="w-full text-center py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default HRDashboard;
