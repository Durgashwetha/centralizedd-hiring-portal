import React from 'react';
import { Cpu, LogOut, ShieldCheck, Briefcase, GraduationCap } from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const getRoleIcon = () => {
    if (!user) return <GraduationCap className="w-4 h-4 text-[#F06529]" />;
    switch (user.role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      case 'recruiter':
        return <Briefcase className="w-4 h-4 text-[#2D5BFF]" />;
      default:
        return <GraduationCap className="w-4 h-4 text-[#F06529]" />;
    }
  };

  const getRoleBadgeClass = () => {
    if (!user) return 'sarvam-badge-saffron';
    switch (user.role) {
      case 'admin':
        return 'sarvam-badge-amber';
      case 'recruiter':
        return 'sarvam-badge-blue';
      default:
        return 'sarvam-badge-saffron';
    }
  };

  return (
    <header className="sticky top-3 z-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-16 rounded-full bg-white/90 backdrop-blur-md border border-[#D6E4FF] shadow-md px-6 flex items-center justify-between">
        
        {/* Sarvam AI Inspired Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F06529] text-white flex items-center justify-center shadow-md shadow-[#F06529]/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-[#1C2333]">CampusQuant</span>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#F06529] text-white tracking-wider">AI</span>
            </div>
            <p className="text-[10px] font-semibold text-[#5A6578] hidden sm:block">Talent Forecasting & Placement Intelligence</p>
          </div>
        </div>

        {/* User Info & Sarvam Navy Button */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">

              <div className="text-right hidden sm:block">
                <p className="text-xs font-extrabold text-[#1C2333]">{user.full_name}</p>
                <p className="text-[11px] text-[#5A6578] font-mono">{user.usn || user.email}</p>
              </div>
              <div className={`sarvam-badge ${getRoleBadgeClass()}`}>
                {getRoleIcon()}
                <span className="capitalize">{user.role === 'admin' ? 'Officer' : user.role}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="w-9 h-9 rounded-full bg-[#1C2333] hover:bg-[#0F1522] text-white flex items-center justify-center transition-all shadow-sm cursor-pointer active:scale-95 select-none"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs font-bold text-[#5A6578]">Institutional Portal Access</div>
          )}
        </div>

      </div>
    </header>
  );
};
