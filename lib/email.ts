import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Tervix <onboarding@resend.dev>';

// Track sent reminders to prevent duplicates (in-memory, use DB for production)
const sentReminders = new Set<string>();

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email - Mock]', { to, subject });
    return true;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    return true;
  } catch (error) {
    console.error('[Email Error]', error);
    return false;
  }
}

export async function sendBookingConfirmation(
  to: string,
  name: string,
  date: string,
  startTime: string
): Promise<void> {
  const formattedTime = formatTime(startTime);
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; background: #0b1326; color: #dae2fd; padding: 32px; border-radius: 16px;">
      <div style="margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #c0c1ff;">Tervix</h1>
        <p style="margin: 4px 0 0; font-size: 12px; color: #c7c4d8; text-transform: uppercase; letter-spacing: 0.1em;">Mock Interviews</p>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #dae2fd;">Interview Scheduled ✅</h2>
      <p style="color: #c7c4d8; margin: 0 0 24px;">Hi ${name}, your mock interview has been booked successfully.</p>
      <div style="background: #171f33; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid rgba(70,69,85,0.3);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
          <span style="color: #c7c4d8; font-size: 13px;">Date</span>
          <span style="color: #dae2fd; font-weight: 600; font-size: 13px;">${date}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #c7c4d8; font-size: 13px;">Time</span>
          <span style="color: #c0c1ff; font-weight: 700; font-size: 13px;">${formattedTime}</span>
        </div>
      </div>
      <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: block; text-align: center; padding: 12px; background: linear-gradient(135deg, #c0c1ff, #4b4dd8); border-radius: 10px; color: #1000a9; font-weight: 700; text-decoration: none; font-size: 14px;">
        Go to Dashboard →
      </a>
      <p style="text-align: center; margin-top: 20px; font-size: 11px; color: rgba(199,196,216,0.4);">Tervix · Peer Mock Interviews</p>
    </div>
  `;
  // Send async, don't block
  sendEmail(to, 'Interview Scheduled – Tervix', html).catch(console.error);
}

export async function sendInterviewReminder(
  to: string,
  name: string,
  startTime: string,
  interviewId: string
): Promise<void> {
  // Prevent duplicate reminders
  if (sentReminders.has(interviewId)) return;
  sentReminders.add(interviewId);

  const formattedTime = formatTime(startTime);
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; background: #0b1326; color: #dae2fd; padding: 32px; border-radius: 16px;">
      <div style="margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #c0c1ff;">Tervix</h1>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #ffb695;">⏰ Interview Starting Soon</h2>
      <p style="color: #c7c4d8; margin: 0 0 24px;">Hi ${name}, your interview starts in <strong style="color: #ffb695;">15 minutes</strong>.</p>
      <div style="background: #171f33; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0; color: #dae2fd; font-weight: 600;">Starting at: <span style="color: #c0c1ff;">${formattedTime}</span></p>
      </div>
      <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: block; text-align: center; padding: 12px; background: linear-gradient(135deg, #c0c1ff, #4b4dd8); border-radius: 10px; color: #1000a9; font-weight: 700; text-decoration: none; font-size: 14px;">
        Join Interview Room →
      </a>
    </div>
  `;
  sendEmail(to, '⏰ Interview in 15 minutes – Tervix', html).catch(console.error);
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(); d.setHours(h, m);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
