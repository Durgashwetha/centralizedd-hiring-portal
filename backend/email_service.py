import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from backend.config import settings

def _send_smtp_email(recipient_email: str, subject: str, text_body: str, html_body: str) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"CMRIT Placement Cell <{settings.SMTP_EMAIL}>"
        msg["To"] = recipient_email
        msg["Reply-To"] = settings.SMTP_EMAIL
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain="cmrit.ac.in")
        msg["X-Mailer"] = "CMRIT CampusQuant Enterprise Placement Mailer 1.0"
        msg["X-Auto-Response-Suppress"] = "OOF, AutoReply"

        part1 = MIMEText(text_body, "plain", "utf-8")
        part2 = MIMEText(html_body, "html", "utf-8")

        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, recipient_email, msg.as_string())
        server.quit()
        print(f"SMTP Email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending SMTP email to {recipient_email}: {e}")
        return False

def send_recruiter_drive_approval_email(recipient_email: str, recipient_name: str, company_name: str, job_title: str):
    subject = f"Campus Placement Drive Approved: {company_name} - {job_title}"
    text_body = f"Hello {recipient_name},\n\nYour campus placement drive for {job_title} at {company_name} has been approved by the Placement Officer and broadcasted live to all eligible students.\n\nSign in to review applications."
    html_body = f"""
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #D6E4FF;">
          <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #EEF4FF;">
            <h2 style="color: #2563EB; margin: 0;">CampusPlacement Drive Approved</h2>
            <p style="color: #64748B; font-size: 12px; margin-top: 4px;">Institutional Partner Portal • CMRIT Bangalore</p>
          </div>
          <div style="padding: 20px 0;">
            <p style="font-size: 15px; margin-top: 0;">Hello <strong>{recipient_name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Great news! Your campus placement drive posting for <strong style="color: #2563EB;">{job_title}</strong> at <strong>{company_name}</strong> has been officially <strong style="color: #10B981;">APPROVED</strong> by the CMR Placement Officer.
            </p>
            <div style="background-color: #EEF4FF; padding: 16px; border-radius: 12px; border-left: 4px solid #2563EB; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #1E40AF; font-size: 13px;">Drive Status: Active & Live</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #3B82F6;">
                Eligible students can now view your job posting and submit applications directly through their portals.
              </p>
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <a href="http://localhost:5173" style="background-color: #2563EB; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
                Access Recruiter Portal
              </a>
            </div>
          </div>
          <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
            <p style="margin: 0;">CMR Institute of Technology • Department of Career Guidance & Placement</p>
          </div>
        </div>
      </body>
    </html>
    """
    return _send_smtp_email(recipient_email, subject, text_body, html_body)

def send_approval_email(recipient_email: str, recipient_name: str, role: str):
    subject = f"Access Approved — CampusQuant AI Placement Portal ({role.capitalize()})"
    text_body = f"Namaste {recipient_name},\n\nWe are pleased to inform you that your request for {role.capitalize()} Access to the CampusQuant AI Portal has been officially APPROVED by the CMR Placement Officer.\n\nYou can now log in using your registered credentials."
    html_body = f"""
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #D6E4FF;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #FFF0E8;">
            <h2 style="color: #F06529; margin: 0; font-size: 24px;">CampusQuant AI Placement System</h2>
            <p style="color: #5A6578; font-size: 12px; margin-top: 4px;">Institutional Placement Intelligence & Career Portal</p>
          </div>
          <div style="padding: 24px 0;">
            <h3 style="color: #1C2333; font-size: 18px; margin-top: 0;">Namaste {recipient_name},</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              We are pleased to inform you that your request for <strong>{role.capitalize()} Access</strong> to the CampusQuant AI Portal has been officially <strong style="color: #10B981;">APPROVED</strong> by the CMR Placement Officer.
            </p>
            <div style="background-color: #EEF4FF; padding: 16px; border-radius: 12px; border-left: 4px solid #2563EB; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1E40AF;">Your account is now fully active.</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #3B82F6;">You can now log in to the portal using your registered email and password.</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:5173" style="background-color: #F06529; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
                Sign In to CampusQuant Portal
              </a>
            </div>
          </div>
          <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
            <p style="margin: 0;">CMR Institute of Technology • Placement & Career Development Cell</p>
          </div>
        </div>
      </body>
    </html>
    """
    return _send_smtp_email(recipient_email, subject, text_body, html_body)

