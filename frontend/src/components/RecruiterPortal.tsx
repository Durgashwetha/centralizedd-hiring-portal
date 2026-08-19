import React, { useState, useEffect } from 'react';
import { recruiterAPI, studentAPI, interviewAPI } from '../api';
import { getInterviewMeetingState } from '../utils/usnHelper';
import { FormattedMarkdown } from './FormattedMarkdown';
import { LiveInterviewRoom } from './LiveInterviewRoom';
import { 
  Briefcase, Sparkles, PlusCircle, Users, Award, FileText, CheckCircle2, 
  HelpCircle, ChevronRight, AlertTriangle, FileEdit, Search, Download,
  Building, Check, X, ExternalLink, ShieldCheck, Mail, GraduationCap,
  Layers, CheckSquare, Send, Scale, ArrowRight, Zap, Target, Calendar, Video, Clock, Maximize2
} from 'lucide-react';

import { Toast } from './Toast';

interface StandardPdfResumeViewerProps {
  candidateName: string;
  usn: string;
  email: string;
  resumeText: string;
  resumePdf?: string;
}

export const StandardPdfResumeViewer: React.FC<StandardPdfResumeViewerProps> = ({
  candidateName,
  usn,
  email,
  resumeText,
  resumePdf
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const fileName = `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`;

  const handleDownloadPdf = () => {
    if (resumePdf && resumePdf.startsWith('data:application/pdf')) {
      const link = document.createElement('a');
      link.href = resumePdf;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${fileName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            h1 { font-size: 24px; margin-bottom: 4px; color: #000; text-transform: uppercase; }
            .contact { font-size: 12px; color: #444; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .content { font-size: 12px; white-space: pre-wrap; font-family: inherit; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${candidateName}</h1>
          <div class="contact">USN: ${usn} | Email: ${email}</div>
          <div class="content">${resumeText}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (resumePdf && (resumePdf.startsWith('data:application/pdf') || resumePdf.endsWith('.pdf'))) {
    return (
      <div className="w-full rounded-2xl border border-[#D6E4FF] overflow-hidden bg-white shadow-md">
        <iframe
          src={resumePdf}
          className="w-full h-[620px] bg-white border-0"
          title={`${candidateName} Uploaded PDF Resume`}
        />
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-stone-300 overflow-hidden shadow-lg bg-[#525659] transition-all ${isFullscreen ? 'fixed inset-4 z-[100] bg-[#323639] flex flex-col p-2' : ''}`}>
      {/* STANDARD PDF READER TOOLBAR */}
      <div className="bg-[#323639] text-stone-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-700 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-[10px] shadow-sm">
            PDF
          </div>
          <div>
            <h5 className="text-xs font-bold text-white tracking-wide">{fileName}</h5>
            <span className="text-[10px] text-stone-400">Parsed Applicant PDF Document</span>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-stone-800 rounded-md text-[11px] font-mono text-stone-300 border border-stone-700">
            Page 1 / 1
          </span>

          <div className="flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700">
            <button
              onClick={() => setZoomLevel(Math.max(75, zoomLevel - 15))}
              className="px-2 py-0.5 hover:bg-stone-700 rounded text-stone-300 hover:text-white font-extrabold cursor-pointer"
              title="Zoom Out"
            >
              -
            </button>
            <span className="px-2 text-[10px] font-bold font-mono text-stone-200">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))}
              className="px-2 py-0.5 hover:bg-stone-700 rounded text-stone-300 hover:text-white font-extrabold cursor-pointer"
              title="Zoom In"
            >
              +
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="px-3 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Save / Print PDF
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg transition-all border border-stone-700 cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen PDF" : "Fullscreen PDF Reader"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* PDF DOCUMENT CANVAS AREA */}
      <div className={`p-4 overflow-y-auto flex justify-center bg-[#525659] custom-scrollbar ${isFullscreen ? 'flex-1' : 'max-h-[550px]'}`}>
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="bg-white text-stone-900 shadow-2xl rounded-sm p-8 sm:p-10 w-full max-w-[680px] min-h-[700px] border border-stone-300 font-sans text-xs space-y-4 leading-relaxed relative transition-transform"
        >
          {/* WATERMARK BADGE */}
          <div className="absolute top-4 right-4 opacity-20 pointer-events-none flex items-center gap-1 text-[10px] font-black tracking-widest uppercase">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" /> VERIFIED CAMPUS QUANT PDF
          </div>

          {/* RESUME DOCUMENT HEADER */}
          <div className="border-b-2 border-stone-900 pb-3 space-y-1">
            <h1 className="text-xl font-extrabold text-stone-900 tracking-tight uppercase">{candidateName}</h1>
            <p className="text-[11px] font-medium text-stone-700">
              USN: <span className="font-mono font-bold text-stone-900">{usn}</span> • Email: <a href={`mailto:${email}`} className="text-[#2563EB] hover:underline">{email}</a>
            </p>
          </div>

          {/* RESUME BODY CONTENT */}
          <div className="text-stone-800 text-[11.5px] leading-relaxed whitespace-pre-wrap font-sans space-y-3">
            {resumeText}
          </div>

          {/* PDF FOOTER PAGE STAMP */}
          <div className="border-t border-stone-200 pt-4 flex justify-between items-center text-[9px] text-stone-400 font-mono mt-8">
            <span>Official Applicant Verified PDF Document</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RecruiterPortalProps {
  user: any;
}

export const RecruiterPortal: React.FC<RecruiterPortalProps> = ({ user }) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };
  const [activeTab, setActiveTab] = useState<'drives_apps' | 'post_drive' | 'students_dir' | 'ai_tools' | 'ai_compare' | 'interviews'>('drives_apps');
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [interviewRequests, setInterviewRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State for Student Talent Directory
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');

  // Bulk Candidate Operations State
  const [selectedAppIds, setSelectedAppIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('Shortlisted');
  const [sendInterviewEmail, setSendInterviewEmail] = useState<boolean>(true);
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string>('');

  // AI Head-to-Head Candidate Comparison State
  const [compareCandA, setCompareCandA] = useState<number | null>(null);
  const [compareCandB, setCompareCandB] = useState<number | null>(null);
  const [comparisonReport, setComparisonReport] = useState<string>('');
  const [comparing, setComparing] = useState<boolean>(false);

  // Direct Interview Scheduling Modal State
  const [scheduleModalStudent, setScheduleModalStudent] = useState<any | null>(null);
  const [scheduleJobId, setScheduleJobId] = useState<number | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [scheduleNotes, setScheduleNotes] = useState<string>('');
  const [scheduling, setScheduling] = useState<boolean>(false);
  const [selectedInterviewForRoom, setSelectedInterviewForRoom] = useState<any | null>(null);
  const [selectedFullProfileCandidate, setSelectedFullProfileCandidate] = useState<any | null>(null);

  // New Job Drive Form State
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    location: 'Bangalore',
    ctc_lpa: 14.0,
    min_cgpa: 7.5,
    max_backlogs: 0,
    required_skills: 'Python, Data Structures, System Design',
  });
  const [posting, setPosting] = useState(false);
  const [postSuccessMsg, setPostSuccessMsg] = useState('');

  // AI Question Generator State
  const [aiQuestions, setAiQuestions] = useState('');
  const [generatingQ, setGeneratingQ] = useState(false);

  // Structured Notes Generator State
  const [noteCandidateName, setNoteCandidateName] = useState('');
  const [rawNotesInput, setRawNotesInput] = useState('');
  const [structuredScorecard, setStructuredScorecard] = useState('');
  const [structuringNotes, setStructuringNotes] = useState(false);

  // Candidate AI Breakdown Report Modal State
  const [selectedCandidateReport, setSelectedCandidateReport] = useState<any>(null);
  const [loadingReportId, setLoadingReportId] = useState<number | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [drivesData, studentsData, interviewsData] = await Promise.all([
        recruiterAPI.getMyPostedJobs().catch(() => []),
        recruiterAPI.getStudents().catch(() => []),
        recruiterAPI.getRecruiterInterviewRequests().catch(() => [])
      ]);

      // Strict Recruiter Drive Isolation (Only show drives posted by this recruiter user or company)
      const myOwnDrives = (drivesData || []).filter((j: any) => 
        j.recruiter_id === user.id || 
        j.recruiter_name === user.full_name ||
        (user.company_name && j.company_name?.toLowerCase().trim() === user.company_name?.toLowerCase().trim())
      );

      setJobs(myOwnDrives);
      setStudents(studentsData);
      setInterviewRequests(interviewsData);
      if (myOwnDrives.length > 0) {
        setSelectedJob(myOwnDrives[0]);
        fetchJobApps(myOwnDrives[0].job_id || myOwnDrives[0].id);
      }
    } catch (err) {
      console.error('Error fetching initial recruiter data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobApps = async (jobId: number) => {
    setSelectedAppIds([]);
    setBulkSuccessMsg('');
    try {
      const apps = await recruiterAPI.getApplications(jobId);
      setApplications(apps);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const fetchInterviewRequests = async () => {
    try {
      const res = await recruiterAPI.getRecruiterInterviewRequests();
      setInterviewRequests(res);
    } catch (err) {
      console.error('Error fetching recruiter interview requests:', err);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setPostSuccessMsg('');
    try {
      await recruiterAPI.postJob(newJob);
      setPostSuccessMsg(`✅ Campus Placement Drive Request Submitted! Your drive posting for '${newJob.title}' has been sent to the Placement Officer for verification. Upon approval, it will be broadcasted live to all student portals.`);
      setNewJob({
        title: '',
        description: '',
        location: 'Bangalore',
        ctc_lpa: 14.0,
        min_cgpa: 7.5,
        max_backlogs: 0,
        required_skills: 'Python, Data Structures, System Design',
      });
      const updatedJobs = await studentAPI.getJobs();
      setJobs(updatedJobs);
      showToast('✅ Campus drive request submitted to CMR Placement Officer for approval!', 'success');
      setActiveTab('drives_apps');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to post campus drive request', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleUpdateStatus = async (applicationId: number, newStatus: string) => {
    try {
      await recruiterAPI.updateApplicationStatus(applicationId, newStatus);
      showToast(`Application status updated to ${newStatus}`, 'success');
      if (selectedJob) fetchJobApps(selectedJob.id);
    } catch (err) {
      showToast('Failed to update application status', 'error');
    }
  };

  const handleScheduleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalStudent) return;
    setScheduling(true);
    try {
      const studentUserId = scheduleModalStudent.user_id || scheduleModalStudent.student_id || scheduleModalStudent.profile_id;
      const targetJobId = scheduleJobId !== null ? scheduleJobId : (selectedJob?.id || undefined);
      const res = await recruiterAPI.scheduleInterview({
        student_id: studentUserId,
        job_id: targetJobId,
        scheduled_at: scheduleDateTime,
        notes: scheduleNotes
      });
      showToast(`✅ ${res.message}`, 'success');
      setScheduleModalStudent(null);
      setScheduleNotes('');
      fetchInterviewRequests();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to schedule interview request.', 'error');
    } finally {
      setScheduling(false);
    }
  };

  const handleToggleSelectAllApps = () => {
    if (selectedAppIds.length === applications.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(applications.map(a => a.application_id));
    }
  };

  const handleToggleSelectApp = (appId: number) => {
    setSelectedAppIds(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const handleBulkActionSubmit = async () => {
    if (selectedAppIds.length === 0) {
      alert('Please select at least one candidate application.');
      return;
    }
    setBulkLoading(true);
    setBulkSuccessMsg('');
    try {
      const res = await recruiterAPI.bulkUpdateStatus({
        application_ids: selectedAppIds,
        status: bulkStatus,
        send_interview_email: sendInterviewEmail,
      });
      setBulkSuccessMsg(`⚡ ${res.message}${sendInterviewEmail && ['Shortlisted', 'Interviewing'].includes(bulkStatus) ? ' Automated interview call letter emails sent via Gmail SMTP.' : ''}`);
      setSelectedAppIds([]);
      if (selectedJob) fetchJobApps(selectedJob.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to execute bulk action.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRunComparison = async () => {
    if (!compareCandA || !compareCandB) {
      alert('Please select two distinct candidates to perform head-to-head AI comparison.');
      return;
    }
    if (compareCandA === compareCandB) {
      alert('Please select two different candidates for comparative analysis.');
      return;
    }
    setComparing(true);
    setComparisonReport('');
    try {
      const res = await recruiterAPI.compareCandidates({
        student_a_id: compareCandA,
        student_b_id: compareCandB,
        job_id: selectedJob?.id
      });
      setComparisonReport(res.comparison_report);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to run AI comparison.');
    } finally {
      setComparing(false);
    }
  };

  const handleViewCandidateReport = async (studentId: number) => {
    setLoadingReportId(studentId);
    try {
      const res = await recruiterAPI.getCandidate360Breakdown(studentId);
      setSelectedCandidateReport(res);
    } catch (err) {
      alert('Failed to fetch AI candidate evaluation report');
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedJob) return;
    setGeneratingQ(true);
    try {
      const res = await recruiterAPI.generateQuestions(selectedJob.description);
      setAiQuestions(res.questions);
    } catch (err) {
      alert('Failed to generate interview questions');
    } finally {
      setGeneratingQ(false);
    }
  };

  const handleStructureNotes = async () => {
    if (!noteCandidateName.trim() || !rawNotesInput.trim() || !selectedJob) return;
    setStructuringNotes(true);
    try {
      const res = await recruiterAPI.structureNotes(noteCandidateName, selectedJob.title, rawNotesInput);
      setStructuredScorecard(res.scorecard);
    } catch (err) {
      alert('Failed to structure interview notes');
    } finally {
      setStructuringNotes(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await recruiterAPI.exportStudentsCSV();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CampusQuant_Student_Talent_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to export student directory CSV');
    }
  };

  // Filtered Student Directory
  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.usn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.skills_list?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = branchFilter === 'All' || s.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const verifiedResumesCount = students.filter(s => s.has_resume).length;
  const highTierStudentsCount = students.filter(s => s.placement_prob >= 70).length;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-[#F06529] animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold text-[#5A6578]">Loading Recruiter Placement Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* TOP HEADER BANNER */}
      <div className="rounded-3xl p-7 bg-gradient-to-r from-[#1C2333] via-[#2563EB] to-[#F06529] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F06529] text-white flex items-center justify-center border border-white/20 shadow-md">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="sarvam-badge bg-white/20 text-white text-xs">Partner Enterprise Portal</span>
              <span className="sarvam-badge bg-[#2563EB] text-white text-xs">AI Candidate Screening</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Recruiter Drive & Talent Intelligence Console</h1>
            <p className="text-xs text-white/80 mt-0.5">Post Campus Drives, Review Applicant AI Scores & Browse College Talent Pool</p>
          </div>
        </div>
      </div>

      {/* TOP ANALYTICS & METRICS DASHBOARD ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#D6E4FF] rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#5A6578]">Active Campus Drives</p>
            <h3 className="text-xl font-extrabold text-[#1C2333] mt-0.5">{jobs.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF0E8] text-[#F06529] flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#D6E4FF] rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#5A6578]">Scheduled Interviews</p>
            <h3 className="text-xl font-extrabold text-[#2563EB] mt-0.5">{interviewRequests.length} Scheduled</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#D6E4FF] rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#5A6578]">Verified Talent Pool</p>
            <h3 className="text-xl font-extrabold text-emerald-600 mt-0.5">{verifiedResumesCount} Resumes</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#D6E4FF] rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#5A6578]">Total Student Applicants</p>
            <h3 className="text-xl font-extrabold text-[#1C2333] mt-0.5">{students.length} Total</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT: LEFT NAVIGATION SIDEBAR + CENTRAL DISPLAY PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT NAVIGATION SIDEBAR */}
        <div className="lg:col-span-3 sarvam-card p-4 space-y-5 bg-white border border-[#D6E4FF] shadow-md rounded-3xl">
          <div>
            <p className="text-[10px] font-black uppercase text-[#5A6578] tracking-widest px-3 mb-2">DRIVE MANAGEMENT</p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('drives_apps')}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer select-none ${
                  activeTab === 'drives_apps'
                    ? 'bg-[#F06529] text-white shadow-md'
                    : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4" /> Campus Drives & Applicants
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'drives_apps' ? 'bg-white text-[#F06529]' : 'bg-[#FFF0E8] text-[#F06529]'
                }`}>
                  {jobs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('interviews')}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer select-none ${
                  activeTab === 'interviews'
                    ? 'bg-[#F06529] text-white shadow-md'
                    : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Video className="w-4 h-4" /> Scheduled Live Interviews
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'interviews' ? 'bg-white text-[#F06529]' : 'bg-[#EEF4FF] text-[#2563EB]'
                }`}>
                  {interviewRequests.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('post_drive')}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer select-none ${
                  activeTab === 'post_drive'
                    ? 'bg-[#F06529] text-white shadow-md'
                    : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <PlusCircle className="w-4 h-4" /> Post New Campus Drive
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('drives_apps');
                  if (jobs.length > 0 && !selectedJob) {
                    setSelectedJob(jobs[0]);
                    fetchJobApps(jobs[0].id);
                  }
                }}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer select-none ${
                  activeTab === 'drives_apps'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#2563EB]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4" /> Applications Received
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'drives_apps' ? 'bg-white text-[#2563EB]' : 'bg-[#EEF4FF] text-[#2563EB]'
                }`}>
                  {applications.length}
                </span>
              </button>
            </div>
          </div>

          <div className="border-t border-[#D6E4FF] pt-4">
            <p className="text-[10px] font-black uppercase text-[#5A6578] tracking-widest px-3 mb-2">TALENT INTELLIGENCE</p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('students_dir')}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer select-none ${
                  activeTab === 'students_dir'
                    ? 'bg-[#F06529] text-white shadow-md'
                    : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" /> Student Talent Pool
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'students_dir' ? 'bg-white text-[#F06529]' : 'bg-stone-100 text-stone-600'
                }`}>
                  {students.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ai_compare')}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer select-none ${
                  activeTab === 'ai_compare'
                    ? 'bg-[#F06529] text-white shadow-md'
                    : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Scale className="w-4 h-4" /> AI Head-to-Head Compare
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ai_tools')}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer select-none ${
                  activeTab === 'ai_tools'
                    ? 'bg-[#F06529] text-white shadow-md'
                    : 'text-[#1C2333] hover:bg-[#EEF4FF] hover:text-[#F06529]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4" /> AI Interview & Scorecard Tools
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* CENTRAL DISPLAY PANEL */}
        <div className="lg:col-span-9 space-y-6">

          {/* TAB 1: CAMPUS DRIVES & APPLICANTS VIEW */}
          {activeTab === 'drives_apps' && (
            <div className="space-y-6">
              
              {/* Job Drives Selector Cards */}
              <div className="sarvam-card p-5 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-[#D6E4FF] pb-3">
                  <h3 className="text-sm font-extrabold text-[#1C2333]">Active & Posted Campus Drives ({jobs.length})</h3>
                  <span className="sarvam-badge sarvam-badge-saffron text-[10px]">Official Recruiter Postings</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {jobs.map((j) => {
                    const isSelected = selectedJob?.id === j.id;
                    return (
                      <div
                        key={j.id}
                        onClick={() => {
                          setSelectedJob(j);
                          fetchJobApps(j.id);
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#EEF4FF] border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20'
                            : 'bg-white border-[#D6E4FF] hover:border-[#F06529]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="sarvam-badge sarvam-badge-blue text-[10px]">{j.company_name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-[#F06529]">₹{j.ctc_lpa} LPA</span>
                            {j.status === 'Active' ? (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await recruiterAPI.closeJobDrive(j.id);
                                    showToast(`Drive '${j.title}' marked as Closed!`, 'success');
                                    fetchInitialData();
                                  } catch (err) {
                                    showToast(`Failed to close drive`, 'error');
                                  }
                                }}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-extrabold rounded transition-all cursor-pointer shadow-sm"
                              >
                                🛑 Close Drive
                              </button>
                            ) : (
                              <span className="px-2 py-0.5 bg-stone-200 text-stone-700 text-[9px] font-extrabold rounded">
                                Closed
                              </span>
                            )}
                          </div>
                        </div>
                        <h4 className="text-xs font-extrabold text-[#1C2333] mt-2">{j.title}</h4>
                        <p className="text-[11px] text-[#5A6578] mt-0.5">Min CGPA: {j.min_cgpa} • Max Backlogs: {j.max_backlogs}</p>
                        <div className="mt-2 text-[10px] font-semibold text-stone-500">Location: {j.location}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Ranked Candidate Applicants Console */}
              <div className="sarvam-card p-6 space-y-4 bg-white">
                <div className="border-b border-[#D6E4FF] pb-4">
                  <h3 className="text-base font-extrabold text-[#1C2333]">
                    AI-Ranked Candidates for {selectedJob?.title || 'Selected Drive'}
                  </h3>
                  <p className="text-xs text-[#5A6578]">Candidate applications evaluated against job description criteria by AI Intelligence Engine.</p>
                </div>

                {/* Applicants List */}
                {applications.length > 0 ? (
                  <div className="space-y-3">
                    {applications.map((app) => {
                      const isChecked = selectedAppIds.includes(app.application_id);
                      const existingInterview = interviewRequests.find(r => r.usn === app.usn || r.student_name === app.student_name);

                      return (
                        <div 
                          key={app.application_id} 
                          className="p-4 rounded-2xl border bg-[#F4F7FC]/60 border-[#D6E4FF] transition-all space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-[#F06529]">{app.usn}</span>
                                  {app.has_resume ? (
                                    <span className="sarvam-badge sarvam-badge-blue text-[10px]">✓ Resume Verified</span>
                                  ) : (
                                    <span className="sarvam-badge sarvam-badge-saffron text-[10px]">⚠️ Resume Missing</span>
                                  )}
                                </div>
                                <h4 className="text-sm font-extrabold text-[#1C2333] mt-0.5">{app.student_name}</h4>
                                <p className="text-[11px] text-[#5A6578]">
                                  CGPA: {app.cgpa && app.cgpa > 0 ? app.cgpa : 'N/A'} • ML Placement Readiness: <strong>{Math.round(app.ml_placement_prob)}%</strong> • Mock Interview Score: <strong className={(app.mock_interview_score !== null && app.mock_interview_score !== undefined && app.mock_interview_score !== 'Not Attempted') ? "text-[#F06529]" : "text-stone-400 font-normal italic"}>
                                    {(app.mock_interview_score !== null && app.mock_interview_score !== undefined && app.mock_interview_score !== 'Not Attempted')
                                      ? `${app.mock_interview_score}/100 ${app.mock_interview_exited_mid ? '(Exited Mid-Session)' : ''}`
                                      : 'Not Attempted'}
                                  </strong>
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {existingInterview ? (
                                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Interview {existingInterview.status}</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setScheduleModalStudent(app)}
                                  className="px-3 py-1.5 bg-[#F06529] hover:bg-[#D9531E] text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                >
                                  <Calendar className="w-3.5 h-3.5" /> Schedule Interview
                                </button>
                              )}

                              <button
                                onClick={() => handleViewCandidateReport(app.student_id)}
                                disabled={loadingReportId === app.student_id}
                                className="px-3 py-1.5 bg-[#EEF4FF] hover:bg-[#2563EB] hover:text-white text-[#2563EB] border border-[#2563EB]/30 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" /> AI Report
                              </button>

                              <button
                                onClick={() => setSelectedFullProfileCandidate(app)}
                                className="px-3 py-1.5 bg-[#1C2333] hover:bg-black text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                              >
                                <Users className="w-3.5 h-3.5" /> View Profile
                              </button>

                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateStatus(app.application_id, e.target.value)}
                                className="text-xs font-bold bg-white border border-[#D6E4FF] rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                              >
                                <option value="Applied">Applied</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Interviewing">Interviewing</option>
                                <option value="Selected">Selected</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-[#D6E4FF] rounded-2xl">
                    <Briefcase className="w-8 h-8 text-[#5A6578] mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-[#5A6578]">No candidate applications submitted for this job drive yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULED LIVE INTERVIEWS */}
          {activeTab === 'interviews' && (
            <div className="sarvam-card p-6 bg-white space-y-5">
              <div className="border-b border-[#D6E4FF] pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="sarvam-badge bg-[#2563EB] text-white text-[10px]">Virtual Hiring Desk</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#1C2333] flex items-center gap-2">
                    <Video className="w-5 h-5 text-[#2563EB]" /> Scheduled Live Candidate Interviews ({interviewRequests.length})
                  </h3>
                  <p className="text-xs text-[#5A6578]">Track scheduled candidate interviews, candidate acceptance statuses, and launch Google Meet-style interview rooms with live AI co-pilot notes.</p>
                </div>
                <button
                  onClick={fetchInterviewRequests}
                  className="px-3.5 py-2 bg-[#EEF4FF] text-[#2563EB] rounded-xl text-xs font-bold hover:bg-[#2563EB] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Refresh Schedule
                </button>
              </div>

              {interviewRequests.length > 0 ? (
                <div className="space-y-4">
                  {interviewRequests.map((req) => (
                    <div key={req.id} className="p-5 bg-[#F8FAFC] border border-[#D6E4FF] rounded-2xl space-y-3 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#F06529]">{req.usn}</span>
                            <span className={`sarvam-badge text-[10px] ${
                              req.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                              req.status === 'Declined' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              Status: {req.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-[#1C2333] mt-1">{req.student_name}</h4>
                          <p className="text-xs text-[#5A6578] mt-0.5">
                            Target Position: <strong>{req.job_title}</strong> • Scheduled: <strong className="text-[#2563EB]">{req.scheduled_at}</strong>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {req.status !== 'Completed' ? (() => {
                            const meetingState = getInterviewMeetingState(req.scheduled_at, req.status);
                            return (
                              <>
                                <button
                                  onClick={() => meetingState.canJoin && setSelectedInterviewForRoom(req)}
                                  disabled={!meetingState.canJoin}
                                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2 ${
                                    meetingState.canJoin
                                      ? 'bg-gradient-to-r from-[#2563EB] to-[#F06529] text-white hover:opacity-95 cursor-pointer animate-pulse'
                                      : meetingState.state === 'EARLY'
                                      ? 'bg-amber-50 text-amber-800 border border-amber-300 cursor-not-allowed'
                                      : 'bg-stone-200 text-stone-500 cursor-not-allowed border border-stone-300'
                                  }`}
                                >
                                  <Video className="w-4 h-4" />
                                  <span>{meetingState.canJoin ? '🎥 Launch Google Meet Room' : meetingState.label}</span>
                                </button>
                                
                                <button
                                  onClick={async () => {
                                    try {
                                      await interviewAPI.respondRequest(req.id, 'Completed');
                                      showToast(`Interview for ${req.student_name} marked as Completed!`, 'success');
                                      fetchInterviewRequests();
                                    } catch (e) {
                                      showToast(`Failed to mark interview as completed`, 'error');
                                    }
                                  }}
                                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>🏁 Mark Interview Completed</span>
                                </button>
                              </>
                            );
                          })() : (
                            <span className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>✓ Interview Completed</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {req.ai_notes && (
                        <div className="p-4 bg-white border border-[#D6E4FF] rounded-xl mt-2 space-y-1 text-xs">
                          <span className="font-extrabold text-emerald-600">AI Live Evaluation Report:</span>
                          <FormattedMarkdown content={req.ai_notes} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-[#D6E4FF] rounded-2xl">
                  <Calendar className="w-8 h-8 text-[#5A6578] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-[#5A6578]">No live interviews scheduled yet. Select a candidate in Talent Directory to schedule.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: POST NEW CAMPUS DRIVE VIEW */}
          {activeTab === 'post_drive' && (
            <div className="sarvam-card p-7 bg-white space-y-6">
              <div className="border-b border-[#D6E4FF] pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="sarvam-badge sarvam-badge-saffron text-xs">Drive Posting Console</span>
                  <span className="sarvam-badge bg-[#2563EB] text-white text-xs">Officer Approval Required</span>
                </div>
                <h3 className="text-xl font-extrabold text-[#1C2333]">Post New Campus Recruitment Drive</h3>
                <p className="text-xs text-[#5A6578] mt-1">
                  Fill in the campus placement drive details below. Upon submitting, your drive request will be sent to the CMR Placement Officer for verification and live broadcast to all student dashboards.
                </p>
              </div>

              {postSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 leading-relaxed shadow-sm">
                  {postSuccessMsg}
                </div>
              )}

              <form onSubmit={handlePostJob} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">Company / Enterprise Name</label>
                    <input
                      type="text"
                      disabled
                      value={user.company_name || 'Enterprise Partner'}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl font-bold text-[#1C2333]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">Job Role / Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Development Engineer - I"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C2333] mb-1">Job Role Description *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe the job role, core responsibilities, key projects, and technology stack..."
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    className="w-full p-3.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">Job Location *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bangalore"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">CTC Package (LPA) *</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      placeholder="e.g. 14.0"
                      value={newJob.ctc_lpa}
                      onChange={(e) => setNewJob({ ...newJob, ctc_lpa: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">Minimum CGPA *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="e.g. 7.5"
                      value={newJob.min_cgpa}
                      onChange={(e) => setNewJob({ ...newJob, min_cgpa: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">Maximum Allowed Backlogs *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 0"
                      value={newJob.max_backlogs}
                      onChange={(e) => setNewJob({ ...newJob, max_backlogs: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">Required Technical Skills *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Python, Data Structures, System Design"
                      value={newJob.required_skills}
                      onChange={(e) => setNewJob({ ...newJob, required_skills: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={posting}
                  className="w-full py-4 btn-sarvam-saffron text-xs flex items-center justify-center gap-2 shadow-xl font-extrabold cursor-pointer transition-all select-none"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{posting ? 'Submitting Drive Request...' : 'Submit Drive Request for Placement Officer Approval'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: STUDENT TALENT POOL DIRECTORY */}
          {activeTab === 'students_dir' && (
            <div className="sarvam-card p-6 bg-white space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D6E4FF] pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#1C2333]">Student Talent Pool Directory ({students.length})</h3>
                  <p className="text-xs text-[#5A6578]">Browse registered college students, evaluate placement scores, and send direct interview invitations.</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 bg-[#EEF4FF] hover:bg-[#2563EB] hover:text-white text-[#2563EB] border border-[#2563EB]/30 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export Directory (CSV)
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by student name, USN, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-extrabold bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Branches</option>
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Science & Engineering">Information Science & Engineering</option>
                    <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                  </select>
                </div>
              </div>

              {/* Responsive Compact Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#D6E4FF]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EEF4FF] text-[#1C2333] font-black uppercase text-[10px] tracking-wider border-b border-[#D6E4FF]">
                    <tr>
                      <th className="py-3 px-3.5">Candidate Name</th>
                      <th className="py-3 px-3">USN / Branch</th>
                      <th className="py-3 px-3">CGPA</th>
                      <th className="py-3 px-3">Backlogs</th>
                      <th className="py-3 px-3">Resume</th>
                      <th className="py-3 px-3">ML Readiness</th>
                      <th className="py-3 px-3 text-right">Actions</th>
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
                          <td className="py-3 px-3 font-extrabold text-[#2563EB]">
                            {Math.round(s.placement_prob)}%
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setScheduleModalStudent(s)}
                                className="px-2.5 py-1 bg-[#F06529] hover:bg-[#D9531E] text-white rounded-xl text-[10px] font-extrabold transition-all shadow-sm cursor-pointer"
                              >
                                📅 Invite
                              </button>

                              <button
                                onClick={() => handleViewCandidateReport(s.profile_id)}
                                disabled={loadingReportId === s.profile_id}
                                className="px-2.5 py-1 bg-[#EEF4FF] hover:bg-[#2563EB] hover:text-white text-[#2563EB] border border-[#2563EB]/30 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer"
                              >
                                {loadingReportId === s.profile_id ? '...' : 'Report'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs font-semibold text-[#5A6578]">
                          No student candidates found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AI HEAD-TO-HEAD CANDIDATE COMPARISON */}
          {activeTab === 'ai_compare' && (
            <div className="sarvam-card p-6 bg-white space-y-5">
              <div className="border-b border-[#D6E4FF] pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="sarvam-badge bg-[#2563EB] text-white text-xs">AI Head-to-Head Comparative Engine</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#1C2333]">Candidate Comparative Evaluation Matrix</h3>
                <p className="text-xs text-[#5A6578]">Select two candidates from the talent pool to generate a side-by-side comparative analysis matrix powered by Groq LLaMA 3.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1C2333] mb-1">Select Candidate A *</label>
                  <select
                    value={compareCandA || ''}
                    onChange={(e) => setCompareCandA(parseInt(e.target.value) || null)}
                    className="w-full px-3.5 py-2.5 text-xs font-extrabold bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Candidate A --</option>
                    {students.map(s => (
                      <option key={s.profile_id} value={s.profile_id}>
                        {s.full_name} ({s.usn}) — CGPA: {s.cgpa || 'N/A'}, Readiness: {Math.round(s.placement_prob)}%
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C2333] mb-1">Select Candidate B *</label>
                  <select
                    value={compareCandB || ''}
                    onChange={(e) => setCompareCandB(parseInt(e.target.value) || null)}
                    className="w-full px-3.5 py-2.5 text-xs font-extrabold bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Candidate B --</option>
                    {students.map(s => (
                      <option key={s.profile_id} value={s.profile_id}>
                        {s.full_name} ({s.usn}) — CGPA: {s.cgpa || 'N/A'}, Readiness: {Math.round(s.placement_prob)}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleRunComparison}
                disabled={comparing || !compareCandA || !compareCandB}
                className="w-full py-3.5 btn-sarvam-saffron text-xs flex items-center justify-center gap-2 shadow-md font-extrabold cursor-pointer disabled:opacity-50"
              >
                <Scale className="w-4 h-4" />
                <span>{comparing ? 'Generating Head-to-Head Comparative Matrix...' : '⚔️ Run AI Head-to-Head Comparative Analysis'}</span>
              </button>

              {comparisonReport && (
                <div className="p-6 bg-[#F8FAFC] border border-[#D6E4FF] rounded-2xl space-y-3">
                  <h4 className="font-extrabold text-[#1C2333] text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    AI Candidate Head-to-Head Comparison Result
                  </h4>
                  <FormattedMarkdown content={comparisonReport} />
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AI INTERVIEW & SCORECARD TOOLS */}
          {activeTab === 'ai_tools' && (
            <div className="space-y-6">
              
              {/* Structured Scorecard Generator */}
              <div className="sarvam-card p-6 bg-white space-y-4">
                <div className="flex items-center gap-2 border-b border-[#D6E4FF] pb-3">
                  <FileEdit className="w-5 h-5 text-[#F06529]" />
                  <div>
                    <h3 className="text-base font-extrabold text-[#1C2333]">AI Interview Note Structurer & Scorecard Generator</h3>
                    <p className="text-xs text-[#5A6578]">Input raw interviewer notes to generate a structured candidate evaluation scorecard.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">Candidate Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Vashista"
                      value={noteCandidateName}
                      onChange={(e) => setNoteCandidateName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">Target Role Drive</label>
                    <input
                      type="text"
                      disabled
                      value={selectedJob?.title || 'Software Development Engineer'}
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl font-bold text-[#1C2333]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C2333] mb-1">Raw Interview Notes</label>
                  <textarea
                    rows={4}
                    placeholder="Type rough interviewer notes (e.g. Good DSA knowledge, strong Python skills, clear communication, minor struggle with system design scalability...)"
                    value={rawNotesInput}
                    onChange={(e) => setRawNotesInput(e.target.value)}
                    className="w-full p-3.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleStructureNotes}
                  disabled={structuringNotes || !rawNotesInput.trim() || !noteCandidateName.trim()}
                  className="w-full py-3.5 btn-sarvam-saffron text-xs flex items-center justify-center gap-2 shadow-md font-extrabold cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{structuringNotes ? 'Structuring Interview Notes...' : 'Generate Structured Evaluation Scorecard'}</span>
                </button>

                {structuredScorecard && (
                  <div className="p-5 bg-[#F8FAFC] border border-[#D6E4FF] rounded-2xl mt-4 space-y-2">
                    <h4 className="font-extrabold text-[#1C2333] text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Generated Candidate Scorecard
                    </h4>
                    <FormattedMarkdown content={structuredScorecard} />
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* SCHEDULE INTERVIEW MODAL */}
      {scheduleModalStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#D6E4FF]">
            <div className="flex items-center justify-between border-b border-[#D6E4FF] pb-3">
              <div>
                <span className="sarvam-badge bg-[#F06529] text-white text-[10px]">Google Meet Interview</span>
                <h3 className="text-base font-extrabold text-[#1C2333] mt-1">
                  Schedule Interview for {scheduleModalStudent.full_name || scheduleModalStudent.student_name}
                </h3>
              </div>
              <button
                onClick={() => setScheduleModalStudent(null)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleInterviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1C2333] mb-1">Target Job Placement Drive</label>
                <select
                  value={scheduleJobId !== null ? scheduleJobId : (selectedJob?.id || '')}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setScheduleJobId(isNaN(val) ? null : val);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-extrabold bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:outline-none cursor-pointer"
                >
                  <option value="">-- General Technical & Candidate Profile Evaluation Drive --</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.company_name} — {j.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2333] mb-1">Interview Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2333] mb-1">Interviewer Notes / Instructions</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please be prepared to discuss Data Structures, Python OOP, and system scalability..."
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  className="w-full p-3 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalStudent(null)}
                  className="px-4 py-2.5 bg-stone-100 text-stone-700 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2.5 btn-sarvam-saffron text-xs shadow-md font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {scheduling ? 'Scheduling...' : '📅 Send Interview Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE AI BREAKDOWN REPORT MODAL */}
      {selectedCandidateReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-[#D6E4FF]">
            <div className="flex items-center justify-between border-b border-[#D6E4FF] pb-3">
              <div>
                <span className="sarvam-badge bg-[#F06529] text-white text-[10px]">AI Evaluation Report</span>
                <h3 className="text-lg font-extrabold text-[#1C2333] mt-1">
                  Candidate Evaluation: {selectedCandidateReport.candidate?.full_name} ({selectedCandidateReport.candidate?.usn})
                </h3>
              </div>
              <button
                onClick={() => setSelectedCandidateReport(null)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#D6E4FF]">
              <FormattedMarkdown content={selectedCandidateReport.evaluation_report} />
            </div>

            <div className="text-right border-t border-[#D6E4FF] pt-3">
              <button
                onClick={() => setSelectedCandidateReport(null)}
                className="px-5 py-2.5 bg-[#1C2333] text-white rounded-2xl text-xs font-extrabold hover:bg-black transition-all cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE INTERVIEW ROOM MODAL */}
      {selectedInterviewForRoom && (
        <LiveInterviewRoom
          interviewData={selectedInterviewForRoom}
          userRole="recruiter"
          userName={user?.full_name || 'Recruiter'}
          onClose={() => setSelectedInterviewForRoom(null)}
        />
      )}

      {/* CANDIDATE FULL PROFILE MODAL */}
      {selectedFullProfileCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="sarvam-card bg-white max-w-3xl w-full p-6 space-y-6 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D6E4FF] pb-4">
              <div className="flex items-center gap-4">
                {selectedFullProfileCandidate.profile_photo ? (
                  <img
                    src={selectedFullProfileCandidate.profile_photo}
                    alt={selectedFullProfileCandidate.student_name || selectedFullProfileCandidate.full_name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#F06529] shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#1C2333] text-white flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-[#F06529]">
                    {(selectedFullProfileCandidate.student_name || selectedFullProfileCandidate.full_name)?.charAt(0) || 'S'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="sarvam-badge sarvam-badge-saffron text-[10px]">Candidate Full Profile</span>
                    {selectedFullProfileCandidate.has_resume && (
                      <span className="sarvam-badge bg-emerald-100 text-emerald-800 text-[10px]">✓ Resume Verified</span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-[#1C2333]">{selectedFullProfileCandidate.student_name || selectedFullProfileCandidate.full_name}</h3>
                  <p className="text-xs text-[#5A6578]">USN: <strong className="font-mono text-[#F06529]">{selectedFullProfileCandidate.usn}</strong> • {selectedFullProfileCandidate.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFullProfileCandidate(null)}
                className="w-9 h-9 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center font-extrabold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Academic & Readiness Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-[#EEF4FF] rounded-2xl border border-[#D6E4FF]">
                <p className="text-[10px] font-bold text-[#5A6578] uppercase">Branch</p>
                <p className="text-xs font-extrabold text-[#1C2333] mt-0.5">{selectedFullProfileCandidate.branch || 'CSE'}</p>
              </div>
              <div className="p-3 bg-[#EEF4FF] rounded-2xl border border-[#D6E4FF]">
                <p className="text-[10px] font-bold text-[#5A6578] uppercase">CGPA Score</p>
                <p className="text-xs font-extrabold text-[#2563EB] mt-0.5">{selectedFullProfileCandidate.cgpa || 7.5} / 10.0</p>
              </div>
              <div className="p-3 bg-[#EEF4FF] rounded-2xl border border-[#D6E4FF]">
                <p className="text-[10px] font-bold text-[#5A6578] uppercase">Active Backlogs</p>
                <p className="text-xs font-extrabold text-amber-600 mt-0.5">{selectedFullProfileCandidate.backlogs || 0}</p>
              </div>
              <div className="p-3 bg-[#EEF4FF] rounded-2xl border border-[#D6E4FF]">
                <p className="text-[10px] font-bold text-[#5A6578] uppercase">Placement Readiness</p>
                <p className="text-xs font-extrabold text-emerald-600 mt-0.5">{Math.round(selectedFullProfileCandidate.ml_placement_prob || 85)}%</p>
              </div>
            </div>

            {/* Semester-wise SGPA Breakdown */}
            {selectedFullProfileCandidate.sgpa_details && (
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#D6E4FF] space-y-2">
                <p className="text-xs font-extrabold text-[#1C2333]">Semester-wise SGPA Performance Trajectory</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center">
                  {(() => {
                    let sMap: any = {};
                    try { sMap = JSON.parse(selectedFullProfileCandidate.sgpa_details); } catch(e) {}
                    return [1,2,3,4,5,6,7,8].map((sNum) => {
                      const semKey = `sem${sNum}`;
                      const score = sMap[semKey] || 0;
                      return (
                        <div key={semKey} className={`p-2 rounded-xl border ${score > 0 ? 'bg-white border-[#2563EB]/40 text-[#1C2333]' : 'bg-stone-50 border-stone-200 text-stone-400'}`}>
                          <p className="text-[9px] font-bold uppercase text-[#5A6578]">Sem {sNum}</p>
                          <p className="text-xs font-extrabold mt-0.5">{score > 0 ? score.toFixed(2) : '—'}</p>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Detailed Experience & Portfolio Breakdown */}
            <div className="space-y-4 border-t border-[#D6E4FF] pt-4">
              <h4 className="text-xs font-extrabold text-[#1C2333] uppercase tracking-wider">Candidate Profile & Portfolio Breakdown</h4>
              
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#D6E4FF]">
                <p className="text-[11px] font-bold text-[#5A6578] uppercase mb-1">Technical Skills & Competencies</p>
                <p className="text-xs font-semibold text-[#1C2333]">{selectedFullProfileCandidate.skills_list || selectedFullProfileCandidate.skills || 'Python, React, SQL, Data Structures'}</p>
              </div>

              {/* Internships Breakdown */}
              {(() => {
                let iList: any[] = [];
                try {
                  if (selectedFullProfileCandidate.internships_details) {
                    iList = typeof selectedFullProfileCandidate.internships_details === 'string'
                      ? JSON.parse(selectedFullProfileCandidate.internships_details)
                      : selectedFullProfileCandidate.internships_details;
                  }
                } catch(e) {}
                
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-extrabold text-[#1C2333] flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" /> Internship Experience ({iList.length})
                    </p>
                    {iList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {iList.map((item: any, idx: number) => (
                          <div key={idx} className="p-3 bg-[#EEF4FF]/50 border border-[#D6E4FF] rounded-2xl space-y-1">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-extrabold text-[#1C2333]">{item.role || 'Software Intern'}</h5>
                              <span className="text-[10px] font-bold text-[#2563EB] bg-white px-2 py-0.5 rounded-full border border-[#D6E4FF]">{item.company || 'Tech Company'}</span>
                            </div>
                            {item.duration && <p className="text-[10px] font-semibold text-[#5A6578]">Duration: {item.duration}</p>}
                            {item.description && <p className="text-[11px] text-[#1C2333] leading-relaxed mt-1">{item.description}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#5A6578] italic bg-[#F8FAFC] p-3 rounded-xl border border-[#D6E4FF]">No internship experience logged yet.</p>
                    )}
                  </div>
                );
              })()}

              {/* Projects Breakdown */}
              {(() => {
                let pList: any[] = [];
                try {
                  if (selectedFullProfileCandidate.projects_details) {
                    pList = typeof selectedFullProfileCandidate.projects_details === 'string'
                      ? JSON.parse(selectedFullProfileCandidate.projects_details)
                      : selectedFullProfileCandidate.projects_details;
                  }
                } catch(e) {}

                return (
                  <div className="space-y-2">
                    <p className="text-xs font-extrabold text-[#1C2333] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#F06529]" /> Major Projects ({pList.length})
                    </p>
                    {pList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {pList.map((item: any, idx: number) => (
                          <div key={idx} className="p-3 bg-[#FFF0E8]/50 border border-[#FFE0CF] rounded-2xl space-y-1">
                            <h5 className="text-xs font-extrabold text-[#1C2333]">{item.title || 'Engineering Project'}</h5>
                            {item.tech_stack && <span className="sarvam-badge sarvam-badge-saffron text-[9px]">{item.tech_stack}</span>}
                            {item.description && <p className="text-[11px] text-[#1C2333] leading-relaxed mt-1">{item.description}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#5A6578] italic bg-[#F8FAFC] p-3 rounded-xl border border-[#D6E4FF]">No major projects logged yet.</p>
                    )}
                  </div>
                );
              })()}

              {/* Certifications Breakdown */}
              {(() => {
                let cList: any[] = [];
                try {
                  if (selectedFullProfileCandidate.certifications_details) {
                    cList = typeof selectedFullProfileCandidate.certifications_details === 'string'
                      ? JSON.parse(selectedFullProfileCandidate.certifications_details)
                      : selectedFullProfileCandidate.certifications_details;
                  }
                } catch(e) {}

                if (cList.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <p className="text-xs font-extrabold text-[#1C2333] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-purple-600" /> Certifications & Workshops ({cList.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {cList.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-1">
                          <h5 className="text-xs font-extrabold text-[#1C2333]">{item.title || 'Certification'}</h5>
                          {item.issuer && <p className="text-[10px] font-bold text-purple-700">Issued by: {item.issuer}</p>}
                          {item.skills_learned && <p className="text-[10px] text-[#5A6578]">Skills: {item.skills_learned}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Standard Interactive PDF Resume Reader Container */}
              {selectedFullProfileCandidate.resume_text && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-extrabold text-[#1C2333] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-red-600" /> Standard Interactive PDF Resume Reader
                  </p>
                  <StandardPdfResumeViewer
                    candidateName={selectedFullProfileCandidate.student_name || selectedFullProfileCandidate.full_name || 'Student Candidate'}
                    usn={selectedFullProfileCandidate.usn || 'N/A'}
                    email={selectedFullProfileCandidate.email || 'N/A'}
                    resumeText={selectedFullProfileCandidate.resume_text}
                    resumePdf={selectedFullProfileCandidate.resume_pdf}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#D6E4FF]">
              <button
                onClick={() => {
                  setSelectedFullProfileCandidate(null);
                  setScheduleModalStudent(selectedFullProfileCandidate);
                }}
                className="px-5 py-2.5 bg-[#F06529] hover:bg-[#D9531E] text-white rounded-2xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4" /> Schedule Interview
              </button>
              <button
                onClick={() => setSelectedFullProfileCandidate(null)}
                className="px-5 py-2.5 bg-[#1C2333] hover:bg-black text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
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
