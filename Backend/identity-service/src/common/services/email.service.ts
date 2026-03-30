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
    }
  }

  /**
   * Gửi email reset password code
   */
  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';
    const appUrl =
      this.configService.get<string>('APP_BASE_URL') || 'http://localhost:5173';

    const subject = `[${appName}] Mã xác nhận đặt lại mật khẩu`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .info-box {
              background: white;
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .code-box {
              display: inline-block;
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 20px 40px;
              margin: 20px 0;
              font-size: 32px;
              font-weight: bold;
              color: #d97706;
              letter-spacing: 8px;
            }
            .info-item {
              margin: 10px 0;
              padding: 10px;
              background: #fffbeb;
              border-left: 4px solid #f59e0b;
              border-radius: 4px;
            }
            .info-label {
              font-weight: bold;
              color: #d97706;
            }
            .button {
              display: inline-block;
              background: #f59e0b;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <p>Đặt lại mật khẩu</p>
            </div>
            <div class="content">
              <p>Xin chào,</p>
              <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
              
              <div class="info-box">
                <p style="margin: 0 0 10px 0; color: #d97706; font-weight: bold;">Mã xác nhận của bạn:</p>
                <div class="code-box">${code}</div>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Mã có hiệu lực trong <strong>15 phút</strong></p>
              </div>

              <div class="info-item">
                <span class="info-label">⚠️ Lưu ý:</span> Không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
              </div>

              <p>Trân trọng,<br>Đội ngũ ${appName}</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời email này.</p>
              <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
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
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';

    const subject = `[${appName}] Mã xác minh email của bạn`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .info-box {
              background: white;
              border: 2px solid #3b82f6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .code-box {
              display: inline-block;
              background: #dbeafe;
              border: 2px solid #3b82f6;
              border-radius: 8px;
              padding: 20px 40px;
              margin: 20px 0;
              font-size: 32px;
              font-weight: bold;
              color: #2563eb;
              letter-spacing: 8px;
            }
            .info-item {
              margin: 10px 0;
              padding: 10px;
              background: #eff6ff;
              border-left: 4px solid #3b82f6;
              border-radius: 4px;
            }
            .info-label {
              font-weight: bold;
              color: #2563eb;
            }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <p>Xác minh email</p>
            </div>
            <div class="content">
              <p>Xin chào <strong>${fullName || 'bạn'}</strong>,</p>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại ${appName}.</p>
              
              <div class="info-box">
                <p style="margin: 0 0 10px 0; color: #2563eb; font-weight: bold;">Mã xác minh của bạn:</p>
                <div class="code-box">${code}</div>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Mã có hiệu lực trong <strong>15 phút</strong></p>
              </div>

              <div class="info-item">
                <span class="info-label">🔒 Bảo mật:</span> Không chia sẻ mã này với bất kỳ ai. Đội ngũ ${appName} sẽ không bao giờ yêu cầu bạn cung cấp mã này.
              </div>

              <p>Vui lòng nhập mã này vào trang xác minh để hoàn tất đăng ký tài khoản.</p>
              <p>Trân trọng,<br>Đội ngũ ${appName}</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời email này.</p>
              <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    const text = `${appName} - Xác minh email\n\nMã xác minh: ${code}\nMã có hiệu lực trong 15 phút.`;

    await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Gửi email thông báo tài khoản đã được tạo (Admin tạo tài khoản)
   */
  async sendAccountCreatedNotification(
    email: string,
    password: string,
    fullName?: string,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';
    const appUrl =
      this.configService.get<string>('APP_BASE_URL') || 'http://localhost:5173';

    const subject = `[${appName}] Tài khoản của bạn đã được tạo`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .info-box {
              background: white;
              border: 2px solid #10b981;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .credential-item {
              margin: 15px 0;
              padding: 15px;
              background: #f0fdf4;
              border-left: 4px solid #10b981;
              border-radius: 4px;
            }
            .credential-label {
              font-weight: bold;
              color: #059669;
              margin-bottom: 5px;
            }
            .credential-value {
              font-family: 'Courier New', monospace;
              font-size: 16px;
              color: #065f46;
              background: white;
              padding: 10px;
              border-radius: 4px;
              border: 1px solid #d1fae5;
            }
            .info-item {
              margin: 10px 0;
              padding: 10px;
              background: #ecfdf5;
              border-left: 4px solid #10b981;
              border-radius: 4px;
            }
            .info-label {
              font-weight: bold;
              color: #059669;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <p>Tài khoản của bạn đã được tạo</p>
            </div>
            <div class="content">
              <p>Xin chào <strong>${fullName || 'bạn'}</strong>,</p>
              <p>Tài khoản của bạn đã được tạo thành công bởi quản trị viên. Dưới đây là thông tin đăng nhập của bạn:</p>
              
              <div class="info-box">
                <div class="credential-item">
                  <div class="credential-label"> Tên đăng nhập (Email):</div>
                  <div class="credential-value">${email}</div>
                </div>
                <div class="credential-item">
                  <div class="credential-label"> Mật khẩu:</div>
                  <div class="credential-value">${password}</div>
                </div>
              </div>

              <div class="info-item">
                <span class="info-label"> Lưu ý quan trọng:</span> Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu để bảo mật tài khoản của bạn.
              </div>

              <p style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/login" class="button">Đăng nhập ngay</a>
              </p>

              <p>Trân trọng,<br>Đội ngũ ${appName}</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời email này.</p>
              <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    const text = `${appName} - Tài khoản của bạn đã được tạo\n\nTên đăng nhập: ${email}\nMật khẩu: ${password}\n\nVui lòng đăng nhập tại: ${appUrl}/login`;

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