def send_rejection_email(recipient_email: str, recipient_name: str, role: str):
    """
    Sends an automated HTML rejection / hold email to students or recruiters.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Notice: Access Request On Hold — CampusQuant AI Portal"
        msg["From"] = f"CampusQuant AI Placement Office <{settings.SMTP_EMAIL}>"
        msg["To"] = recipient_email

        html_content = f"""
        <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #FFE0CF;">
              
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #FFF0E8;">
                <h2 style="color: #F06529; margin: 0; font-size: 24px;">CampusQuant AI Placement System</h2>
                <p style="color: #5A6578; font-size: 12px; margin-top: 4px;">Institutional Placement Intelligence & Career Portal</p>
              </div>

              <div style="padding: 24px 0;">
                <h3 style="color: #1C2333; font-size: 18px; margin-top: 0;">Dear {recipient_name},</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                  Your request for <strong>{role.capitalize()} Access</strong> to the CampusQuant AI Portal has been <strong style="color: #EF4444;">PLACED ON HOLD / REJECTED</strong> by the CMR Placement Officer.
                </p>

                <div style="background-color: #FFF0E8; padding: 16px; border-radius: 12px; border-left: 4px solid #F06529; margin: 20px 0;">
                  <p style="margin: 0; font-size: 13px; font-weight: bold; color: #991B1B;">Placement Office Approval Required</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #B91C1C;">
                    If you believe this is an error or wish to have your access request released, please contact the CMR Placement Officer directly at the placement administration cell for manual verification.
                  </p>
                </div>
              </div>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
                <p style="margin: 0;">CMR Institute of Technology • Placement & Career Development Cell</p>
                <p style="margin: 4px 0 0 0;">For inquiries, contact placement@cmr.edu</p>
              </div>

            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, recipient_email, msg.as_string())
        server.quit()
        print(f"Rejection/Hold email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending rejection email to {recipient_email}: {e}")
        return False

def send_incomplete_profile_warning_email(recipient_email: str, recipient_name: str):
    """
    Sends an automated warning email to students with incomplete profiles after 5 minutes of account creation.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "⚠️ Action Required: Complete Your CampusQuant Student Profile Within 3 Days"
        msg["From"] = f"CampusQuant AI Placement Office <{settings.SMTP_EMAIL}>"
        msg["To"] = recipient_email

        portal_url = "http://localhost:5173"

        html_content = f"""
        <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #FFE0CF;">
              
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #FFF0E8;">
                <h2 style="color: #F06529; margin: 0; font-size: 24px;">CampusQuant AI Placement System</h2>
                <p style="color: #5A6578; font-size: 12px; margin-top: 4px;">Institutional Placement Intelligence & Career Portal</p>
              </div>

              <div style="padding: 24px 0;">
                <h3 style="color: #1C2333; font-size: 18px; margin-top: 0;">Namaste {recipient_name},</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                  We noticed that your student profile on the CampusQuant AI Portal is currently <strong style="color: #F06529;">INCOMPLETE</strong>.
                </p>

                <div style="background-color: #FFF0E8; padding: 18px; border-radius: 16px; border-left: 4px solid #F06529; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; font-weight: bold; color: #991B1B;">⏰ 3 Working Days Deadline Notice</p>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #B91C1C; line-height: 1.5;">
                    Please complete your academic profile details (CGPA, skills, projects) and upload your resume <strong>within 3 working days</strong>. 
                    Otherwise, your profile will be placed on hold by the Placement Office.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 28px;">
                  <a href="{portal_url}" style="background-color: #F06529; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
                    📝 Complete Profile Now
                  </a>
                </div>
              </div>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
                <p style="margin: 0;">CMR Institute of Technology • Placement & Career Development Cell</p>
                <p style="margin: 4px 0 0 0;">This is an automated reminder. Data remains secure.</p>
              </div>

            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, recipient_email, msg.as_string())
        server.quit()
        print(f"Incomplete profile warning email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending incomplete profile warning email to {recipient_email}: {e}")
        return False

