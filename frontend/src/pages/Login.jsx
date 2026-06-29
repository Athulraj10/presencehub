import React, { useState } from "react";
import { Mail, Lock, Shield, Eye, EyeOff, HelpCircle, Globe, ArrowRight } from "lucide-react";
import api from "../services/api";

function Login({ onLogin, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields");
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


      alert("Login Successful");


      onLogin(response.data.role);


    } catch (error) {
      alert(error.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-between p-6 overflow-hidden select-none font-sans">
      {/* Top Header (Matching ForgotPassword design) */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-blue-600 font-semibold text-lg">
          <Shield className="w-5 h-5 fill-current" />
          <span>Security</span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center z-10 py-10">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-[420px] w-full">
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
      </div>

      {/* Footer */}
      <div className="w-full z-10 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/60 pt-4 text-xs text-slate-400">
        <p>Security Policy © 2024. All Rights Reserved.</p>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <button className="flex items-center gap-1 hover:text-slate-600 transition-colors">
            <HelpCircle className="w-4 h-4" />
            <span>Support</span>
          </button>
          <button className="flex items-center gap-1 hover:text-slate-600 transition-colors">
            <Globe className="w-4 h-4" />
            <span>Language</span>
          </button>
        </div>
      </div>

      {/* Faded Watermark in Bottom-Right */}
      <div className="absolute -bottom-8 -right-8 w-64 h-64 text-blue-100/35 pointer-events-none z-0">
        <Shield className="w-full h-full stroke-[1.25]" />
      </div>
    </div>
  );
}

export default Login;