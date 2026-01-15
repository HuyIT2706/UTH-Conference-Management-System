import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class EmailService {
  private readonly resendApiKey: string;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY') || '';
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') ||
      'UTH ConfMS <noreply@example.com>';

    if (!this.resendApiKey) {
      console.warn(
        '[EmailService] RESEND_API_KEY is not set. Emails will NOT be sent.',
      );
    } else {
      console.log(
        `[EmailService] Using Resend HTTP API. From: ${this.fromEmail}`,
      );
    }
  }

  private async sendEmail(params: SendEmailParams): Promise<void> {
    if (!this.resendApiKey) {
      console.error('[EmailService] Missing RESEND_API_KEY, skip sending');
      return;
    }

    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: this.fromEmail,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
        },
        {
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      console.log(
        `[EmailService] Email sent to ${params.to}. Id: ${response.data?.id}`,
      );
    } catch (error: any) {
      console.error('[EmailService] Failed to send email via Resend:', {
        to: params.to,
        message: error?.message,
        response: error?.response?.data,
      });
      // KHÔNG throw để không làm hỏng flow chính (forgot password, verify, ...)
    }
  }

  /**
   * Gửi email reset password code
   */
  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const appName =
      this.configService.get<string>('APP_NAME') || 'UTH ConfMS';
    const appUrl =
      this.configService.get<string>('APP_BASE_URL') ||
      'http://localhost:5173';

    const subject = `[${appName}] Mã xác nhận đặt lại mật khẩu`;
    const html = `
      <p>Xin chào,</p>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
      <p>Mã xác nhận của bạn là: <strong>${code}</strong></p>
      <p>Mã có hiệu lực trong <strong>15 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      <p>Trân trọng,<br/>Đội ngũ ${appName}</p>
    `;
    const text = `${appName} - Đặt lại mật khẩu\n\nMã xác nhận: ${code}\nMã có hiệu lực trong 15 phút.`;

    await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Gửi email verification với mã 6 số
   */
  async sendVerificationEmail(
    email: string,
    code: string,
    fullName?: string,
  ): Promise<void> {
    const appName =
      this.configService.get<string>('APP_NAME') || 'UTH ConfMS';

    const subject = `[${appName}] Mã xác minh email của bạn`;
    const html = `
      <p>Xin chào ${fullName || 'bạn'},</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại ${appName}.</p>
      <p>Mã xác minh của bạn là: <strong>${code}</strong></p>
      <p>Mã có hiệu lực trong <strong>15 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
      <p>Trân trọng,<br/>Đội ngũ ${appName}</p>
    `;
    const text = `${appName} - Xác minh email\n\nMã xác minh: ${code}\nMã có hiệu lực trong 15 phút.`;

    await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Test kết nối (gọi từ đâu đó nếu cần)
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.resendApiKey) return false;
    try {
      // Gửi 1 request giả (không cần thật sự gửi mail)
      await axios.get('https://api.resend.com', {
        headers: { Authorization: `Bearer ${this.resendApiKey}` },
        timeout: 5000,
      });
      console.log('[EmailService] Resend API reachable.');
      return true;
    } catch (error) {
      console.error('[EmailService] Resend API NOT reachable:', error);
      return false;
    }
  }
}