def send_mid_session_exit_warning_email(recipient_email: str, recipient_name: str):
    """
    Sends a 2-minute warning email to students who exited their AI Mock Interview in the middle.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "⚠️ Warning: AI Mock Interview Session Exited Mid-Way"
        msg["From"] = f"CampusQuant AI Placement Office <{settings.SMTP_EMAIL}>"
        msg["To"] = recipient_email

        portal_url = "http://localhost:5173"

        html_content = f"""
        <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #FFE0CF;">
              
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #FFF0E8;">
                <h2 style="color: #F06529; margin: 0; font-size: 24px;">CampusQuant AI Placement Office</h2>
                <p style="color: #5A6578; font-size: 12px; margin-top: 4px;">Institutional Placement Intelligence & Mock Interview Evaluator</p>
              </div>

              <div style="padding: 24px 0;">
                <h3 style="color: #1C2333; font-size: 18px; margin-top: 0;">Dear {recipient_name},</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                  Our system recorded that you <strong style="color: #DC2626;">EXITED IN THE MIDDLE</strong> of your live AI Mock Interview session.
                </p>

                <div style="background-color: #FEF2F2; padding: 18px; border-radius: 16px; border-left: 4px solid #DC2626; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; font-weight: bold; color: #991B1B;">⚠️ Important Placement Guideline Notice</p>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #B91C1C; line-height: 1.5;">
                    Exiting mid-session impacts your placement readiness rating. You must complete your full mock interview round (30 min Technical / 15 min HR) without exiting in the middle.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 28px;">
                  <a href="{portal_url}" style="background-color: #2563EB; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
                    🎙️ Retake Full AI Mock Interview
                  </a>
                </div>
              </div>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
                <p style="margin: 0;">CMR Institute of Technology • Placement & Career Development Cell</p>
              </div>

            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, recipient_email, msg.as_string())
        server.quit()
        print(f"Mid-session exit warning email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending mid-session exit warning email to {recipient_email}: {e}")
        return False

def send_weekly_mock_reminder_email(recipient_email: str, recipient_name: str):
    """
    Sends recurring reminder email (every 2 days) for mandatory weekly AI mock interviews.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🎙️ Action Required: Weekly AI Mock Interview Due"
        msg["From"] = f"CampusQuant AI Placement Office <{settings.SMTP_EMAIL}>"
        msg["To"] = recipient_email

        portal_url = "http://localhost:5173"

        html_content = f"""
        <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #FFE0CF;">
              
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #FFF0E8;">
                <h2 style="color: #F06529; margin: 0; font-size: 24px;">CampusQuant AI Placement Office</h2>
                <p style="color: #5A6578; font-size: 12px; margin-top: 4px;">Institutional Placement Intelligence & Readiness Cell</p>
              </div>

              <div style="padding: 24px 0;">
                <h3 style="color: #1C2333; font-size: 18px; margin-top: 0;">Namaste {recipient_name},</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                  This is a reminder from the CMR Placement Office that your <strong style="color: #F06529;">Mandatory Weekly AI Mock Interview</strong> is due.
                </p>

                <div style="background-color: #FFF0E8; padding: 18px; border-radius: 16px; border-left: 4px solid #F06529; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; font-weight: bold; color: #991B1B;">📅 Mandatory Weekly Assessment Rule</p>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #B91C1C; line-height: 1.5;">
                    All registered candidates must take an AI Technical or HR Mock Interview at least once every 7 days to maintain active readiness scores for campus drives.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 28px;">
                  <a href="{portal_url}" style="background-color: #F06529; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
                    🎙️ Take Weekly AI Mock Interview Now
                  </a>
                </div>
              </div>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
                <p style="margin: 0;">CMR Institute of Technology • Placement & Career Development Cell</p>
                <p style="margin: 4px 0 0 0;">Automated reminder sent every 2 days for overdue mock interviews.</p>
              </div>

            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, recipient_email, msg.as_string())
        server.quit()
        print(f"Weekly mock interview reminder email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending weekly mock reminder email to {recipient_email}: {e}")
        return False

