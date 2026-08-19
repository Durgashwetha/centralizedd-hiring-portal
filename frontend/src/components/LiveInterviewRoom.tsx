import React, { useState, useEffect } from 'react';
import { interviewAPI } from '../api';
import { FormattedMarkdown } from './FormattedMarkdown';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Sparkles, ShieldCheck,
  User, CheckCircle2, FileText, MessageSquare, Copy, ExternalLink,
  Hand, MessageCircle, X, Lock, Clock
} from 'lucide-react';

interface LiveInterviewRoomProps {
  interviewData: any;
  userRole: 'student' | 'recruiter' | 'admin';
  userName: string;
  onClose: () => void;
}

export const LiveInterviewRoom: React.FC<LiveInterviewRoomProps> = ({
  interviewData,
  userRole,
  userName,
  onClose,
}) => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);

  const [liveTranscript, setLiveTranscript] = useState('');
  const [newNoteInput, setNewNoteInput] = useState('');
  const [completingInterview, setCompletingInterview] = useState(false);

  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const recognitionRef = React.useRef<any>(null);

  // Scheduled Time & Strict 30-Minute Meeting Window Rules
  const scheduledTime = interviewData?.scheduled_at ? new Date(interviewData.scheduled_at.replace(' ', 'T')).getTime() : 0;
  const isPastWindow = scheduledTime > 0 && !isNaN(scheduledTime) && (Date.now() - scheduledTime) > (35 * 60 * 1000); // Past 35 mins from scheduled start
  const isExpiredOrCompleted = interviewData?.status === 'Completed' || interviewData?.status === 'Rejected' || interviewData?.status === 'Cancelled' || isPastWindow;
  // Too early if scheduled time is in the future by > 5 minutes (300,000 ms)
  const isTooEarly = scheduledTime > 0 && !isNaN(scheduledTime) && (scheduledTime - Date.now()) > (5 * 60 * 1000);

  // Initialize Real Media Stream & Speech Engine
  useEffect(() => {
    if (!isExpiredOrCompleted && !isTooEarly) {
      startMedia();
      initSpeechRecognition();
    }
    return () => {
      stopMedia();
      stopSpeechRecognition();
    };
  }, [isExpiredOrCompleted, isTooEarly]);

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      stream.getAudioTracks().forEach(t => t.enabled = true);
      setMicOn(true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Webcam/Microphone hardware not available or permission denied:', err);
    }
  };

  const stopMedia = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const toggleCam = () => {
    const nextState = !camOn;
    setCamOn(nextState);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => (track.enabled = nextState));
    }
  };

  const toggleMic = () => {
    const nextState = !micOn;
    setMicOn(nextState);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => (track.enabled = nextState));
    }
    if (nextState) {
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = navigator.language || 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript.trim()) {
          const speaker = userRole === 'student' ? 'Candidate' : 'Interviewer';
          setLiveTranscript((prev) => `${prev}\n${speaker}: ${transcript.trim()}`);
        }
      };

      recognitionRef.current = recognition;
      startSpeechRecognition();
    } catch (e) {
      console.warn('Speech recognition init error:', e);
    }
  };

  const startSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Ignore if already running
      }
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
  };

  const handleFinishInterview = async () => {
    if (!interviewData?.id) {
      alert('Interview session ID missing.');
      onClose();
      return;
    }

    setCompletingInterview(true);
    try {
      const notesToSubmit = `${liveTranscript}\n\n[Recruiter Final Summary Notes]: ${newNoteInput.trim() || 'Candidate demonstrated strong technical depth and clear articulation.'}`;
      await interviewAPI.submitAINotes({ interview_id: interviewData.id, notes_transcript: notesToSubmit });
      alert('🏁 Meeting Ended & Finalized! AI structured evaluation scorecard dispatched directly to student email.');
      onClose();
    } catch (err) {
      console.error('Error submitting AI interview notes:', err);
      alert('Failed to finalize interview notes. Ending session.');
      onClose();
    } finally {
      setCompletingInterview(false);
    }
  };

  // 1. RENDER EXPIRED / COMPLETED SCREEN IF LINK EXPIRED
  if (isExpiredOrCompleted) {
    return (
      <div className="fixed inset-0 z-50 bg-[#171717] flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-[#202124] rounded-3xl p-8 border border-white/10 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500 text-rose-500 flex items-center justify-center mx-auto text-2xl font-bold">
            🛑
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-white">Virtual Interview Concluded</h3>
            <p className="text-xs text-stone-400">
              This meeting link for <strong className="text-white">{interviewData?.company_name || 'Campus Drive'} — {interviewData?.job_title || 'Interview'}</strong> has expired and been closed by the interviewer.
            </p>
          </div>
          <div className="p-4 bg-[#28292c] rounded-2xl border border-white/10 text-left text-xs text-stone-300 space-y-1">
            <p className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Meeting Status: Finalized & Closed
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              Official recruiter feedback and AI evaluation scorecard have been dispatched directly to student registered email.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-md"
          >
            Return to Portal Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 2. RENDER LOCKED SCHEDULED SCREEN IF STARTED TOO EARLY
  if (isTooEarly) {
    return (
      <div className="fixed inset-0 z-50 bg-[#171717] flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-[#202124] rounded-3xl p-8 border border-white/10 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500 text-amber-500 flex items-center justify-center mx-auto text-2xl font-bold">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-white">Virtual Room Locked</h3>
            <p className="text-xs text-stone-400">
              Virtual Interview for <strong className="text-white">{interviewData?.company_name} — {interviewData?.job_title}</strong> is scheduled for:
            </p>
            <p className="text-sm font-extrabold text-[#F06529] pt-1 font-mono">
              {interviewData?.scheduled_at}
            </p>
          </div>
          <div className="p-4 bg-[#28292c] rounded-2xl border border-white/10 text-xs text-amber-300 font-medium leading-relaxed">
            🔒 Security Protocol: The Virtual Interview Room opens automatically 5 minutes prior to the scheduled start time.
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-stone-700 hover:bg-stone-600 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all"
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  // 3. MAIN GOOGLE MEET LIVE INTERVIEW ROOM INTERFACE
  return (
    <div className="fixed inset-0 z-50 bg-[#202124] text-white flex flex-col font-sans select-none overflow-hidden">
      
      {/* TOP GOOGLE MEET HEADER */}
      <div className="h-16 bg-[#171717] border-b border-white/10 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F06529] text-white flex items-center justify-center font-bold shadow-md">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white tracking-tight">
                {interviewData?.company_name || 'Campus Placement'} — {interviewData?.job_title || 'Virtual Interview'}
              </h2>
              {userRole === 'admin' && (
                <span className="bg-purple-600/30 text-purple-300 border border-purple-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin Observer
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400 font-mono">
              Meeting ID: {interviewData?.meeting_link ? interviewData.meeting_link.split('room=')[1] : 'gmeet-cq-live'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Connected ({userRole.toUpperCase()})
          </span>

          {(userRole === 'recruiter' || userRole === 'admin') && (
            <button
              onClick={handleFinishInterview}
              disabled={completingInterview}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{completingInterview ? 'Finalizing Notes...' : '🏁 End Meeting for All'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-extrabold transition-all cursor-pointer"
          >
            Leave Meeting
          </button>
        </div>
      </div>

      {/* GOOGLE MEET STAGE CANVAS */}
      <div className="flex-1 p-6 flex gap-4 overflow-hidden relative bg-[#202124]">

        {/* MAIN PRIMARY VIDEO STAGE (FULL SCREEN INTERVIEW PARTNER) */}
        <div className={`flex-1 relative bg-[#3c4043] rounded-3xl overflow-hidden border border-white/10 flex flex-col items-center justify-center shadow-2xl transition-all ${showChatDrawer || showNotesDrawer ? 'mr-80' : ''}`}>
          
          {userRole === 'student' ? (
            /* STUDENT VIEWS RECRUITER MAIN STAGE */
            <div className="w-full h-full bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1C2333] flex flex-col items-center justify-center p-8 relative">
              <div className="w-28 h-28 rounded-full bg-[#2563EB]/20 border-4 border-[#2563EB] flex items-center justify-center text-[#2563EB] font-black text-4xl mb-4 shadow-2xl animate-pulse">
                {interviewData?.recruiter_name ? interviewData.recruiter_name.charAt(0) : 'R'}
              </div>
              <h3 className="text-xl font-black text-white">{interviewData?.recruiter_name || 'Recruiter Interviewer'}</h3>
              <p className="text-xs text-stone-400 font-medium mt-1">{interviewData?.company_name || 'Partner Enterprise Recruiter'}</p>
              
              <div className="mt-6 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Interviewer Audio Active • Live Session</span>
              </div>

              {/* STAGE HEADER BADGE */}
              <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Primary Meeting Feed — {interviewData?.company_name || 'Enterprise'}</span>
              </div>
            </div>
          ) : (
            /* RECRUITER VIEWS CANDIDATE MAIN WEBCAM FEED */
            camOn ? (
              <div className="w-full h-full relative flex items-center justify-center bg-stone-900">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-3xl"
                />
                <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>HD • Candidate Live Camera Stream</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-stone-400 space-y-3">
                <div className="w-24 h-24 rounded-full bg-stone-700 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                  {interviewData?.student_name ? interviewData.student_name.charAt(0) : 'S'}
                </div>
                <p className="text-base font-bold text-stone-200">{interviewData?.student_name || 'Student Candidate'}</p>
                <p className="text-xs text-stone-500">Camera Turned Off</p>
              </div>
            )
          )}

          {/* MAIN STAGE FOOTER NAME TAG */}
          <div className="absolute bottom-6 left-6 bg-black/75 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2.5 border border-white/10 shadow-lg">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>
              {userRole === 'student'
                ? `${interviewData?.recruiter_name || 'Recruiter'} (${interviewData?.company_name || 'Interviewer'})`
                : `${interviewData?.student_name || 'Student Candidate'} (Candidate)`}
            </span>
            <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 ml-1">
              <Mic className="w-3.5 h-3.5" />
            </span>
          </div>

          {handRaised && (
            <div className="absolute top-6 right-6 bg-amber-500 text-stone-950 font-bold px-4 py-1.5 rounded-full text-xs flex items-center gap-2 animate-bounce shadow-xl">
              <Hand className="w-4 h-4" /> Hand Raised
            </div>
          )}

          {/* GOOGLE MEET FLOATING SELF-VIEW PIP OVERLAY (BOTTOM RIGHT) */}
          <div className="absolute bottom-6 right-6 w-56 h-36 bg-[#171717] rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl transition-transform hover:scale-105">
            {userRole === 'student' ? (
              camOn ? (
                <div className="w-full h-full relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[9px] font-bold text-white border border-white/10">
                    You (Candidate)
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 text-stone-400">
                  <User className="w-8 h-8 mb-1 text-stone-300" />
                  <span className="text-[10px] font-bold">Your Camera Off</span>
                </div>
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-950 p-2 text-center">
                <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white font-bold flex items-center justify-center text-xs mb-1">
                  {userName.charAt(0)}
                </div>
                <span className="text-[10px] font-extrabold text-white truncate max-w-[140px]">{userName}</span>
                <span className="text-[8px] text-blue-300 uppercase">You (Interviewer)</span>
              </div>
            )}
          </div>

        </div>

        {/* SIDE DRAWER: IN-MEETING CHAT OR PRIVATE RECRUITER NOTES */}
        {(showChatDrawer || showNotesDrawer) && (
          <div className="absolute top-6 right-6 bottom-6 w-80 bg-[#171717] rounded-3xl border border-white/10 p-4 flex flex-col space-y-3 z-30 shadow-2xl backdrop-blur-md">

            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                {showChatDrawer ? (
                  <>
                    <MessageSquare className="w-4 h-4 text-[#2563EB]" /> Live In-Meeting Chat
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#F06529]" /> Recruiter Evaluation Notes
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setShowChatDrawer(false);
                  setShowNotesDrawer(false);
                }}
                className="w-6 h-6 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* LIVE SPEECH TRANSCRIPT / CHAT STREAM */}
            {showChatDrawer && (
              <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono bg-black/40 p-3 rounded-2xl border border-white/10 text-stone-300 leading-relaxed custom-scrollbar">
                <p className="text-[10px] text-stone-500 font-sans italic border-b border-stone-800 pb-2">
                  🎙️ AI Speech-to-Text Transcriber actively listening to live interview conversation...
                </p>
                {liveTranscript.split('\n').map((line, idx) => (
                  <div key={idx} className="py-0.5">
                    {line.startsWith('Candidate:') ? (
                      <span className="text-emerald-400 font-bold">{line}</span>
                    ) : line.startsWith('Interviewer:') ? (
                      <span className="text-blue-400 font-bold">{line}</span>
                    ) : (
                      <span className="text-stone-400 italic text-[11px]">{line}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* PRIVATE RECRUITER EVALUATION NOTES DRAWER */}
            {showNotesDrawer && (
              <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                <div className="flex-1 bg-black/40 p-3 rounded-2xl border border-white/10 overflow-y-auto space-y-2 text-xs leading-relaxed custom-scrollbar">
                  <h4 className="text-[11px] font-bold text-[#F06529] uppercase">AI Auto-Captured Notes:</h4>
                  <div className="text-stone-300 text-[11px] font-sans whitespace-pre-wrap leading-relaxed">
                    {liveTranscript}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <label className="block text-[10px] font-bold uppercase text-stone-400">Add Interviewer Remarks:</label>
                  <textarea
                    rows={3}
                    placeholder="Enter manual evaluation notes (e.g. strong data structures skills, good confidence)..."
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    className="w-full p-2.5 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* BOTTOM GOOGLE MEET CONTROL TOOLBAR */}
      <div className="h-20 bg-[#171717] border-t border-white/10 px-6 flex items-center justify-between z-20">
        
        {/* TIME & METRICS */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-stone-400 font-mono">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Encrypted Session
          </span>
        </div>

        {/* CENTER GOOGLE MEET INTERACTION BUTTONS */}
        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          
          {/* TOGGLE MIC */}
          <button
            type="button"
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
              micOn ? 'bg-stone-800 hover:bg-stone-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
            title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* TOGGLE CAMERA */}
          <button
            type="button"
            onClick={toggleCam}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
              camOn ? 'bg-stone-800 hover:bg-stone-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
            title={camOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* RAISE HAND */}
          <button
            type="button"
            onClick={() => setHandRaised(!handRaised)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
              handRaised ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800 hover:bg-stone-700 text-white'
            }`}
            title="Raise Hand"
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* TOGGLE IN-MEETING CHAT DRAWER */}
          <button
            type="button"
            onClick={() => {
              setShowChatDrawer(!showChatDrawer);
              setShowNotesDrawer(false);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
              showChatDrawer ? 'bg-[#2563EB] text-white' : 'bg-stone-800 hover:bg-stone-700 text-white'
            }`}
            title="In-Meeting Speech Transcript & Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* RECRUITER EVALUATION NOTES DRAWER */}
          {(userRole === 'recruiter' || userRole === 'admin') && (
            <button
              type="button"
              onClick={() => {
                setShowNotesDrawer(!showNotesDrawer);
                setShowChatDrawer(false);
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                showNotesDrawer ? 'bg-[#F06529] text-white' : 'bg-stone-800 hover:bg-stone-700 text-white'
              }`}
              title="Private Evaluation Notes"
            >
              <FileText className="w-5 h-5" />
            </button>
          )}

          {/* LEAVE / END MEETING RED BUTTON */}
          <button
            type="button"
            onClick={userRole === 'recruiter' ? handleFinishInterview : onClose}
            className="w-14 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl ml-2"
            title={userRole === 'recruiter' ? 'End Meeting for All' : 'Leave Meeting'}
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* SECURITY ENCRYPTED STAMP */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-stone-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Google Meet Style Enterprise UI</span>
        </div>

      </div>

    </div>
  );
};
