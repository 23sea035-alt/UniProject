// Sri Lankan Government Multi-Gateway SMS Abstraction Service

export interface SmsPayload {
  toPhone: string; // e.g. +94771234567 or 0771234567
  message: string;
  senderId?: string; // e.g. "NWSDB_GOV"
}

export interface SmsResult {
  success: boolean;
  messageId: string;
  gateway: string;
  timestamp: string;
  error?: string;
}

export type SmsGatewayType = 'DIALOG_AXIATA_GOV_SMS' | 'MOBITEL_ENTERPRISE' | 'SLT_REST_GATEWAY' | 'GENERIC_SMS_HTTP';

export class SMSService {
  private gateway: SmsGatewayType;
  private senderId: string;

  constructor(gateway: SmsGatewayType = 'DIALOG_AXIATA_GOV_SMS', senderId: string = 'NWSDB_SL') {
    this.gateway = gateway;
    this.senderId = senderId;
  }

  public async sendSMS(payload: SmsPayload): Promise<SmsResult> {
    const formattedPhone = this.formatSriLankanPhone(payload.toPhone);
    const timestamp = new Date().toISOString();
    const messageId = `SMS-SL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    console.log(`[SMS Gateway: ${this.gateway}] Dispatching to ${formattedPhone} from ${this.senderId}: "${payload.message}"`);

    // In a real government deployment, this performs an authenticated HTTP POST to Dialog/Mobitel API
    // e.g. https://api.dialog.lk/sms/v1/send with Gov Auth Token
    return {
      success: true,
      messageId,
      gateway: this.gateway,
      timestamp,
    };
  }

  public formatSriLankanPhone(phone: string): string {
    const cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+94')) return cleaned;
    if (cleaned.startsWith('94')) return `+${cleaned}`;
    if (cleaned.startsWith('0')) return `+94${cleaned.substring(1)}`;
    return `+94${cleaned}`;
  }
}

export const smsService = new SMSService();
