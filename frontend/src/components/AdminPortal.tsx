import React, { useState, useEffect } from 'react';
import { adminAPI, interviewAPI } from '../api';
import { FormattedMarkdown } from './FormattedMarkdown';
import { LiveInterviewRoom } from './LiveInterviewRoom';
import { 
  Users, TrendingUp, ShieldCheck, Sparkles, FileText, PlusCircle, 
  Search, Award, AlertTriangle, CheckCircle2, ChevronRight, BarChart3, Upload,
  Briefcase, GraduationCap, LayoutDashboard, Video, Calendar, RefreshCw
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

import { Toast } from './Toast';

export const AdminPortal: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };
  const [students, setStudents] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [adminInterviews, setAdminInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'live_feed' | 'student_requests' | 'recruiter_requests' | 'drive_requests' | 'ongoing_drives' | 'students_dir' | 'trends' | 'live_interviews'>('overview');

  // Live Placement Activity Feed State
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(false);

  const fetchLivePlacementFeed = async () => {
    setLoadingFeed(true);
    try {
      const feed = await adminAPI.getLivePlacementFeed();
      setLiveFeed(feed);
    } catch (e) {
      console.error('Error fetching live placement feed:', e);
    } finally {
      setLoadingFeed(false);
    }
  };

  // Active & Ongoing Campus Drives State
  const [activeJobDrives, setActiveJobDrives] = useState<any[]>([]);
  const [selectedActiveDrive, setSelectedActiveDrive] = useState<any | null>(null);
  const [driveApps, setDriveApps] = useState<any[]>([]);
  const [loadingDriveApps, setLoadingDriveApps] = useState<boolean>(false);

  // Create Student Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    email: '',
    full_name: '',
    usn: '',
    branch: 'Computer Science & Engineering',
    cgpa: 0,
  });
  const [creating, setCreating] = useState(false);

  // Executive Report & Skill Demand State
  const [driveReport, setDriveReport] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [skillTrends, setSkillTrends] = useState('');
  const [loadingTrends, setLoadingTrends] = useState(false);

  // 360 AI Report Modal State
  const [selectedCandidateReport, setSelectedCandidateReport] = useState<any>(null);
  const [loadingReportId, setLoadingReportId] = useState<number | null>(null);

  // Access Requests & Hold Management State
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<any[]>([]);
  const [pendingJobDrives, setPendingJobDrives] = useState<any[]>([]);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [actionProcessingId, setActionProcessingId] = useState<number | null>(null);
  const [selectedInterviewForRoom, setSelectedInterviewForRoom] = useState<any | null>(null);

  useEffect(() => {
    fetchAdminData();
    fetchAccessRequests();
    fetchPendingJobDrives();
    fetchActiveJobDrives();
    fetchAdminInterviews();
    fetchLivePlacementFeed();
  }, []);

  const fetchActiveJobDrives = async () => {
    try {
      const drives = await adminAPI.getActiveJobDrives();
      setActiveJobDrives(drives);
      if (drives.length > 0 && !selectedActiveDrive) {
        setSelectedActiveDrive(drives[0]);
        fetchDriveApplicants(drives[0].job_id);
      }
    } catch (e) {
      console.error('Error fetching active job drives:', e);
    }
  };

  const fetchDriveApplicants = async (jobId: number) => {
    setLoadingDriveApps(true);
    try {
      const apps = await adminAPI.getJobApplications(jobId);
      setDriveApps(apps);
    } catch (e) {
      console.error('Error fetching drive applications:', e);
    } finally {
      setLoadingDriveApps(false);
    }
  };

  const fetchAccessRequests = async () => {
    try {
      const [pending, rejected] = await Promise.all([
        adminAPI.getPendingRequests(),
        adminAPI.getRejectedRequests()
      ]);
      setPendingRequests(pending);
      setRejectedRequests(rejected);
    } catch (e) {
      console.error('Error fetching access requests:', e);
    }
  };

  const fetchPendingJobDrives = async () => {
    try {
      const drives = await adminAPI.getPendingJobDrives();
      setPendingJobDrives(drives);
    } catch (e) {
      console.error('Error fetching pending job drives:', e);
    }
  };

  const fetchAdminInterviews = async () => {
    try {
      const requests = await interviewAPI.getAdminRequests();
      setAdminInterviews(requests);
    } catch (e) {
      console.error('Error fetching admin interviews:', e);
    }
  };

  const handleApproveJobDrive = async (driveId: number) => {
    if (!driveId || actionProcessingId) return;
    setActionProcessingId(driveId);
    try {
      const res = await adminAPI.approveJobDrive(driveId);
      showToast(`✅ ${res.message}`, 'success');
      await fetchPendingJobDrives();
    } catch (e: any) {
      showToast(e.response?.data?.detail || 'Failed to approve job drive', 'error');
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleApproveRequest = async (id: number) => {
    if (actionProcessingId) return;
    setActionProcessingId(id);
    try {
      const res = await adminAPI.approveRequest(id);
      showToast(res.message || '✅ Access request approved successfully!', 'success');
      await Promise.all([fetchAccessRequests(), fetchAdminData()]);
    } catch (e) {
      showToast('Failed to approve access request', 'error');
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleRejectRequest = async (id: number) => {
    if (actionProcessingId) return;
    setActionProcessingId(id);
    try {
      const res = await adminAPI.rejectRequest(id);
      showToast(res.message || 'Account placed on hold.', 'info');
      await Promise.all([fetchAccessRequests(), fetchAdminData()]);
    } catch (e) {
      showToast('Failed to reject access request', 'error');
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleReleaseHold = async (id: number) => {
    if (actionProcessingId) return;
    setActionProcessingId(id);
    try {
      const res = await adminAPI.releaseHold(id);
      showToast(res.message || 'Hold released successfully.', 'success');
      await Promise.all([fetchAccessRequests(), fetchAdminData()]);
    } catch (e) {
      showToast('Failed to release hold', 'error');
    } finally {
      setActionProcessingId(null);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [stuData, anaData] = await Promise.all([
        adminAPI.getStudents(),
        adminAPI.getAnalytics()
      ]);
      setStudents(stuData);
      setAnalytics(anaData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('email', newStudent.email);
      formData.append('full_name', newStudent.full_name);
      formData.append('usn', newStudent.usn);
      formData.append('branch', newStudent.branch);
      formData.append('cgpa', newStudent.cgpa.toString());

      await adminAPI.createStudent(formData);
      setShowCreateModal(false);
      setNewStudent({ email: '', full_name: '', usn: '', branch: 'Computer Science & Engineering', cgpa: 0 });
      fetchAdminData();
    } catch (err) {
      alert('Failed to create student');
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const data = await adminAPI.generateDriveReport();
      setDriveReport(data.report);
    } catch (err) {
      alert('Failed to generate drive report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleViewCandidateReport = async (studentId: number) => {
    setLoadingReportId(studentId);
    try {
      const res = await adminAPI.getCandidate360Breakdown(studentId);
      setSelectedCandidateReport(res);
    } catch (err) {
      alert('Failed to fetch candidate 360 AI report');
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleExportCSV = async () => {
    setExportingCsv(true);
    try {
      const res = await adminAPI.exportStudentsCSV();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CampusQuant_Student_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to export student directory CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.usn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.branch?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const studentPending = pendingRequests.filter(r => r.role === 'student');
  const recruiterPending = pendingRequests.filter(r => r.role === 'recruiter');
  const studentRejected = rejectedRequests.filter(r => r.role === 'student');
  const recruiterRejected = rejectedRequests.filter(r => r.role === 'recruiter');

  const COLORS = ['#F06529', '#2563EB', '#7E22CE'];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-[#F06529] animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-[#5A6578]">Loading Institutional Placement Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner Header */}
      <div className="rounded-3xl p-7 bg-gradient-to-r from-[#1C2333] via-[#2A344A] to-[#F06529] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F06529] text-white flex items-center justify-center border border-white/20 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="sarvam-badge bg-white/20 text-white text-xs">Placement Office Console</span>
              <span className="sarvam-badge bg-[#F06529] text-white text-xs">Batch Analytics</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Institutional Placement Intelligence</h1>
            <p className="text-xs text-white/80 mt-0.5">Centralized Student Progress Tracking, Drive Readiness & Recruiter Coordination</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 btn-sarvam-saffron text-xs flex items-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all select-none"
          >
            <PlusCircle className="w-4 h-4" /> Add Student
          </button>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="px-4 py-2.5 btn-sarvam-navy text-xs flex items-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all select-none disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-[#F06529]" /> 
            {generatingReport ? 'Generating Report...' : '1-Click AI Drive Report'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Sidebar Navigation + Central Management Area */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="col-span-12 lg:col-span-3 space-y-2">
          <div className="sarvam-card p-4 space-y-1.5 bg-white border border-[#D6E4FF] shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A6578] px-3 mb-2">Management Features</p>

            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer active:scale-95 select-none ${
                activeTab === 'overview'
                  ? 'bg-[#F06529] text-white shadow-md'
                  : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" /> Batch Dashboard & Analytics
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('live_feed');
                fetchLivePlacementFeed();
              }}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer active:scale-95 select-none ${
                activeTab === 'live_feed'
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#2563EB]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4" /> Live Placement Activity & Status Feed
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'live_feed' ? 'bg-white text-[#2563EB]' : 'bg-[#EEF4FF] text-[#2563EB]'
              }`}>
                {liveFeed.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('live_interviews')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer active:scale-95 select-none ${
                activeTab === 'live_interviews'
                  ? 'bg-[#F06529] text-white shadow-md'
                  : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Video className="w-4 h-4" /> Live Interviews (Observer Mode)
              </span>
              {adminInterviews.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'live_interviews' ? 'bg-white text-[#F06529]' : 'bg-[#EEF4FF] text-[#2563EB]'
                }`}>
                  {adminInterviews.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('student_requests')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer active:scale-95 select-none ${
                activeTab === 'student_requests'
                  ? 'bg-[#F06529] text-white shadow-md'
                  : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4" /> Student Access Requests
              </span>
              {(studentPending.length > 0 || studentRejected.length > 0) && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'student_requests' ? 'bg-white text-[#F06529]' : 'bg-[#FFF0E8] text-[#F06529]'
                }`}>
                  {studentPending.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recruiter_requests')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer active:scale-95 select-none ${
                activeTab === 'recruiter_requests'
                  ? 'bg-[#F06529] text-white shadow-md'
                  : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4" /> Recruiter Access Requests
              </span>
              {(recruiterPending.length > 0 || recruiterRejected.length > 0) && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'recruiter_requests' ? 'bg-white text-[#F06529]' : 'bg-[#FFF0E8] text-[#F06529]'
                }`}>
                  {recruiterPending.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('drive_requests')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer active:scale-95 select-none ${
                activeTab === 'drive_requests'
                  ? 'bg-[#F06529] text-white shadow-md'
                  : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4" /> Campus Drive Posting Requests
              </span>
              {pendingJobDrives.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'drive_requests' ? 'bg-white text-[#F06529]' : 'bg-[#FFF0E8] text-[#F06529]'
                }`}>
                  {pendingJobDrives.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ongoing_drives');
                fetchActiveJobDrives();
              }}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer active:scale-95 select-none ${
                activeTab === 'ongoing_drives'
                  ? 'bg-[#F06529] text-white shadow-md'
                  : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4" /> Active & Ongoing Drives
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'ongoing_drives' ? 'bg-white text-[#F06529]' : 'bg-[#EEF4FF] text-[#2563EB]'
              }`}>
                {activeJobDrives.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('students_dir')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer active:scale-95 select-none ${
                activeTab === 'students_dir'
                  ? 'bg-[#F06529] text-white shadow-md'
                  : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4" /> Student Talent Directory
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'students_dir' ? 'bg-white text-[#F06529]' : 'bg-stone-100 text-stone-600'
              }`}>
                {students.length}
              </span>
            </button>
          </div>
        </div>

        {/* CENTRAL DISPLAY AREA */}
        <div className="col-span-12 lg:col-span-9 space-y-6">

          {/* TAB: BATCH DASHBOARD & ANALYTICS OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sarvam-card p-4 bg-white border border-[#D6E4FF]">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-[#5A6578]">Registered Students</p>
                    <div className="w-8 h-8 rounded-xl bg-[#FFF0E8] text-[#F06529] flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-[#1C2333] mt-2">{analytics?.total_students || 0}</h3>
                  <p className="text-[10px] text-[#5A6578] mt-0.5">CMRIT Placement Pool</p>
                </div>

                <div className="sarvam-card p-4 bg-white border border-[#D6E4FF]">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-[#5A6578]">Avg Batch Readiness</p>
                    <div className="w-8 h-8 rounded-xl bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-[#2563EB] mt-2">{analytics?.avg_placement_prob || 0}%</h3>
                  <p className="text-[10px] text-[#5A6578] mt-0.5">ML Evaluated Probability</p>
                </div>

                <div className="sarvam-card p-4 bg-white border border-[#D6E4FF]">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-[#5A6578]">Resumes Verified</p>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7E22CE] flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-[#7E22CE] mt-2">
                    {students.filter(s => s.has_resume).length} / {students.length}
                  </h3>
                  <p className="text-[10px] text-[#5A6578] mt-0.5">Parsed & Structured</p>
                </div>

                <div className="sarvam-card p-4 bg-white border border-[#D6E4FF]">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-[#5A6578]">High Tier (≥70%)</p>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-emerald-600 mt-2">
                    {analytics?.tier_counts?.High || 0}
                  </h3>
                  <p className="text-[10px] text-[#5A6578] mt-0.5">Drive-Ready Candidates</p>
                </div>
              </div>

              {/* ANALYTICS CHARTS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Placement Readiness Tier Distribution (Pie Chart) */}
                <div className="sarvam-card p-6 bg-white border border-[#D6E4FF] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#D6E4FF] pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#1C2333]">Placement Readiness Distribution</h4>
                      <p className="text-[11px] text-[#5A6578]">Student Batch ML Preparedness Tiers</p>
                    </div>
                    <span className="sarvam-badge sarvam-badge-saffron text-[10px]">Tier Spread</span>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'High Tier (≥70%)', value: analytics?.tier_counts?.High ?? analytics?.high_tier_count ?? 0 },
                            { name: 'Medium Tier (40-69%)', value: analytics?.tier_counts?.Medium ?? analytics?.mod_tier_count ?? 0 },
                            { name: 'Needs Training (<40%)', value: analytics?.tier_counts?.Low ?? analytics?.low_tier_count ?? 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell key="high" fill="#F06529" />
                          <Cell key="med" fill="#2563EB" />
                          <Cell key="low" fill="#7E22CE" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#D6E4FF] text-center">
                    <div className="p-2 bg-[#FFF0E8] rounded-xl border border-[#FFE0CF]">
                      <p className="text-[10px] font-bold text-[#F06529]">High (≥70%)</p>
                      <p className="text-sm font-black text-[#1C2333]">{analytics?.tier_counts?.High ?? analytics?.high_tier_count ?? 0}</p>
                    </div>
                    <div className="p-2 bg-[#EEF4FF] rounded-xl border border-[#D6E4FF]">
                      <p className="text-[10px] font-bold text-[#2563EB]">Medium (40-69%)</p>
                      <p className="text-sm font-black text-[#1C2333]">{analytics?.tier_counts?.Medium ?? analytics?.mod_tier_count ?? 0}</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-xl border border-purple-200">
                      <p className="text-[10px] font-bold text-[#7E22CE]">Training (&lt;40%)</p>
                      <p className="text-sm font-black text-[#1C2333]">{analytics?.tier_counts?.Low ?? analytics?.low_tier_count ?? 0}</p>
                    </div>
                  </div>
                </div>

                {/* Department Performance Breakdown (Bar Chart) */}
                <div className="sarvam-card p-6 bg-white border border-[#D6E4FF] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#D6E4FF] pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#1C2333]">Department Performance Breakdown</h4>
                      <p className="text-[11px] text-[#5A6578]">Average Placement Probability by Branch</p>
                    </div>
                    <span className="sarvam-badge sarvam-badge-blue text-[10px]">Branch Analytics</span>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={
                        analytics?.branch_readiness && Object.keys(analytics.branch_readiness).length > 0
                          ? Object.entries(analytics.branch_readiness).map(([branch, avg]) => ({
                              branch: branch
                                .replace('Computer Science & Engineering', 'CSE')
                                .replace('Information Science & Engineering', 'ISE')
                                .replace('Artificial Intelligence & Data Science', 'AI & DS')
                                .replace('Electronics & Communication Engineering', 'ECE')
                                .replace('Electronics & Communication', 'ECE')
                                .replace('Mechanical Engineering', 'MECH')
                                .replace('Civil Engineering', 'CIVIL'),
                              avg_prob: Math.round(Number(avg) || 0)
                            }))
                          : []
                      }>
                        <XAxis dataKey="branch" tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="avg_prob" fill="#2563EB" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#D6E4FF] text-[11px] text-[#5A6578] font-bold text-center">
                    💡 ML Model Readiness Evaluation across CMRIT Engineering Branches
                  </div>
                </div>

              </div>

              {/* 1-Click Generated Executive AI Report Container */}
              {driveReport && (
                <div className="sarvam-card p-6 bg-white space-y-3">
                  <h4 className="font-extrabold text-[#1C2333] text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F06529]" /> Executive AI Placement Intelligence Report
                  </h4>
                  <div className="p-4 bg-[#F8FAFC] border border-[#D6E4FF] rounded-2xl">
                    <FormattedMarkdown content={driveReport} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: LIVE INTERVIEWS (OBSERVER MODE FOR ADMIN) */}
          {activeTab === 'live_interviews' && (
            <div className="sarvam-card p-6 bg-white space-y-5">
              <div className="border-b border-[#D6E4FF] pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="sarvam-badge bg-[#2563EB] text-white text-[10px]">Placement Officer Control</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#1C2333] flex items-center gap-2">
                    <Video className="w-5 h-5 text-[#2563EB]" /> Live & Scheduled Interviews (Observer Mode)
                  </h3>
                  <p className="text-xs text-[#5A6578]">Placement Officers can join live interview rooms as observers to monitor candidate performance in real-time.</p>
                </div>
                <button
                  onClick={fetchAdminInterviews}
                  className="px-3.5 py-2 bg-[#EEF4FF] text-[#2563EB] rounded-xl text-xs font-bold hover:bg-[#2563EB] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh List
                </button>
              </div>

              {adminInterviews.length > 0 ? (
                <div className="space-y-4">
                  {adminInterviews.map((req) => (
                    <div key={req.id} className="p-5 bg-[#F8FAFC] border border-[#D6E4FF] rounded-2xl space-y-3 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#F06529]">{req.usn}</span>
                            <span className="sarvam-badge sarvam-badge-blue text-[10px]">{req.company_name}</span>
                            <span className={`sarvam-badge text-[10px] ${
                              req.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                              req.status === 'Declined' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              Status: {req.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-[#1C2333] mt-1">
                            Candidate: {req.student_name} • Role: {req.job_title}
                          </h4>
                          <p className="text-xs text-[#5A6578] mt-0.5">
                            Recruiter: <strong>{req.recruiter_name}</strong> • Scheduled Time: <strong className="text-[#2563EB]">{req.scheduled_at}</strong>
                          </p>
                        </div>

                        {req.status !== 'Completed' ? (
                          <button
                            onClick={() => setSelectedInterviewForRoom(req)}
                            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-extrabold shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <Video className="w-4 h-4" /> 🛡️ Join Room as Observer
                          </button>
                        ) : (
                          <span className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>✓ Interview Completed</span>
                          </span>
                        )}
                      </div>

                      {req.ai_notes && (
                        <div className="p-4 bg-white border border-[#D6E4FF] rounded-xl mt-2 space-y-1 text-xs">
                          <span className="font-extrabold text-purple-700">AI Live Summary Report:</span>
                          <FormattedMarkdown content={req.ai_notes} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-[#D6E4FF] rounded-2xl">
                  <Calendar className="w-8 h-8 text-[#5A6578] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-[#5A6578]">No live interviews currently scheduled across enterprise recruiter drives.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: STUDENT ACCESS REQUESTS */}
          {activeTab === 'student_requests' && (
            <div className="sarvam-card p-6 bg-white space-y-6">
              <div className="border-b border-[#D6E4FF] pb-4">
                <h3 className="text-lg font-extrabold text-[#1C2333]">Student Account Access Requests Console</h3>
                <p className="text-xs text-[#5A6578]">Review new student registrations, approve access, or hold accounts.</p>
              </div>

              {/* Pending Requests */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#F06529] uppercase tracking-wider">
                  Pending Approvals ({studentPending.length})
                </h4>
                {studentPending.length > 0 ? (
                  <div className="space-y-2">
                    {studentPending.map((req) => (
                      <div key={req.id} className="p-4 bg-[#FFF0E8]/40 border border-[#FFE0CF] rounded-2xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#1C2333]">{req.full_name}</span>
                            <span className="font-mono text-[11px] text-[#F06529] font-bold">{req.usn}</span>
                          </div>
                          <p className="text-[11px] text-[#5A6578]">{req.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            disabled={actionProcessingId === req.id}
                            className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-extrabold hover:bg-emerald-700 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {actionProcessingId === req.id ? '...' : '✓ Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={actionProcessingId === req.id}
                            className="px-3.5 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-extrabold hover:bg-amber-700 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {actionProcessingId === req.id ? '...' : '⏸ Hold'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-[#D6E4FF] rounded-2xl">
                    <p className="text-xs text-[#5A6578]">No pending student access requests.</p>
                  </div>
                )}
              </div>

              {/* On Hold / Rejected Requests */}
              {studentRejected.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#D6E4FF]">
                  <h4 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider">
                    Accounts On Hold ({studentRejected.length})
                  </h4>
                  <div className="space-y-2">
                    {studentRejected.map((req) => (
                      <div key={req.id} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs text-[#1C2333]">{req.full_name} ({req.usn})</p>
                          <p className="text-[11px] text-[#5A6578]">{req.email}</p>
                        </div>
                        <button
                          onClick={() => handleReleaseHold(req.id)}
                          disabled={actionProcessingId === req.id}
                          className="px-3.5 py-1.5 bg-[#2563EB] text-white rounded-xl text-xs font-extrabold hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionProcessingId === req.id ? '...' : 'Release Hold'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: RECRUITER ACCESS REQUESTS */}
          {activeTab === 'recruiter_requests' && (
            <div className="sarvam-card p-6 bg-white space-y-6">
              <div className="border-b border-[#D6E4FF] pb-4">
                <h3 className="text-lg font-extrabold text-[#1C2333]">Recruiter & Enterprise Partner Verification Console</h3>
                <p className="text-xs text-[#5A6578]">Verify company credentials before granting recruiter access to college student profiles.</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#F06529] uppercase tracking-wider">
                  Pending Recruiter Verification ({recruiterPending.length})
                </h4>
                {recruiterPending.length > 0 ? (
                  <div className="space-y-2">
                    {recruiterPending.map((req) => (
                      <div key={req.id} className="p-4 bg-[#EEF4FF]/60 border border-[#D6E4FF] rounded-2xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#1C2333]">{req.full_name}</span>
                            <span className="sarvam-badge sarvam-badge-blue text-[10px]">{req.company_name}</span>
                          </div>
                          <p className="text-[11px] text-[#5A6578]">{req.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            disabled={actionProcessingId === req.id}
                            className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-extrabold hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {actionProcessingId === req.id ? '...' : '✓ Verify Recruiter'}
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={actionProcessingId === req.id}
                            className="px-3.5 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-extrabold hover:bg-amber-700 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {actionProcessingId === req.id ? '...' : 'Hold'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-[#D6E4FF] rounded-2xl">
                    <p className="text-xs text-[#5A6578]">No pending recruiter verification requests.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CAMPUS DRIVE POSTING REQUESTS */}
          {activeTab === 'drive_requests' && (
            <div className="sarvam-card p-6 bg-white space-y-6">
              <div className="border-b border-[#D6E4FF] pb-4">
                <h3 className="text-lg font-extrabold text-[#1C2333]">Campus Placement Drive Verification Queue</h3>
                <p className="text-xs text-[#5A6578]">Review recruiter drive requests. Approving a drive publishes it live and emails all eligible students.</p>
              </div>

              {pendingJobDrives.length > 0 ? (
                <div className="space-y-4">
                  {pendingJobDrives.map((drive) => {
                    const targetId = drive.job_id || drive.id;
                    return (
                      <div key={targetId} className="p-5 bg-[#F8FAFC] border border-[#D6E4FF] rounded-2xl space-y-3 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D6E4FF] pb-3">
                          <div>
                            <span className="sarvam-badge sarvam-badge-saffron text-[10px]">{drive.company_name}</span>
                            <h4 className="text-base font-extrabold text-[#1C2333] mt-1">{drive.title}</h4>
                            <p className="text-xs text-[#5A6578]">CTC: <strong className="text-[#F06529]">₹{drive.ctc_lpa} LPA</strong> • Min CGPA: {drive.min_cgpa} • Max Backlogs: {drive.max_backlogs}</p>
                          </div>

                          <button
                            onClick={() => handleApproveJobDrive(targetId)}
                            disabled={actionProcessingId === targetId}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {actionProcessingId === targetId ? 'Broadcasting...' : '✓ Approve & Broadcast Drive'}
                          </button>
                        </div>

                        <p className="text-xs text-stone-700 leading-relaxed">{drive.description}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-[#D6E4FF] rounded-2xl">
                  <Briefcase className="w-8 h-8 text-[#5A6578] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-[#5A6578]">No pending campus drive requests requiring verification.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: ACTIVE & ONGOING CAMPUS DRIVES TRACKER */}
          {activeTab === 'ongoing_drives' && (
            <div className="sarvam-card p-6 bg-white space-y-6">
              <div className="border-b border-[#D6E4FF] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="sarvam-badge bg-[#10B981] text-white text-[10px]">🟢 Live Drive Intelligence</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#1C2333]">Institutional Active & Ongoing Campus Drives</h3>
                  <p className="text-xs text-[#5A6578]">Monitor live recruiter drives, applicant counts, shortlisted candidates, and real-time AI evaluation statuses.</p>
                </div>
                <button
                  onClick={fetchActiveJobDrives}
                  className="px-3.5 py-2 bg-[#EEF4FF] text-[#2563EB] rounded-xl text-xs font-bold hover:bg-[#2563EB] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer w-fit"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Drives
                </button>
              </div>

              {activeJobDrives.length > 0 ? (
                <div className="space-y-6">
                  {/* Drives Selection Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeJobDrives.map((drive) => {
                      const isSelected = selectedActiveDrive?.job_id === drive.job_id;
                      return (
                        <div
                          key={drive.job_id}
                          onClick={() => {
                            setSelectedActiveDrive(drive);
                            fetchDriveApplicants(drive.job_id);
                          }}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm space-y-3 ${
                            isSelected
                              ? 'bg-[#EEF4FF] border-[#2563EB] ring-2 ring-[#2563EB]/20'
                              : 'bg-[#F8FAFC] border-[#D6E4FF] hover:border-[#2563EB]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="sarvam-badge sarvam-badge-saffron text-[10px]">{drive.company_name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                🟢 Live Drive
                              </span>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await adminAPI.closeJobDrive(drive.job_id);
                                    showToast(`Drive '${drive.title}' marked as Closed!`, 'success');
                                    fetchActiveJobDrives();
                                  } catch (err) {
                                    showToast(`Failed to close drive`, 'error');
                                  }
                                }}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold rounded-full transition-all cursor-pointer shadow-sm"
                              >
                                🛑 Close Drive
                              </button>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-base font-extrabold text-[#1C2333]">{drive.title}</h4>
                            <p className="text-xs text-[#5A6578]">CTC: <strong className="text-[#F06529]">₹{drive.ctc_lpa} LPA</strong> • Min CGPA: {drive.min_cgpa}</p>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#D6E4FF]">
                            <span className="text-[#5A6578] font-bold">Applicants: <strong className="text-[#2563EB]">{drive.total_applicants}</strong></span>
                            <span className="text-[#5A6578] font-bold">Shortlisted: <strong className="text-emerald-600">{drive.shortlisted_count}</strong></span>
                            <span className="text-[#5A6578] font-bold">Offered: <strong className="text-purple-600">{drive.offered_count}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Drive Applicants Table */}
                  {selectedActiveDrive && (
                    <div className="space-y-4 pt-4 border-t border-[#D6E4FF]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#1C2333] flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#2563EB]" />
                            Drive Applicants for {selectedActiveDrive.company_name} — {selectedActiveDrive.title} ({driveApps.length})
                          </h4>
                          <p className="text-[11px] text-[#5A6578]">Real-time candidate submissions and AI fit scores for this placement drive.</p>
                        </div>
                      </div>

                      {/* Formatted Job Description Card for Admin */}
                      {selectedActiveDrive.description && (
                        <div className="p-4 bg-white border border-[#D6E4FF] rounded-2xl space-y-2 text-xs">
                          <h5 className="font-extrabold text-[#2563EB] flex items-center gap-1.5 uppercase text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-[#F06529]" /> Campus Drive Specifications & Full Job Description:
                          </h5>
                          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#D6E4FF]/60 leading-relaxed text-[#1C2333]">
                            <FormattedMarkdown content={selectedActiveDrive.description} />
                          </div>
                        </div>
                      )}

                      {loadingDriveApps ? (
                        <div className="p-8 text-center">
                          <Sparkles className="w-6 h-6 text-[#2563EB] animate-spin mx-auto mb-2" />
                          <p className="text-xs font-bold text-[#5A6578]">Fetching Drive Submissions & AI Scores...</p>
                        </div>
                      ) : driveApps.length > 0 ? (
                        <div className="overflow-x-auto rounded-2xl border border-[#D6E4FF]">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#F4F7FC] text-[#5A6578] font-bold uppercase tracking-wider text-[10px] border-b border-[#D6E4FF]">
                              <tr>
                                <th className="p-3.5">Student Candidate</th>
                                <th className="p-3.5">USN / BRANCH</th>
                                <th className="p-3.5 text-center">CGPA</th>
                                <th className="p-3.5 text-center">AI JOB FIT %</th>
                                <th className="p-3.5 text-center">STATUS</th>
                                <th className="p-3.5 text-right">ACTION</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D6E4FF]">
                              {driveApps.map((app) => (
                                <tr key={app.application_id} className="hover:bg-[#F8FAFC]">
                                  <td className="p-3.5 font-bold text-[#1C2333]">
                                    {app.full_name}
                                    <p className="text-[10px] font-normal text-[#5A6578]">{app.email}</p>
                                  </td>
                                  <td className="p-3.5">
                                    <span className="font-mono text-xs font-bold text-[#F06529]">{app.usn}</span>
                                    <p className="text-[10px] text-[#5A6578]">{app.branch}</p>
                                  </td>
                                  <td className="p-3.5 text-center font-bold text-[#1C2333]">{app.cgpa}</td>
                                  <td className="p-3.5 text-center font-bold">
                                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                                      {app.ai_fit_score}% Fit
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                      app.status === 'Offered' ? 'bg-purple-100 text-purple-700' :
                                      ['Shortlisted', 'Interviewing'].includes(app.status) ? 'bg-emerald-100 text-emerald-700' :
                                      'bg-[#EEF4FF] text-[#2563EB]'
                                    }`}>
                                      {app.status}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-right">
                                    {app.profile_id && (
                                      <button
                                        onClick={() => handleViewCandidateReport(app.profile_id)}
                                        className="px-3 py-1.5 bg-[#1C2333] text-white rounded-xl text-[11px] font-extrabold hover:bg-black transition-all cursor-pointer"
                                      >
                                        360° AI Report
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center border-2 border-dashed border-[#D6E4FF] rounded-2xl">
                          <p className="text-xs text-[#5A6578]">No student applications submitted yet for this active drive.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-[#D6E4FF] rounded-2xl space-y-2">
                  <Briefcase className="w-8 h-8 text-[#5A6578] mx-auto opacity-50" />
                  <p className="text-xs font-bold text-[#5A6578]">No active ongoing campus drives.</p>
                  <p className="text-[11px] text-[#5A6578]">Approve pending drive postings to activate live recruiter drives.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: STUDENT TALENT DIRECTORY */}
          {activeTab === 'students_dir' && (
            <div className="sarvam-card p-6 bg-white space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D6E4FF] pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#1C2333]">Student Talent Directory ({students.length})</h3>
                  <p className="text-xs text-[#5A6578]">Detailed list of all registered candidates, USN records, and mock score breakdowns.</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  disabled={exportingCsv}
                  className="px-4 py-2.5 bg-[#EEF4FF] hover:bg-[#2563EB] hover:text-white text-[#2563EB] border border-[#2563EB]/30 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 rotate-180" /> {exportingCsv ? 'Exporting...' : '📥 Export Directory (CSV)'}
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search students by full name, USN, or branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                />
              </div>

              {/* Compact Responsive Directory Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#D6E4FF]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EEF4FF] text-[#1C2333] font-black uppercase text-[10px] tracking-wider border-b border-[#D6E4FF]">
                    <tr>
                      <th className="py-3 px-3.5">Student Name</th>
                      <th className="py-3 px-3">USN / Branch</th>
                      <th className="py-3 px-3">CGPA</th>
                      <th className="py-3 px-3">Backlogs</th>
                      <th className="py-3 px-3">Resume</th>
                      <th className="py-3 px-3">Mock Score</th>
                      <th className="py-3 px-3">ML Readiness</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBF2FF]">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((s) => (
                        <tr key={s.profile_id} className="hover:bg-[#F8FAFC]">
                          <td className="py-3 px-3.5 font-bold text-[#1C2333]">
                            {s.full_name}
                            <div className="text-[10px] font-normal text-[#5A6578] truncate max-w-[140px]">{s.email}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[#F06529] font-bold text-[11px] block">{s.usn}</span>
                            <span className="text-[10px] text-stone-500 truncate block max-w-[130px]">{s.branch}</span>
                          </td>
                          <td className="py-3 px-3 font-extrabold text-[#1C2333]">
                            {s.cgpa && s.cgpa > 0 ? s.cgpa : 'N/A'}
                          </td>
                          <td className="py-3 px-3">
                            {s.backlogs > 0 ? (
                              <span className="text-rose-600 font-bold text-[11px]">{s.backlogs}</span>
                            ) : (
                              <span className="text-emerald-600 font-bold text-[11px]">0</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {s.has_resume ? (
                              <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">✓ Verified</span>
                            ) : (
                              <span className="text-amber-700 font-bold text-[10px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Missing</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`font-extrabold text-xs ${
                              (s.mock_interview_score !== null && s.mock_interview_score !== undefined && s.mock_interview_score !== 'Not Attempted')
                                ? 'text-[#F06529]'
                                : 'text-stone-400 font-normal italic'
                            }`}>
                              {(s.mock_interview_score !== null && s.mock_interview_score !== undefined && s.mock_interview_score !== 'Not Attempted')
                                ? `${s.mock_interview_score}/100 ${s.mock_interview_exited_mid ? '⚠️' : ''}`
                                : 'Not Attempted'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-extrabold text-[#2563EB]">
                            {Math.round(s.placement_prob)}%
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleViewCandidateReport(s.profile_id)}
                                disabled={loadingReportId === s.profile_id}
                                className="px-2.5 py-1 bg-[#F06529] hover:bg-[#D9531E] text-white rounded-xl text-[10px] font-extrabold transition-all shadow-sm cursor-pointer"
                              >
                                {loadingReportId === s.profile_id ? '...' : 'AI Report'}
                              </button>

                              <button
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete student '${s.full_name}' (${s.usn})? This action cannot be undone.`)) {
                                    try {
                                      await adminAPI.deleteStudent(s.user_id);
                                      showToast(`Student '${s.full_name}' deleted successfully!`, 'success');
                                      fetchAdminData();
                                    } catch (err) {
                                      showToast(`Failed to delete student`, 'error');
                                    }
                                  }
                                }}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-extrabold transition-all shadow-sm cursor-pointer"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs font-semibold text-[#5A6578]">
                          No students matching query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: LIVE PLACEMENT ACTIVITY & STATUS FEED */}
          {activeTab === 'live_feed' && (
            <div className="sarvam-card p-6 space-y-4 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D6E4FF] pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#1C2333] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#2563EB]" /> Live Placement Activity & Application Status Feed
                  </h3>
                  <p className="text-xs text-[#5A6578]">Real-time tracking feed of candidate status changes, interview calls, and recruiter decisions.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchLivePlacementFeed}
                  disabled={loadingFeed}
                  className="px-4 py-2 bg-[#EEF4FF] hover:bg-[#2563EB] hover:text-white text-[#2563EB] rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingFeed ? 'animate-spin' : ''}`} />
                  <span>{loadingFeed ? 'Syncing...' : 'Refresh Activity Feed'}</span>
                </button>
              </div>

              {liveFeed.length > 0 ? (
                <div className="space-y-2.5">
                  {liveFeed.map((item) => {
                    let statusBadgeClass = "bg-stone-100 text-stone-700 border-stone-200";
                    if (item.status === "Shortlisted") statusBadgeClass = "bg-blue-100 text-blue-800 border-blue-200";
                    else if (item.status === "Interviewing") statusBadgeClass = "bg-amber-100 text-amber-800 border-amber-200";
                    else if (["Selected", "Offered", "Accepted"].includes(item.status)) statusBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
                    else if (["Rejected", "Declined"].includes(item.status)) statusBadgeClass = "bg-rose-100 text-rose-800 border-rose-200";

                    return (
                      <div key={item.id} className="p-4 bg-[#F8FAFC] border border-[#D6E4FF] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-[#2563EB] transition-all">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center font-extrabold text-sm shrink-0">
                            {item.event_type === 'Interview Action' ? '🎥' : '📄'}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-[#1C2333]">{item.student_name}</span>
                              <span className="text-[10px] font-mono text-[#F06529] font-bold">({item.usn})</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#5A6578]">
                              Company: <strong>{item.company_name}</strong> • Role: <strong>{item.job_title}</strong>
                            </p>
                            <p className="text-[11px] text-stone-600 font-medium">{item.details}</p>
                          </div>
                        </div>
                        <div className="text-right text-[10px] font-mono font-bold text-[#5A6578] shrink-0">
                          {item.timestamp}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#F8FAFC] rounded-2xl border border-dashed border-[#D6E4FF] text-stone-500 text-xs">
                  No live placement activity recorded yet.
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* CREATE STUDENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sarvam-card max-w-md w-full p-6 space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-[#D6E4FF] pb-3">
              <h3 className="text-base font-extrabold text-[#1C2333]">Add New Student Record</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1C2333] mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vashista"
                  value={newStudent.full_name}
                  onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2333] mb-1">USN (Unique Student Number) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1CR23CD001"
                  value={newStudent.usn}
                  onChange={(e) => setNewStudent({ ...newStudent, usn: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#F4F7FC] border border-[#D6E4FF] rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2333] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="vasi@gmail.com"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2333] mb-1">Department / Branch</label>
                <select
                  value={newStudent.branch}
                  onChange={(e) => setNewStudent({ ...newStudent, branch: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold bg-[#F4F7FC] border border-[#D6E4FF] rounded-xl focus:outline-none cursor-pointer"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Science & Engineering">Information Science & Engineering</option>
                  <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2333] mb-1">Initial CGPA</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 8.5"
                  value={newStudent.cgpa}
                  onChange={(e) => setNewStudent({ ...newStudent, cgpa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 btn-sarvam-saffron text-xs font-extrabold shadow-md cursor-pointer active:scale-95 transition-all select-none disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360 AI Candidate Evaluation Modal */}
      {selectedCandidateReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="sarvam-card max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 bg-white rounded-3xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#D6E4FF] pb-4">
              <div>
                <span className="sarvam-badge sarvam-badge-saffron text-[10px] mb-1">Central Intelligence Assessment</span>
                <h3 className="text-base font-extrabold text-[#1C2333]">
                  Candidate AI Evaluation Report: {selectedCandidateReport.candidate?.full_name} ({selectedCandidateReport.candidate?.usn})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidateReport(null)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer active:scale-95 transition-all select-none"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#EEF4FF]/50 p-4 rounded-2xl border border-[#D6E4FF]">
              <div>
                <p className="text-[10px] text-[#5A6578] uppercase font-bold">Branch</p>
                <p className="text-xs font-black text-[#1C2333]">{selectedCandidateReport.candidate?.branch}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#5A6578] uppercase font-bold">CGPA</p>
                <p className="text-xs font-black text-[#2563EB]">
                  {selectedCandidateReport.candidate?.cgpa && selectedCandidateReport.candidate.cgpa > 0 ? selectedCandidateReport.candidate.cgpa : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#5A6578] uppercase font-bold">Mock Interview</p>
                <p className="text-xs font-black text-[#F06529]">
                  {selectedCandidateReport.candidate?.mock_interview_score && typeof selectedCandidateReport.candidate.mock_interview_score === 'number'
                    ? `${selectedCandidateReport.candidate.mock_interview_score}/100`
                    : 'Not Attempted'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#5A6578] uppercase font-bold">ML Placement Prob</p>
                <p className="text-xs font-black text-[#7E22CE]">{selectedCandidateReport.candidate?.placement_prob}%</p>
              </div>
            </div>

            <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-stone-200">
              <FormattedMarkdown content={selectedCandidateReport.evaluation_report} />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCandidateReport(null)}
                className="px-5 py-2.5 btn-sarvam-saffron text-xs font-extrabold cursor-pointer active:scale-95 transition-all select-none"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE INTERVIEW ROOM MODAL FOR OBSERVER */}
      {selectedInterviewForRoom && (
        <LiveInterviewRoom
          interviewData={selectedInterviewForRoom}
          userRole="admin"
          userName="Placement Officer"
          onClose={() => setSelectedInterviewForRoom(null)}
        />
      )}

      {/* SLEEK IN-APP TOAST NOTIFICATION BANNER */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
};
