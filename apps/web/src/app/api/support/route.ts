import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

interface SupportRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SupportRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (body.name.length > 100) {
      return NextResponse.json(
        { error: 'Name is too long' },
        { status: 400 }
      );
    }

    if (body.subject.length > 200) {
      return NextResponse.json(
        { error: 'Subject is too long' },
        { status: 400 }
      );
    }

    if (body.message.length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long' },
        { status: 400 }
      );
    }

    // Generate HTML email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #37322F; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-row { display: flex; justify-content: flex-start; margin: 15px 0; padding: 15px; background: #fff; border-radius: 4px; border-left: 4px solid #37322F; }
    .info-label { font-weight: 600; color: #666; min-width: 80px; }
    .info-value { color: #333; word-break: break-word; }
    .message-box { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; white-space: pre-wrap; word-break: break-word; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 New Support Request</h1>
    </div>
    
    <div class="content">
      <div class="info-row">
        <span class="info-label">From:</span>
        <span class="info-value">${body.name}</span>
      </div>

      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value"><a href="mailto:${body.email}" style="color: #37322F;">${body.email}</a></span>
      </div>

      <div class="info-row">
        <span class="info-label">Subject:</span>
        <span class="info-value">${body.subject}</span>
      </div>

      <div class="message-box">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #666;">Message:</p>
        <div style="color: #333;">${body.message}</div>
      </div>

      <div class="footer">
        <p>This message was sent via the Saturn support form</p>
        <p>Reply directly to ${body.email} to respond</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send email
    await sendEmail({
      to: 'support@saturnmonitor.com',
      subject: `Support Request: ${body.subject}`,
      html: emailHtml,
    });

    return NextResponse.json(
      { message: 'Support request sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Support form error:', error);
    return NextResponse.json(
      { error: 'Failed to send support request. Please try again later.' },
      { status: 500 }
    );
  }
}

