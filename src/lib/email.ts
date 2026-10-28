import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || 'dummy_key_for_build';
export const resend = new Resend(resendApiKey);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stem-vault-tau.vercel.app';
const PHYSICAL_MAILING_ADDRESS = 'The Mixing Vault, P.O. Box 412, Nashville, TN 37203, United States';

function getEmailFooterHtml() {
  return `
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #27272a; font-size: 11px; color: #71717a; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <p style="margin: 0 0 6px 0;"><strong>The Mixing Vault</strong> • Tyler Kerpsack All Access</p>
      <p style="margin: 0 0 6px 0;">Physical Address: ${PHYSICAL_MAILING_ADDRESS}</p>
      <p style="margin: 0;">
        You are receiving this operational transmission because of activity on The Mixing Vault. 
        <a href="${SITE_URL}/unsubscribe" style="color: #ffffff; text-decoration: underline;" target="_blank">Manage Email Preferences / Unsubscribe</a>
      </p>
    </div>
  `;
}

export async function sendReportEmail({
  title,
  artist,
  downloadUrl,
  stemId,
}: {
  title: string;
  artist: string;
  downloadUrl: string;
  stemId: string;
}) {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'connorwbrown07@gmail.com',
      subject: `🚨 Stem Vault Report: "${title}" by ${artist}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; background-color: #121212; color: #e4e4e7; border-radius: 8px;">
          <h2 style="color: #ffffff; margin-top: 0;">Dead / Restricted Link Reported</h2>
          <p>A community member reported an issue with a multitrack session on <strong>The Mixing Vault</strong>.</p>
          
          <div style="background-color: #18181b; border: 1px solid #27272a; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 4px 0;"><strong>Song:</strong> ${title}</p>
            <p style="margin: 4px 0;"><strong>Artist:</strong> ${artist}</p>
            <p style="margin: 4px 0;"><strong>Stem ID:</strong> ${stemId}</p>
            <p style="margin: 4px 0;"><strong>Cloud Link:</strong> <a href="${downloadUrl}" style="color: #ffffff; text-decoration: underline;" target="_blank">${downloadUrl}</a></p>
          </div>

          <p style="font-size: 12px; color: #a1a1aa;">Review this session in the Discord channel or manage links in the admin database.</p>
          ${getEmailFooterHtml()}
        </div>
      `,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend Error]', error);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
}

export async function sendBugReportEmail({
  contactInfo,
  description,
  userHandle,
}: {
  contactInfo: string;
  description: string;
  userHandle?: string;
}) {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'connorwbrown07@gmail.com',
      subject: `Feedback from ${contactInfo}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; background-color: #121212; color: #e4e4e7; border-radius: 8px;">
          <h2 style="color: #ffffff; margin-top: 0;">New Feedback / Bug Report</h2>
          <p>A member submitted feedback for <strong>The Mixing Vault</strong>.</p>
          
          <div style="background-color: #18181b; border: 1px solid #27272a; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 4px 0;"><strong>Contact Info:</strong> ${contactInfo}</p>
            <p style="margin: 4px 0;"><strong>Member:</strong> ${userHandle || 'Guest'}</p>
            <p style="margin: 12px 0 4px 0;"><strong>Details:</strong></p>
            <div style="background-color: #0d0d0e; padding: 10px; border-radius: 4px; border: 1px solid #27272a; white-space: pre-wrap;">${description}</div>
          </div>

          <p style="font-size: 12px; color: #a1a1aa;">Tyler Kerpsack All Access Notification System.</p>
          ${getEmailFooterHtml()}
        </div>
      `,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend Bug Report Error]', error);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
}
