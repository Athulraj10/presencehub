import React, { useState } from "react";
import { Mail, Lock, Shield, HelpCircle, Eye, EyeOff, RotateCcw, ArrowRight, ArrowLeft } from "lucide-react";
import api from "../services/api";

function ForgotPassword({ goBack }) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email || !newPassword || !confirmPassword) {
      alert("All fields are required");
      return;
    }
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/employees/forgot-password", {
        email,
        newPassword,
      });
      alert(response.data.message || "Password reset successful");
      goBack();
    } catch (error) {
      alert(error.response?.data?.message || "Reset Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-between p-6 overflow-hidden select-none font-sans">
      {/* Top Header */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-blue-600 font-semibold text-lg">
          <Shield className="w-5 h-5 fill-current" />
          <span>Security</span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center z-10 py-10">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-[420px] w-full">
          {/* Key Icon Circle */}
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <RotateCcw className="w-5 h-5" />
          </div>

          <h1 className="text-2xl font-semibold text-slate-900 text-center mb-1.5">
            Forgot Password?
          </h1>
          <p className="text-sm text-slate-500 text-center mb-6 px-2 leading-relaxed">
            Enter your email and new password to reset your account access.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 transition-shadow bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 transition-shadow bg-white"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 transition-shadow bg-white"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Reset Password Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2"
            >
              <span>{loading ? "Resetting..." : "Reset Password"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={goBack}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer spacer */}
      <div className="w-full z-10 text-center py-2 text-xs text-slate-400 opacity-0 select-none pointer-events-none">
        Spacer
      </div>

      {/* Faded Watermark in Bottom-Right */}
      <div className="absolute -bottom-8 -right-8 w-64 h-64 text-blue-100/35 pointer-events-none z-0">
        <Shield className="w-full h-full stroke-[1.25]" />
      </div>
    </div>
  );
}

export default ForgotPassword;