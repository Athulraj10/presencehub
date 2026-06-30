import React, { useState } from "react";
import { Mail, Lock, Shield, Eye, EyeOff, HelpCircle, Globe, ArrowRight, AlertCircle } from "lucide-react";
import api from "../services/api";

function Login({ onLogin, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showCustomModal("Error", "Please fill in all fields", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/employees/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("employeeId", response.data.employeeId);
      localStorage.setItem("role", response.data.role);
      
      // Let's store the email too for Change Password and other profile features
      localStorage.setItem("employeeEmail", email);

      showCustomModal("Success", "Login Successful", "success", () => {
        onLogin(response.data.role);
      });

    } catch (error) {
      showCustomModal("Error", error.response?.data?.message || "Login Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-6 select-none font-sans">
      {/* Main Login Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-[420px] w-full z-10">
        {/* Logo Circle */}
        <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-5 shadow-md shadow-blue-200">
          <Shield className="w-6 h-6 fill-current" />
        </div>

        <h1 className="text-2xl font-bold text-slate-950 text-center mb-1.5">
          Welcome
        </h1>
        <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
          Authorized access only. Please sign in to your enterprise account.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                placeholder="Enter your Email"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 transition-shadow bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Password
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 transition-shadow bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2 shadow-sm"
          >
            <span>{loading ? "Signing In..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-[90%] max-w-sm p-6 shadow-2xl border border-slate-100 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
              modalConfig.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
              modalConfig.type === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'
            }`}>
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{modalConfig.title}</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {modalConfig.message}
            </p>
            <button 
              onClick={closeCustomModal}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;