import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 80,
          background: 'linear-gradient(135deg, #020617 0%, #1e293b 100%)',
          color: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            marginBottom: 20,
            background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Tokiflow
        </div>
        <div
          style={{
            fontSize: 36,
            opacity: 0.9,
            textAlign: 'center',
            maxWidth: '900px',
          }}
        >
          Cron & Job Monitoring with Smart Alerts
        </div>
        <div
          style={{
            fontSize: 24,
            opacity: 0.7,
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          Runtime Analytics · Slack Alerts · Anomaly Detection
        </div>
      </div>
    ),
    size
  );
}


