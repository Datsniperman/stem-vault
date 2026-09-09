import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY!;
export const resend = new Resend(resendApiKey);

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
        <div style="font-family: sans-serif; padding: 20px; background-color: #08090B; color: #E8E4DE; border-radius: 8px;">
          <h2 style="color: #00E5FF; margin-top: 0;">🚨 Dead / Restricted Link Reported</h2>
          <p>A user reported a stem link on <strong>Stem Vault</strong>.</p>
          
          <div style="background-color: #111215; border: 1px solid #23252B; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 4px 0;"><strong>Song:</strong> ${title}</p>
            <p style="margin: 4px 0;"><strong>Artist:</strong> ${artist}</p>
            <p style="margin: 4px 0;"><strong>Stem ID:</strong> ${stemId}</p>
            <p style="margin: 4px 0;"><strong>Cloud Link:</strong> <a href="${downloadUrl}" style="color: #00E5FF;" target="_blank">${downloadUrl}</a></p>
          </div>

          <p style="font-size: 12px; color: #9A9690;">Log into your Stem Vault Admin Panel to review or remove this submission.</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend Error]', error);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
}
