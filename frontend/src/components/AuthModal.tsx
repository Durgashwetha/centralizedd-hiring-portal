import React, { useState } from 'react';
import { authAPI } from '../api';
import { detectBranchFromUSN } from '../utils/usnHelper';
import { Cpu, GraduationCap, ShieldCheck, Briefcase, Key, Mail, User, Lock, ArrowRight, AlertTriangle } from 'lucide-react';

interface AuthModalProps {
  onLoginSuccess: (userData: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'student' | 'admin' | 'recruiter'>('student');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    usn: '',
    company_name: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetKey, setResetKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // College Photo from public asset
  const collegePhoto = '/campus.jpg';

  const resetFormState = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      usn: '',
      company_name: '',
    });
    setIsForgotPassword(false);
    setForgotStep('request');
    setForgotEmail('');
    setResetKey('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
  };

  const handleRequestResetKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.requestResetKey(forgotEmail.trim().toLowerCase());
      setSuccessMsg(res.message || '6-digit security key sent to your registered email address!');
      setForgotStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send reset security key.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!resetKey.trim() || resetKey.trim().length !== 6) {
      setError('Please enter the complete 6-digit security key sent to your email.');
      return;
    }
    if (!newPassword) {
      setError('Please enter your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({
        email: forgotEmail.trim().toLowerCase(),
        reset_key: resetKey.trim(),
        new_password: newPassword,
      });
      setIsForgotPassword(false);
      setForgotStep('request');
      setSuccessMsg('✅ Password updated successfully! You can now sign in to the portal with your new password.');
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please check your key.');
    } finally {
      setLoading(false);
    }
  };

  const handleUsnChange = (val: string) => {
    const clean = val.toUpperCase();
    setFormData((prev) => ({
      ...prev,
      usn: clean
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (isRegister && role === 'admin') {
      setError('Placement Officer accounts cannot be self-created. Please login using official credentials: placement@cmr@gmail.com');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        const payload = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role,
          usn: role === 'student' ? formData.usn : undefined,
          company_name: role === 'recruiter' ? formData.company_name : undefined,
        };
        
        try {
          const data = await authAPI.register(payload);
          if (data?.access_token) {
            localStorage.setItem('cq_token', data.access_token);
            onLoginSuccess(data.user);
          } else {
            setSuccessMsg(`✅ Access Request Submitted! Your ${role} registration request has been sent to the CMR Placement Officer for verification. You will receive an official email once approved.`);
            setIsRegister(false);
            setLoading(false);
            return;
          }
        } catch (regErr: any) {
          const isPendingStatus = regErr.response?.status === 202 || 
                                 regErr.response?.status === 200 || 
                                 regErr.response?.data?.detail?.includes('Request Access') || 
                                 regErr.response?.data?.detail?.includes('pending') ||
                                 regErr.response?.data?.detail?.includes('verification');
          
          if (isPendingStatus) {
            const detailMsg = typeof regErr.response?.data?.detail === 'string' 
              ? regErr.response.data.detail 
              : `✅ Access Request Submitted! Your ${role} registration request has been sent to the CMR Placement Officer for verification. You will receive an official email once approved.`;
            setSuccessMsg(detailMsg);
            setIsRegister(false);
            setLoading(false);
            return;
          }
          throw regErr;
        }
      } else {
        const params = new URLSearchParams();
        params.append('username', formData.username || formData.email);
        params.append('password', formData.password);
        const data = await authAPI.login(params as any);
        sessionStorage.setItem('cq_token', data.access_token);
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      let msg = 'Authentication failed. Please check credentials.';
      if (err.response?.data?.detail) {
        const d = err.response.data.detail;
        if (typeof d === 'string') {
          msg = d;
        } else if (Array.isArray(d)) {
          msg = d.map((item: any) => item.msg || item.detail).join(', ');
        }
      }
      if (role !== 'student' && msg.includes('Incorrect email/USN or password')) {
        msg = 'Incorrect email or password';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const detectedBranch = isRegister && role === 'student' && formData.usn ? detectBranchFromUSN(formData.usn) : null;

  return (
    <div className="h-screen max-h-screen w-full overflow-hidden overscroll-none grid grid-cols-1 lg:grid-cols-12 bg-gradient-to-br from-[#FFF2EA] via-[#E8EEFF] to-[#FFFFFF]">
      
      {/* LEFT COLUMN: HD College Campus Visual & Sarvam Sunset Glass Box */}
      <div className="hidden lg:block lg:col-span-7 relative h-full overflow-hidden bg-[#1C2333]">
        {/* User's HD Campus Photo */}
        <img
          src={collegePhoto}
          alt="College Campus"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 transition-transform duration-700 hover:scale-105"
        />
        
        {/* Soft Sarvam Dark Periwinkle Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C2333] via-[#1C2333]/50 to-transparent" />

        {/* Top Floating Branding */}
        <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#F06529] text-white flex items-center justify-center font-black shadow-lg">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">CampusQuant AI</h1>
            <p className="text-[11px] font-semibold text-white/80 mt-0.5">Talent Forecasting & Institutional Placement Portal</p>
          </div>
        </div>

        {/* Bottom Left Sarvam Glass Container */}
        <div className="absolute bottom-8 left-8 right-8 z-10 sarvam-glass p-6 text-white max-w-xl rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl">
          <span className="sarvam-badge bg-[#F06529] text-white text-xs mb-2">Verified Placement Engine</span>
          <h2 className="text-2xl font-black tracking-tight leading-snug">
            Empowering Campus Recruitment with Centralized Predictive AI Analytics
          </h2>
          <p className="text-xs text-white/80 mt-2 leading-relaxed">
            Real-time candidate readiness scoring, ATS resume extraction, and automated placement drive management.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Institutional Authentication Form */}
      <div className="lg:col-span-5 h-full overflow-y-auto flex flex-col justify-center px-6 sm:px-12 py-8 bg-white/80 backdrop-blur-md">
        <div className="max-w-md w-full mx-auto space-y-6">
          
          {/* Form Header */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="sarvam-badge sarvam-badge-saffron text-xs">
                {role === 'student' ? 'Student Portal' : (role === 'admin' ? 'Placement Officer Portal' : 'Recruiter Drive Portal')}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (role === 'admin') return;
                  setIsRegister(!isRegister);
                  resetFormState();
                }}
                className="text-xs font-bold text-[#F06529] hover:underline"
              >
                {isRegister ? 'Already have credentials? Sign In' : (role === 'admin' ? 'Restricted Access' : 'New User? Send Request Access')}
              </button>
            </div>
            <h2 className="text-2xl font-extrabold text-[#1C2333] tracking-tight">Institutional Access</h2>
            <p className="text-xs font-medium text-[#5A6578]">
              {isRegister ? 'Submit access request to the CMR Placement Officer' : 'Sign in to access your role dashboard'}
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#F4F7FC] rounded-full border border-[#D6E4FF]">
            <button
              type="button"
              onClick={() => { setRole('student'); resetFormState(); }}
              className={`py-2 text-xs font-extrabold rounded-full flex items-center justify-center gap-1.5 transition-all ${
                role === 'student' ? 'bg-[#F06529] text-white shadow-md' : 'text-[#5A6578] hover:text-[#1C2333]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Student
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); resetFormState(); setIsRegister(false); }}
              className={`py-2 text-xs font-extrabold rounded-full flex items-center justify-center gap-1.5 transition-all ${
                role === 'admin' ? 'bg-[#F06529] text-white shadow-md' : 'text-[#5A6578] hover:text-[#1C2333]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Officer
            </button>
            <button
              type="button"
              onClick={() => { setRole('recruiter'); resetFormState(); }}
              className={`py-2 text-xs font-extrabold rounded-full flex items-center justify-center gap-1.5 transition-all ${
                role === 'recruiter' ? 'bg-[#F06529] text-white shadow-md' : 'text-[#5A6578] hover:text-[#1C2333]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Recruiter
            </button>
          </div>



          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 leading-relaxed shadow-sm">
              {successMsg}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {isForgotPassword ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-[#D6E4FF] pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-[#1C2333]">
                    {forgotStep === 'request' ? '🔑 Forgot Password' : '🔐 Reset Password'}
                  </h3>
                  <p className="text-xs text-[#5A6578] mt-0.5">
                    {forgotStep === 'request'
                      ? 'Enter your registered email ID to receive a 6-digit security key.'
                      : `Security key sent to ${forgotEmail}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-xs font-bold text-[#F06529] hover:underline cursor-pointer select-none"
                >
                  Back to Sign In
                </button>
              </div>

              {forgotStep === 'request' ? (
                <form onSubmit={handleRequestResetKey} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">Registered Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="Enter your registered email ID"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 btn-sarvam-saffron text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all cursor-pointer font-extrabold"
                  >
                    <Key className="w-4 h-4" />
                    <span>{loading ? 'Sending Security Key...' : 'Send Security Key to Email'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">6-Digit Security Key (From Email)</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 482910"
                      value={resetKey}
                      onChange={(e) => setResetKey(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-mono tracking-widest font-extrabold text-center bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C2333] mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 hover:bg-emerald-700 transition-all cursor-pointer font-extrabold"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{loading ? 'Updating Password...' : 'Update Password & Sign In'}</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Auth Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-[#1C2333] mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Enter Full Name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20 placeholder:text-stone-400"
                    />
                  </div>
                </div>
              )}

              {!isRegister ? (
                <div>
                  <label className="block text-xs font-bold text-[#1C2333] mb-1">
                    {role === 'student' ? 'USN or Email' : (role === 'admin' ? 'Placement Officer Email' : 'Recruiter Email')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder={
                        role === 'student' 
                          ? 'Enter USN or Email' 
                          : (role === 'admin' ? 'placement@cmr@gmail.com' : 'recruiter@company.com')
                      }
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20 placeholder:text-stone-400"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#1C2333] mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="student@campusquant.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20 placeholder:text-stone-400"
                    />
                  </div>
                </div>
              )}

              {isRegister && role === 'student' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#1C2333]">USN (University Student Number)</label>
                    {detectedBranch && (
                      <span className="text-[10px] font-bold text-[#F06529] bg-[#FFF0E8] px-2 py-0.5 rounded-md border border-[#FFE0CF]">
                        {detectedBranch}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1CR23CD001"
                    value={formData.usn}
                    onChange={(e) => handleUsnChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20 placeholder:text-stone-400"
                  />
                </div>
              )}

              {isRegister && role === 'recruiter' && (
                <div>
                  <label className="block text-xs font-bold text-[#1C2333] mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google India"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20 placeholder:text-stone-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1C2333] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#F4F7FC] border border-[#D6E4FF] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F06529]/20 placeholder:text-stone-400"
                  />
                </div>
                {!isRegister && role !== 'admin' && (
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotStep('request');
                        setForgotEmail(formData.username.includes('@') ? formData.username : '');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] font-bold text-[#F06529] hover:underline cursor-pointer select-none"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 btn-sarvam-saffron text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all cursor-pointer active:scale-95 select-none font-extrabold"
              >
                <span>{loading ? 'Processing Request...' : (isRegister ? 'Send Request Access' : 'Sign In to Portal')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      </div>

    </div>
  );
};
