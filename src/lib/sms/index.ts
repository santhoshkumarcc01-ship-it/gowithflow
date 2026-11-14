import * as crypto from 'crypto';

export interface SmsProvider {
  sendOtp(phoneNumber: string, otp: string): Promise<void>;
}

class DevelopmentSmsProvider implements SmsProvider {
  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    console.log(`\n==================================================`);
    console.log(`[SMS-DEV] Dispatched code to ${phoneNumber}`);
    console.log(`[SMS-DEV] Cryptographic Code: ${otp}`);
    console.log(`==================================================\n`);
    return Promise.resolve();
  }
}

class Msg91SmsProvider implements SmsProvider {
  private apiKey: string;
  private senderId: string;
  private templateId: string;

  constructor() {
    this.apiKey = process.env.SMS_API_KEY || '';
    this.senderId = process.env.SMS_SENDER_ID || '';
    this.templateId = process.env.SMS_TEMPLATE_ID || '';
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Msg91 API key is not configured.');
    }

    // Call Msg91 REST endpoint
    const url = `https://api.msg91.com/api/v5/otp?template_id=${this.templateId}&mobile=${phoneNumber.replace('+', '')}&authkey=${this.apiKey}&otp=${otp}`;
    
    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`Msg91 API returned HTTP status ${response.status}`);
    }
  }
}

// Instantiate matching provider based on environment variables
export const SmsService: SmsProvider = 
  process.env.NODE_ENV === 'production' && process.env.SMS_PROVIDER === 'msg91'
    ? new Msg91SmsProvider()
    : new DevelopmentSmsProvider();
