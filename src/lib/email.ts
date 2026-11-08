// Email sending disabled per user instruction ("Remove sending me emails altogether")

export interface EmailResult {
  success: boolean;
  disabled?: boolean;
  error?: string;
  data?: any;
}

export async function sendReportEmail(params: {
  title: string;
  artist: string;
  downloadUrl: string;
  stemId: string;
}): Promise<EmailResult> {
  console.log('[Email Disabled] Stem report logged:', params.title, 'by', params.artist);
  return { success: true, disabled: true };
}

export async function sendBugReportEmail(params: {
  contactInfo: string;
  description: string;
  userHandle?: string;
}): Promise<EmailResult> {
  console.log('[Email Disabled] Bug report logged from', params.contactInfo, ':', params.description);
  return { success: true, disabled: true };
}
