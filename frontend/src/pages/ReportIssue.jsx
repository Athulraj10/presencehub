import React, { useState } from "react";
import { ArrowLeft, Cloud, ShieldCheck, HelpCircle, Send, Lock } from "lucide-react";

function ReportIssue({ goBack, currentUser }) {
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const maxChars = 1000;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile({
        name: selectedFile.name,
        size: (selectedFile.size / (1024 * 1024)).toFixed(1) + " MB",
        type: selectedFile.type.split("/")[1]?.toUpperCase() || "PDF"
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject || !priority || !description) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    
    // Simulate submission delay
    setTimeout(() => {
      const issueId = `#ISS-${Math.floor(1000 + Math.random() * 9000)}`;
      const newIssue = {
        id: issueId,
        subject,
        description,
        reportedBy: currentUser?.name || "Alex Simmons",
        role: currentUser?.role === "hr" ? "HR Manager" : currentUser?.role === "admin" ? "Admin" : "Employee",
        priority: priority,
        status: "Open",
        reportedDate: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric"
        }),
        attachment: file ? {
          name: file.name,
          size: file.size,
          type: file.type
        } : null
      };

      // Load existing issues
      let existingIssues = [];
      try {
        const stored = localStorage.getItem("issues_db");
        if (stored) {
          existingIssues = JSON.parse(stored);
        }
      } catch (err) {
        console.error("Error reading issues database:", err);
      }

      // Prepend the new issue
      existingIssues.unshift(newIssue);
      localStorage.setItem("issues_db", JSON.stringify(existingIssues));

      // Also trigger a custom event so other components know storage updated
      window.dispatchEvent(new Event("storage_issues_changed"));

      alert(`Issue ${issueId} submitted successfully!`);
      setLoading(false);
      goBack();
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col font-sans p-6 text-slate-800">
      {/* Top Navigation */}
      <div className="w-full flex justify-between items-center mb-10 max-w-4xl mx-auto">
        <button
          onClick={goBack}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-slate-500" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full mx-auto pb-12">
        <h1 className="text-3xl font-semibold text-slate-900 text-center mb-2">
          Report an Issue
        </h1>
        <p className="text-sm text-slate-500 text-center mb-8 max-w-md leading-relaxed">
          Your safety is our priority. Please provide details about the incident or concern.
        </p>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 tracking-wide">
                Subject
              </label>
              <input
                type="text"
                required
                placeholder="Enter a subject"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 bg-white"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 tracking-wide">
                Priority
              </label>
              <select
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-700 bg-white cursor-pointer"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="" disabled>Select priority level</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 tracking-wide">
                Description
              </label>
              <textarea
                required
                rows={5}
                maxLength={maxChars}
                placeholder="Please describe what happened in detail..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 bg-white resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="text-right text-xs text-slate-400">
                {description.length} / {maxChars} characters
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 tracking-wide">
                Attachments (Photos or Videos)
              </label>
              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*,video/mp4,application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <Cloud className="w-5 h-5" />
                </div>
                {file ? (
                  <div className="text-center">
                    <span className="text-sm font-medium text-slate-700 block max-w-[400px] truncate">{file.name}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">{file.size} • {file.type}</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-sm font-medium text-slate-700 block">Click to upload or drag and drop</span>
                    <span className="text-xs text-slate-400 block mt-0.5">PNG, JPG, or MP4 (Max 25MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
            >
              <span>{loading ? "Submitting..." : "Submit Report"}</span>
              <Send className="w-4 h-4 fill-current" />
            </button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-4">
              <Lock className="w-3.5 h-3.5" />
              <span>Your submission is encrypted and strictly confidential.</span>
            </div>
          </form>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center">
          <a
            href="mailto:support@presencehub.co"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-all"
          >
            Need immediate help? Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

export default ReportIssue;
