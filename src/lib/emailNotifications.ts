import { supabase } from './supabase';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  type: 'contact_request' | 'contact_response' | 'notification';
}

export async function sendEmailNotification(params: EmailParams): Promise<void> {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification-email`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('Failed to send email notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}
