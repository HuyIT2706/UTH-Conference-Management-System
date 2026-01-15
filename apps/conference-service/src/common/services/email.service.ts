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
      // KHÔNG throw để không làm hỏng flow chính
    }
  }

  /**
   * Gửi email thông báo khi reviewer được phân công vào track
   */
  async sendTrackAssignmentEmail(
    email: string,
    reviewerName: string,
    trackName: string,
    conferenceName: string,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';
    const appUrl =
      this.configService.get<string>('APP_BASE_URL') || 'http://localhost:5173';

    const subject = `[${appName}] Bạn đã được phân công phản biện cho chủ đề "${trackName}"`;
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
            .info-box {
              background: white;
              border: 2px solid #14b8a6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-item {
              margin: 10px 0;
              padding: 10px;
              background: #f0fdfa;
              border-left: 4px solid #14b8a6;
              border-radius: 4px;
            }
            .info-label {
              font-weight: bold;
              color: #0d9488;
            }
            .button {
              display: inline-block;
              background: #14b8a6;
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
              <p>Thông báo phân công phản biện</p>
            </div>
            <div class="content">
              <p>Xin chào <strong>${reviewerName}</strong>,</p>
              <p>Bạn đã được phân công làm phản biện cho một chủ đề trong Cuộc thi. Thông tin chi tiết:</p>
              
              <div class="info-box">
                <div class="info-item">
                  <span class="info-label">Cuộc thi:</span> ${conferenceName}
                </div>
                <div class="info-item">
                  <span class="info-label">Chủ đề:</span> ${trackName}
                </div>
              </div>

              <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết và chấp nhận/từ chối phân công này.</p>
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
    const text = `
${appName} - Thông báo phân công phản biện

Xin chào ${reviewerName},

Bạn đã được phân công làm phản biện cho một chủ đề trong Cuộc thi. Thông tin chi tiết:

Cuộc thi: ${conferenceName}
Chủ đề: ${trackName}

Vui lòng đăng nhập vào hệ thống để xem chi tiết và chấp nhận/từ chối phân công này.

Trân trọng,
Đội ngũ ${appName}
      `;

    await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Gửi email thông báo khi bài nộp được chấp nhận
   */
  async sendSubmissionAcceptedEmail(
    email: string,
    authorName: string,
    submissionTitle: string,
    conferenceName: string,
    decisionNote?: string,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';
    const appUrl =
      this.configService.get<string>('APP_BASE_URL') || 'http://localhost:5173';

    const subject = `[${appName}] Bài nộp của bạn đã được chấp nhận`;
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
            .info-item {
              margin: 10px 0;
              padding: 10px;
              background: #f0fdf4;
              border-left: 4px solid #10b981;
              border-radius: 4px;
            }
            .info-label {
              font-weight: bold;
              color: #059669;
            }
            .success-badge {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              margin: 10px 0;
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
              <h1> Chúc mừng!</h1>
              <p>Bài nộp của bạn đã được chấp nhận</p>
            </div>
            <div class="content">
              <p>Xin chào <strong>${authorName}</strong>,</p>
              <p>Chúng tôi vui mừng thông báo rằng bài nộp của bạn đã được chấp nhận!</p>
              
              <div class="info-box">
                <div class="success-badge">ĐÃ CHẤP NHẬN</div>
                <div class="info-item">
                  <span class="info-label">Cuộc thi:</span> ${conferenceName}
                </div>
                <div class="info-item">
                  <span class="info-label">Tiêu đề bài nộp:</span> ${submissionTitle}
                </div>
                ${
                  decisionNote
                    ? `
                <div class="info-item">
                  <span class="info-label">Ghi chú từ ban tổ chức:</span><br>
                  ${decisionNote.replace(/\n/g, '<br>')}
                </div>
                `
                    : ''
                }
              </div>
              <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết và thực hiện các bước tiếp theo (nếu có).</p>
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
    const text = `
              Chúc mừng! Bài nộp của bạn đã được chấp nhận

              Xin chào ${authorName},

              Chúng tôi vui mừng thông báo rằng bài nộp của bạn đã được chấp nhận!

              Cuộc thi: ${conferenceName}

              Tiêu đề bài nộp: ${submissionTitle}

              ${decisionNote ? `\nGhi chú từ ban tổ chức:\n${decisionNote}\n` : ''}


              Vui lòng đăng nhập vào hệ thống để xem chi tiết và thực hiện các bước tiếp theo (nếu có).
              Trân trọng,
              Đội ngũ ${appName}
                    `;

    await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Gửi email thông báo khi bài nộp bị từ chối
   */
  async sendSubmissionRejectedEmail(
    email: string,
    authorName: string,
    submissionTitle: string,
    conferenceName: string,
    decisionNote?: string,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') || 'UTH ConfMS';
    const appUrl =
      this.configService.get<string>('APP_BASE_URL') || 'http://localhost:5173';

    const subject = `[${appName}] Thông báo về bài nộp của bạn`;
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
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
              border: 2px solid #ef4444;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-item {
              margin: 10px 0;
              padding: 10px;
              background: #fef2f2;
              border-left: 4px solid #ef4444;
              border-radius: 4px;
            }
            .info-label {
              font-weight: bold;
              color: #dc2626;
            }
            .rejected-badge {
              display: inline-block;
              background: #ef4444;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              margin: 10px 0;
            }
            .button {
              display: inline-block;
              background: #ef4444;
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
              <h1>Thông báo về bài nộp</h1>
              <p>Kết quả đánh giá</p>
            </div>
            <div class="content">
              <p>Xin chào <strong>${authorName}</strong>,</p>
              <p>Chúng tôi rất tiếc thông báo rằng bài nộp của bạn chưa được chấp nhận trong đợt này.</p>
              
              <div class="info-box">
                <div class="rejected-badge">ĐÃ TỪ CHỐI</div>
                <div class="info-item">
                  <span class="info-label">Cuộc thi:</span> ${conferenceName}
                </div>
                <div class="info-item">
                  <span class="info-label">Tiêu đề bài nộp:</span> ${submissionTitle}
                </div>
                ${
                  decisionNote
                    ? `
                <div class="info-item">
                  <span class="info-label">Ghi chú từ ban tổ chức:</span><br>
                  ${decisionNote.replace(/\n/g, '<br>')}
                </div>
                `
                    : ''
                }
              </div>

              <p>Chúng tôi cảm ơn bạn đã tham gia và mong được gặp lại bạn trong các Cuộc thi tiếp theo.</p>
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
    const text = `
              Thông báo về bài nộp - Kết quả đánh giá

              Xin chào ${authorName},

              Chúng tôi rất tiếc thông báo rằng bài nộp của bạn chưa được chấp nhận trong đợt này.

              Cuộc thi: ${conferenceName}
              Tiêu đề bài nộp: ${submissionTitle}
              ${decisionNote ? `\nGhi chú từ ban tổ chức:\n${decisionNote}\n` : ''}

              Chúng tôi cảm ơn bạn đã tham gia và mong được gặp lại bạn trong các Cuộc thi tiếp theo.


              Trân trọng,
              Đội ngũ ${appName}
                    `;

    await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Test kết nối
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.resendApiKey) return false;
    try {
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