def send_campus_drive_broadcast_email(recipient_email: str, recipient_name: str, company_name: str, job_title: str, ctc_lpa: float, location: str):
    """
    Sends an automated email notification to students when a new campus recruitment drive is approved.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"📢 New Campus Drive Announcement: {company_name} - {job_title}"
        msg["From"] = f"CampusQuant AI Placement Office <{settings.SMTP_EMAIL}>"
        msg["To"] = recipient_email

        portal_url = "http://localhost:5173"

        html_content = f"""
        <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #D6E4FF;">
              
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #EEF4FF;">
                <h2 style="color: #2563EB; margin: 0; font-size: 24px;">CampusQuant AI Placement Office</h2>
                <p style="color: #5A6578; font-size: 12px; margin-top: 4px;">Institutional Campus Recruitment Drive Announcement</p>
              </div>

              <div style="padding: 24px 0;">
                <h3 style="color: #1C2333; font-size: 18px; margin-top: 0;">Namaste {recipient_name},</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                  A new official campus recruitment drive for <strong style="color: #2563EB;">{company_name}</strong> has been approved by the Placement Office!
                </p>

                <div style="background-color: #EEF4FF; padding: 20px; border-radius: 16px; border-left: 4px solid #2563EB; margin: 20px 0;">
                  <h4 style="margin: 0 0 8px 0; color: #1C2333; font-size: 16px;">🏢 {company_name} — {job_title}</h4>
                  <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>CTC Package:</strong> ₹{ctc_lpa} LPA</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Job Location:</strong> {location}</p>
                  <p style="margin: 8px 0 0 0; font-size: 12px; color: #2563EB; font-weight: bold;">
                    ✓ Approved by Placement Officer — Open for Instant Applications!
                  </p>
                </div>

                <div style="text-align: center; margin-top: 28px;">
                  <a href="{portal_url}" style="background-color: #F06529; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
                    🚀 View Drive & Apply on Portal
                  </a>
                </div>
              </div>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
                <p style="margin: 0;">CMR Institute of Technology • Placement & Career Development Cell</p>
                <p style="margin: 4px 0 0 0;">This is an official campus placement drive notification.</p>
              </div>

            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, recipient_email, msg.as_string())
        server.quit()
        print(f"Campus drive broadcast email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending campus drive broadcast email to {recipient_email}: {e}")
        return False

def send_password_reset_key_email(recipient_email: str, recipient_name: str, reset_key: str):
    """
    Sends a 6-digit security reset key to users requesting a password reset.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🔐 CampusQuant AI: Password Reset Security Key"
        msg["From"] = f"CampusQuant Security Desk <{settings.SMTP_EMAIL}>"
        msg["To"] = recipient_email

        html_content = f"""
        <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #FFE0CF;">
              
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #FFF0E8;">
                <h2 style="color: #F06529; margin: 0; font-size: 24px;">CampusQuant Security Service</h2>
                <p style="color: #5A6578; font-size: 12px; margin-top: 4px;">Account Security & Password Recovery Verification</p>
              </div>

              <div style="padding: 24px 0;">
                <h3 style="color: #1C2333; font-size: 18px; margin-top: 0;">Hello {recipient_name},</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                  We received a request to reset your password on the CampusQuant AI Portal.
                </p>

                <div style="background-color: #FFF0E8; padding: 24px; border-radius: 16px; text-align: center; margin: 24px 0; border: 2px dashed #F06529;">
                  <p style="margin: 0; font-size: 12px; font-weight: bold; color: #5A6578; letter-spacing: 1px;">YOUR 6-DIGIT RESET SECURITY KEY</p>
                  <p style="margin: 12px 0 0 0; font-size: 36px; font-weight: 900; color: #F06529; font-family: monospace; letter-spacing: 6px;">
                    {reset_key}
                  </p>
                </div>

                <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
                  Enter this security key on the password reset screen along with your new password. This key is valid for 15 minutes.
                  If you did not request this, please ignore this email.
                </p>
              </div>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
                <p style="margin: 0;">CMR Institute of Technology • CampusQuant AI Security Desk</p>
              </div>

            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, recipient_email, msg.as_string())
        server.quit()
        print(f"Password reset security key email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending password reset security key email to {recipient_email}: {e}")
        return False

