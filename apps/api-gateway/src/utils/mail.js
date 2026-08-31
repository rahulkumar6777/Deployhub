import nodemailer from "nodemailer";
import { ENV } from "../lib/env.js";

export const ALERT_EMAIL = ENV.EMAIL_HOST;

export const transporter = nodemailer.createTransport({
  host: ENV.EMAIL_HOST,
  port: Number(ENV.EMAIL_PORT),
  secure: true,
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
});

export const sendServiceHealthAlert = async ({ serviceName, status, url, error, checkedAt }) => {
  const statusUpper = status.toUpperCase();
  const isUp = status === 'up';
  const isDegraded = status === 'degraded';

  const statusColor = isUp ? '#27500A' : isDegraded ? '#633806' : '#791F1F';
  const statusBg = isUp ? '#EAF3DE' : isDegraded ? '#FAEEDA' : '#FCEBEB';
  const statusBorder = isUp ? '#639922' : isDegraded ? '#BA7517' : '#E24B4A';

  const plainText = [
    `${serviceName} is ${statusUpper}`,
    `Service URL: ${url}`,
    `Checked At: ${checkedAt.toISOString()}`,
    error ? `Error: ${error}` : null,
  ].filter(Boolean).join('\n');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e2e0d8;overflow:hidden;">

        <tr>
          <td style="padding:20px 28px;border-bottom:1px solid #e2e0d8;">
            <span style="font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#888780;">
              DeployHub Gateway
            </span>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 28px 20px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:14px;vertical-align:top;padding-top:2px;">
                  <div style="width:10px;height:10px;border-radius:50%;background:${statusBorder};margin-top:4px;"></div>
                </td>
                <td>
                  <p style="margin:0 0 4px;font-size:20px;font-weight:600;color:#2C2C2A;">${serviceName}</p>
                  <span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;background:${statusBg};color:${statusColor};border:1px solid ${statusBorder};">
                    ${statusUpper}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 28px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;border-radius:6px;border:1px solid #e2e0d8;">
              <tr>
                <td style="padding:14px 16px;">
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding-bottom:10px;">
                        <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.07em;color:#888780;font-weight:500;">Service URL</span><br>
                        <a href="${url}" style="font-size:13px;color:#185FA5;text-decoration:none;font-family:'Courier New',monospace;">${url}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top:10px;border-top:1px solid #e2e0d8;">
                        <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.07em;color:#888780;font-weight:500;">Checked at</span><br>
                        <span style="font-size:13px;color:#444441;font-family:'Courier New',monospace;">${checkedAt.toISOString()}</span>
                      </td>
                    </tr>
                    ${error ? `
                    <tr>
                      <td style="padding-top:10px;border-top:1px solid #e2e0d8;">
                        <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.07em;color:#888780;font-weight:500;">Error</span><br>
                        <span style="font-size:13px;color:#A32D2D;font-family:'Courier New',monospace;">${error}</span>
                      </td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 28px;border-top:1px solid #e2e0d8;background:#f5f5f4;">
            <span style="font-size:12px;color:#888780;">Sent by DeployHub Gateway &mdash; automated alert</span>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"DeployHub Gateway" <${ENV.EMAIL_USER}>`,
    to: ALERT_EMAIL,
    subject: `[DeployHub] ${serviceName} is ${statusUpper}`,
    text: plainText,
    html,
  });
};
