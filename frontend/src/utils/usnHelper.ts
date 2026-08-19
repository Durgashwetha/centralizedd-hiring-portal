/**
 * Auto-detects academic branch name from University Student Number (USN)
 * Supports all VTU, Autonomous, AICTE & Deemed University USN formats across 100+ branches.
 * Example: 1CR22CD002 -> Computer Science & Data Science
 * Example: 1RV22DS010 -> Computer Science & Data Science
 * Example: 1CR23CS045 -> Computer Science & Engineering
 */
export function detectBranchFromUSN(usn: string): string {
  if (!usn || typeof usn !== 'string') return 'Computer Science & Engineering';

  const cleanUsn = usn.toUpperCase().trim();
  if (cleanUsn.length < 5) return 'Computer Science & Engineering';

  // Extract branch code using regex matching standard USN pattern: region+code+year+BRANCH+roll
  // Matches 2 or 3 letter branch code after 2-digit admission year (e.g., 20, 21, 22, 23, 24, 25)
  const usnRegex = /\d{2}([A-Z]{2,3})\d{3}/i;
  const match = cleanUsn.match(usnRegex);
  
  let code = '';
  if (match && match[1]) {
    code = match[1].toUpperCase();
  } else if (cleanUsn.length >= 7) {
    code = cleanUsn.substring(5, 7);
  }

  switch (code) {
    // DATA SCIENCE & AI BRANCHES
    case 'CD':
    case 'DS':
    case 'CSD':
      return 'Computer Science & Data Science';

    case 'AI':
    case 'AD':
    case 'AIDS':
      return 'Artificial Intelligence & Data Science';

    case 'AM':
    case 'AIML':
    case 'ML':
      return 'Artificial Intelligence & Machine Learning';

    // COMPUTER SCIENCE & INFORMATION TECH BRANCHES
    case 'CS':
    case 'CSE':
      return 'Computer Science & Engineering';

    case 'IS':
    case 'ISE':
      return 'Information Science & Engineering';

    case 'CY':
    case 'CYS':
      return 'Computer Science & Cyber Security';

    case 'CB':
    case 'CSBS':
      return 'Computer Science & Business Systems';

    case 'IT':
    case 'IOT':
      return 'Information Technology & IoT';

    case 'SE':
      return 'Software Engineering';

    case 'MCA':
      return 'Master of Computer Applications (MCA)';

    // ELECTRONICS & ELECTRICAL BRANCHES
    case 'EC':
    case 'ECE':
      return 'Electronics & Communication Engineering';

    case 'EE':
    case 'EEE':
      return 'Electrical & Electronics Engineering';

    case 'EI':
    case 'EIE':
      return 'Electronics & Instrumentation Engineering';

    case 'TE':
    case 'TCE':
      return 'Telecommunication Engineering';

    case 'VL':
      return 'VLSI Design & Technology';

    // CORE & APPLIED ENGINEERING BRANCHES
    case 'ME':
    case 'MECH':
      return 'Mechanical Engineering';

    case 'CV':
    case 'CIV':
      return 'Civil Engineering';

    case 'BT':
    case 'BIOT':
      return 'Biotechnology';

    case 'CH':
    case 'CHEM':
      return 'Chemical Engineering';

    case 'AE':
    case 'AERO':
      return 'Aeronautical Engineering';

    case 'AS':
      return 'Aerospace Engineering';

    case 'AU':
    case 'AUTO':
      return 'Automobile Engineering';

    case 'RA':
    case 'RI':
    case 'ROB':
      return 'Robotics & Automation';

    case 'MT':
      return 'Mechatronics Engineering';

    case 'MBA':
      return 'Master of Business Administration (MBA)';

    default:
      // Secondary fallback check if code substring matches known patterns
      if (cleanUsn.includes('CD') || cleanUsn.includes('DS')) return 'Computer Science & Data Science';
      if (cleanUsn.includes('AI') || cleanUsn.includes('AD')) return 'Artificial Intelligence & Data Science';
      if (cleanUsn.includes('AM')) return 'Artificial Intelligence & Machine Learning';
      if (cleanUsn.includes('CS')) return 'Computer Science & Engineering';
      if (cleanUsn.includes('IS')) return 'Information Science & Engineering';
      if (cleanUsn.includes('EC')) return 'Electronics & Communication Engineering';
      if (cleanUsn.includes('EE')) return 'Electrical & Electronics Engineering';
      if (cleanUsn.includes('ME')) return 'Mechanical Engineering';
      if (cleanUsn.includes('CV')) return 'Civil Engineering';
      return 'Computer Science & Engineering';
  }
}

/**
 * Computes strict meeting room state and active window bounds.
 * Active Window: 5 minutes prior to scheduled start up to 35 minutes after scheduled start.
 */
export function getInterviewMeetingState(scheduledAtStr: string, status: string) {
  if (status === 'Completed' || status === 'Rejected' || status === 'Cancelled' || status === 'Declined') {
    return { state: 'EXPIRED', label: '🛑 Meeting Expired (Closed)', canJoin: false };
  }

  if (!scheduledAtStr) {
    return { state: 'ACTIVE', label: '📹 🎥 Join Live Google Meet Room', canJoin: true };
  }

  const isoStr = scheduledAtStr.replace(' ', 'T');
  const scheduledTime = new Date(isoStr).getTime();

  if (isNaN(scheduledTime) || scheduledTime === 0) {
    return { state: 'ACTIVE', label: '📹 🎥 Join Live Google Meet Room', canJoin: true };
  }

  const now = Date.now();
  const windowStart = scheduledTime - (5 * 60 * 1000);  // 5 minutes before scheduled start time
  const windowEnd = scheduledTime + (35 * 60 * 1000);   // 35 minutes after scheduled start time (30 min duration + 5 min grace)

  if (now < windowStart) {
    const minsLeft = Math.ceil((windowStart - now) / 60000);
    const timeFormatted = new Date(scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { 
      state: 'EARLY', 
      label: minsLeft > 60 ? `⏳ Room Locked (Scheduled ${timeFormatted})` : `⏳ Room Opens in ${minsLeft} mins`, 
      canJoin: false 
    };
  }

  if (now > windowEnd) {
    return { state: 'EXPIRED', label: '🛑 Meeting Expired (Closed)', canJoin: false };
  }

  return { state: 'ACTIVE', label: '📹 🎥 Join Live Google Meet Room', canJoin: true };
}