def send_interview_call_letter_email(recipient_email: str, recipient_name: str, company_name: str, job_title: str):
    """
    Sends an official interview call letter email to shortlisted candidates via Gmail SMTP.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🎉 Shortlisted for Interview: {company_name} — {job_title}"
        msg["From"] = f"{company_name} Recruitment Desk <{settings.SMTP_EMAIL}>"
        msg["To"] = recipient_email

        html_content = f"""
        <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #D6E4FF;">
              
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #EEF4FF;">
                <h2 style="color: #2563EB; margin: 0; font-size: 24px;">{company_name} Recruitment Team</h2>
                <p style="color: #5A6578; font-size: 12px; margin-top: 4px;">Official Campus Hiring & Selection Notice</p>
              </div>

              <div style="padding: 24px 0;">
                <h3 style="color: #1C2333; font-size: 18px; margin-top: 0;">Congratulations {recipient_name}!</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                  We are pleased to inform you that based on your academic profile, resume verification, and CampusQuant AI placement evaluation, you have been <strong>Shortlisted</strong> for the position of <strong style="color: #2563EB;">{job_title}</strong> at <strong>{company_name}</strong>!
                </p>

                <div style="background-color: #EEF4FF; padding: 20px; border-radius: 16px; border-left: 4px solid #2563EB; margin: 20px 0;">
                  <h4 style="margin: 0 0 8px 0; color: #1C2333; font-size: 15px;">📋 Next Steps & Interview Information</h4>
                  <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Status:</strong> Shortlisted & Selected for Next Round</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Role:</strong> {job_title}</p>
                  <p style="margin: 8px 0 0 0; font-size: 12px; color: #2563EB; font-weight: bold;">
                    Check your student portal for official interview schedule updates.
                  </p>
                </div>
              </div>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
                <p style="margin: 0;">{company_name} Enterprise Hiring Desk • CampusQuant AI</p>
              </div>

            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, recipient_email, msg.as_string())
        server.quit()
        print(f"Interview call letter email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending interview call letter email to {recipient_email}: {e}")
        return False

def send_interview_request_to_student_email(student_email: str, student_name: str, company_name: str, job_title: str, scheduled_time_str: str):
    """
    Sends an automated email invitation to a student when a recruiter schedules a live interview request.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"📅 Live Interview Invitation: {company_name} - {job_title}"
        msg["From"] = f"{company_name} Recruiter Desk <{settings.SMTP_EMAIL}>"
        msg["To"] = student_email

        portal_url = "http://localhost:5173"

        html_content = f"""
        <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #D6E4FF;">
              
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #EEF4FF;">
                <h2 style="color: #2563EB; margin: 0; font-size: 24px;">{company_name} Hiring Desk</h2>
                <p style="color: #5A6578; font-size: 12px; margin-top: 4px;">Live Campus Interview Schedule Request</p>
              </div>

              <div style="padding: 24px 0;">
                <h3 style="color: #1C2333; font-size: 18px; margin-top: 0;">Hello {student_name},</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                  The recruitment team at <strong style="color: #2563EB;">{company_name}</strong> has reviewed your profile and sent you an invitation for a live virtual interview!
                </p>

                <div style="background-color: #EEF4FF; padding: 20px; border-radius: 16px; border-left: 4px solid #2563EB; margin: 20px 0;">
                  <h4 style="margin: 0 0 8px 0; color: #1C2333; font-size: 16px;">🏢 {company_name} — {job_title}</h4>
                  <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Scheduled Time:</strong> {scheduled_time_str}</p>
                  <p style="margin: 8px 0 0 0; font-size: 12px; color: #2563EB; font-weight: bold;">
                    Please log into your Student Portal to Accept or Decline this interview request.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 28px;">
                  <a href="{portal_url}" style="background-color: #F06529; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
                    🚀 View & Respond on Student Portal
                  </a>
                </div>
              </div>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
                <p style="margin: 0;">CMR Institute of Technology • CampusQuant AI Placement Cell</p>
              </div>

            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, student_email, msg.as_string())
        server.quit()
        print(f"Interview request email sent successfully to student {student_email}")
        return True
    except Exception as e:
        print(f"Error sending interview request email to student {student_email}: {e}")
        return False

