import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    // Port 465 (SSL/TLS) is preferred over 587 (STARTTLS) for better reliability on Render/cloud
    // Port 465: Secure from the start, faster, less timeout issues
    // Port 587: Requires handshake upgrade, often blocked/slowed by firewalls
    const smtpPort = Number(this.configService.get<string>('SMTP_PORT')) || 465;
    const smtpUser = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('EMAIL_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD') || this.configService.get<string>('EMAIL_PASS');
    const smtpFrom = this.configService.get<string>('SMTP_FROM') || smtpUser;

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // SSL/TLS from start for port 465
      auth: smtpUser && smtpPassword ? {
        user: smtpUser,
        pass: smtpPassword,
      } : undefined,
      // QUAN TRỌNG: Bỏ qua lỗi chứng chỉ (nếu có)
      tls: {
        rejectUnauthorized: false,
      },
      // QUAN TRỌNG: Ép dùng IPv4 (tránh lỗi IPv6 của Docker/Render)
      family: 4,
    } as any);
    
    console.log(`[EmailService] SMTP transporter initialized - Host: ${smtpHost}, Port: ${smtpPort}, Secure: ${smtpPort === 465}, IPv4: true`);
  }

  /**
   * Gửi email reset password code
   */
  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    console.log(`[EmailService] Preparing to send password reset code to: ${email}`);
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';
    const appUrl = this.configService.get<string>('APP_BASE_URL') || 'http://localhost:5173';

    const smtpFrom = this.configService.get<string>('SMTP_FROM') || 
            this.configService.get<string>('SMTP_USER') || 
            this.configService.get<string>('EMAIL_USER');
    
    console.log(`[EmailService] SMTP Config - From: ${smtpFrom}, Host: ${this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com'}`);

    const mailOptions = {
      from: smtpFrom,
      to: email,
      subject: `[${appName}] Mã xác nhận đặt lại mật khẩu`,
      html: `
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
              background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
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
            .code-box {
              background: white;
              border: 2px solid #14b8a6;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #14b8a6;
              letter-spacing: 5px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
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
              <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng sử dụng mã xác nhận sau:</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Mã xác nhận của bạn:</p>
                <div class="code">${code}</div>
              </div>

              <div class="warning">
                <strong> Lưu ý:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Mã này chỉ có hiệu lực trong <strong>15 phút</strong></li>
                  <li>Không chia sẻ mã này với bất kỳ ai</li>
                  <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                </ul>
              </div>

              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
              
              <p>Trân trọng,<br>Đội ngũ ${appName}</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động, vui lòng không trả lời email này.</p>
              <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
${appName} - Đặt lại mật khẩu

Xin chào,

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng sử dụng mã xác nhận sau:

Mã xác nhận: ${code}

⚠️ Lưu ý:
- Mã này chỉ có hiệu lực trong 15 phút
- Không chia sẻ mã này với bất kỳ ai
- Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này

Trân trọng,
Đội ngũ ${appName}
      `,
    };

    try {
      console.log(`[EmailService] Sending password reset email to: ${email}`);
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Password reset email sent successfully! MessageId: ${result.messageId}`);
      console.log(`[EmailService] Email response:`, result.response);
    } catch (error: any) {
      console.error(`[EmailService] Failed to send password reset email to ${email}:`, error);
      console.error(`[EmailService] Error code:`, error.code);
      console.error(`[EmailService] Error command:`, error.command);
      console.error(`[EmailService] Error response:`, error.response);
      console.error(`[EmailService] Error stack:`, error.stack);
      throw new Error(`Failed to send password reset email to ${email}: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Gửi email verification với mã 6 số
   */
  async sendVerificationEmail(email: string, code: string, fullName?: string): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 
            this.configService.get<string>('SMTP_USER') || 
            this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: `[${appName}] Mã xác minh email của bạn`,
      html: `
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
              background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
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
            .code-box {
              background: white;
              border: 2px solid #14b8a6;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #14b8a6;
              letter-spacing: 5px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
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
              <p>Xin chào ${fullName || 'bạn'},</p>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại ${appName}. Vui lòng sử dụng mã xác minh sau:</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Mã xác minh của bạn:</p>
                <div class="code">${code}</div>
              </div>

              <div class="warning">
                <strong>⚠️ Lưu ý:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Mã này chỉ có hiệu lực trong <strong>15 phút</strong></li>
                  <li>Không chia sẻ mã này với bất kỳ ai</li>
                  <li>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này</li>
                </ul>
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
      `,
      text: `
${appName} - Xác minh email

Xin chào ${fullName || 'bạn'},

Cảm ơn bạn đã đăng ký tài khoản tại ${appName}. Vui lòng sử dụng mã xác minh sau:

Mã xác minh: ${code}

⚠️ Lưu ý:
- Mã này chỉ có hiệu lực trong 15 phút
- Không chia sẻ mã này với bất kỳ ai
- Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này

Trân trọng,
Đội ngũ ${appName}
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Failed to send verification email to ${email}`);
    }
  }

  /**
   * Test email connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email connection verified successfully.');
      return true;
    } catch (error) {
      console.error('Email connection verification failed:', error);
      return false;
    }
  }
}