def send_interview_decision_to_recruiter_email(recruiter_email: str, recruiter_name: str, student_name: str, job_title: str, decision_status: str):
    """
    Sends an automated email notification to the recruiter when a student accepts or declines an interview invitation.
    """
    try:
        msg = MIMEMultipart("alternative")
        status_upper = decision_status.upper()
        msg["Subject"] = f"📢 Interview Request {status_upper}: {student_name} — {job_title}"
        msg["From"] = f"CampusQuant AI Interview Desk <{settings.SMTP_EMAIL}>"
        msg["To"] = recruiter_email

        status_color = "#16A34A" if decision_status == "Accepted" else "#DC2626"

        html_content = f"""
        <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #D6E4FF;">
              
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #EEF4FF;">
                <h2 style="color: #2563EB; margin: 0; font-size: 24px;">CampusQuant AI Placement System</h2>
                <p style="color: #5A6578; font-size: 12px; margin-top: 4px;">Student Interview Request Status Update</p>
              </div>

              <div style="padding: 24px 0;">
                <h3 style="color: #1C2333; font-size: 18px; margin-top: 0;">Hello {recruiter_name},</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                  Student candidate <strong style="color: #1C2333;">{student_name}</strong> has responded to your interview request for the position of <strong>{job_title}</strong>.
                </p>

                <div style="background-color: #F8FAFC; padding: 20px; border-radius: 16px; border-left: 4px solid {status_color}; margin: 20px 0;">
                  <h4 style="margin: 0 0 8px 0; color: {status_color}; font-size: 16px;">
                    Candidate Response: {status_upper}
                  </h4>
                  <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Student Name:</strong> {student_name}</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Job Position:</strong> {job_title}</p>
                </div>
              </div>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
                <p style="margin: 0;">CMR Institute of Technology • Placement Office</p>
              </div>

            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, recruiter_email, msg.as_string())
        server.quit()
        print(f"Interview decision email sent successfully to recruiter {recruiter_email}")
        return True
    except Exception as e:
        print(f"Error sending interview decision email to recruiter {recruiter_email}: {e}")
        return False

def send_interview_30m_reminder_email(recipient_email: str, recipient_name: str, participant_role: str, company_name: str, job_title: str, meeting_link: str):
    """
    Sends a 30-minute pre-interview reminder email to participants.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"⏰ 30-Min Reminder: Upcoming Live Interview ({company_name} - {job_title})"
        msg["From"] = f"CampusQuant AI Virtual Meeting Room <{settings.SMTP_EMAIL}>"
        msg["To"] = recipient_email

        html_content = f"""
        <html>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #FFE0CF;">
              
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #FFF0E8;">
                <h2 style="color: #F06529; margin: 0; font-size: 24px;">CampusQuant Live Meeting Alert</h2>
                <p style="color: #5A6578; font-size: 12px; margin-top: 4px;">Upcoming Interview Starts in 30 Minutes</p>
              </div>

              <div style="padding: 24px 0;">
                <h3 style="color: #1C2333; font-size: 18px; margin-top: 0;">Hello {recipient_name} ({participant_role}),</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                  Your scheduled live campus recruitment interview for <strong style="color: #F06529;">{company_name} ({job_title})</strong> is starting in <strong>30 minutes</strong>!
                </p>

                <div style="background-color: #FFF0E8; padding: 20px; border-radius: 16px; text-align: center; margin: 24px 0; border: 2px dashed #F06529;">
                  <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #1C2333;">Join Google Meet-Style Live Interview Room</p>
                  <a href="{meeting_link}" style="background-color: #F06529; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
                    🎥 Enter Virtual Meeting Room
                  </a>
                </div>
              </div>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
                <p style="margin: 0;">CampusQuant AI Virtual Meeting Room • Placement Cell</p>
              </div>

            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, recipient_email, msg.as_string())
        server.quit()
        print(f"30-min interview reminder email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending 30-min interview reminder email to {recipient_email}: {e}")
        return False

def send_application_status_update_email(recipient_email: str, recipient_name: str, company_name: str, job_title: str, new_status: str):
    subject = f"Campus Application Update: {company_name} - {new_status}"
    text_body = f"Hello {recipient_name},\n\nYour application status for {job_title} at {company_name} has been updated to '{new_status}'.\n\nPlease log in to your Student Portal to check details."
    
    status_color = "#2563EB"
    if new_status == "Shortlisted":
        status_color = "#2563EB"
    elif new_status == "Interviewing":
        status_color = "#F06529"
    elif new_status in ["Selected", "Offered"]:
        status_color = "#10B981"
    elif new_status == "Rejected":
        status_color = "#EF4444"

    html_body = f"""
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #D6E4FF;">
          <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #EEF4FF;">
            <h2 style="color: #2563EB; margin: 0;">Application Status Updated</h2>
            <p style="color: #64748B; font-size: 12px; margin-top: 4px;">Institutional Placement Cell • Official Notification</p>
          </div>
          <div style="padding: 20px 0;">
            <p style="font-size: 15px; margin-top: 0;">Hello <strong>{recipient_name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Your application for <strong style="color: #2563EB;">{job_title}</strong> at <strong>{company_name}</strong> has been updated by the recruitment team.
            </p>
            <div style="background-color: #EEF4FF; padding: 16px; border-radius: 16px; border-left: 5px solid {status_color}; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 11px; font-weight: bold; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">New Application Status</p>
              <h2 style="margin: 6px 0 0 0; color: {status_color}; font-size: 22px; font-weight: 800;">{new_status}</h2>
            </div>
            <p style="font-size: 13px; color: #64748B;">Log in to your Student Portal to view next steps or interview schedules.</p>
            <div style="text-align: center; margin-top: 24px;">
              <a href="http://localhost:5173" style="background-color: #2563EB; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
                Open Student Portal
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
    """
    return _send_smtp_email(recipient_email, subject, text_body, html_body)

def send_interview_scorecard_to_student_email(
    student_email: str, 
    student_name: str, 
    company_name: str, 
    job_title: str, 
    summary_md: str
):
    subject = f"Virtual Interview Feedback & Evaluation Scorecard: {company_name} - {job_title}"
    text_body = f"Hello {student_name},\n\nYour virtual interview session for {job_title} at {company_name} has been concluded.\n\nEvaluation Summary & Feedback:\n{summary_md}\n\nBest regards,\nPlacement Cell"
    
    clean_notes = summary_md.replace('\n', '<br/>')

    html_body = f"""
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #F4F7FC; padding: 20px; color: #1C2333;">
        <div style="max-width: 650px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #D6E4FF;">
          <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #EEF4FF;">
            <h2 style="color: #2563EB; margin: 0;">🎓 Live Interview Evaluation Report</h2>
            <p style="color: #64748B; font-size: 12px; margin-top: 4px;">Department of Placement & Corporate Relations • CMRIT</p>
          </div>
          <div style="padding: 20px 0;">
            <p style="font-size: 15px; margin-top: 0;">Dear <strong>{student_name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Your live video interview for the position of <strong style="color: #2563EB;">{job_title}</strong> with <strong>{company_name}</strong> has been concluded by the recruiter.
            </p>
            
            <div style="background-color: #F8FAFC; padding: 20px; border-radius: 16px; border: 1px solid #D6E4FF; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1E40AF; font-size: 14px; text-transform: uppercase;">📋 Official Recruiter Feedback & AI Evaluation Notes</h3>
              <div style="font-size: 13px; line-height: 1.6; color: #1E293B;">
                {clean_notes}
              </div>
            </div>

            <div style="background-color: #ECFDF5; padding: 14px; border-radius: 12px; border-left: 4px solid #10B981; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #065F46; font-size: 13px;">Meeting Status: Concluded & Finalized</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #047857;">
                This interview link is now expired and closed. Check your Student Portal dashboard for any further selection updates.
              </p>
            </div>
          </div>
          <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #94A3B8; text-align: center;">
            <p style="margin: 0;">CMR Institute of Technology • Enterprise Talent Intelligence System</p>
          </div>
        </div>
      </body>
    </html>
    """
    return _send_smtp_email(student_email, subject, text_body, html_body)
