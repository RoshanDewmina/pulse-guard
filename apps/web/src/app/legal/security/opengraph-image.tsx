import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Privacy Policy - Saturn Cron Monitoring';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #F7F5F3 0%, #E8E5E2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(55, 50, 47, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(55, 50, 47, 0.05) 0%, transparent 50%)',
          }}
        />
        
        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            maxWidth: '1000px',
            padding: '40px',
            zIndex: 1,
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#37322F',
              marginBottom: '20px',
              letterSpacing: '-0.02em',
            }}
          >
            Saturn
          </div>
          
          {/* Title */}
          <div
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#37322F',
              marginBottom: '24px',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Privacy Policy
          </div>
          
          {/* Subtitle */}
          <div
            style={{
              fontSize: '32px',
              color: '#605A57',
              marginBottom: '40px',
              lineHeight: 1.3,
              maxWidth: '800px',
            }}
          >
            How we collect, use, and protect your data with transparency and security
          </div>
          
          {/* Privacy Features */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #37322F 0%, #49423D 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold',
                }}
              >
                🔒
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: '#37322F',
                  fontWeight: '600',
                }}
              >
                Data Security
              </div>
            </div>
            
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #37322F 0%, #49423D 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold',
                }}
              >
                🛡️
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: '#37322F',
                  fontWeight: '600',
                }}
              >
                GDPR Compliant
              </div>
            </div>
            
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #37322F 0%, #49423D 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold',
                }}
              >
                🔍
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: '#37322F',
                  fontWeight: '600',
                }}
              >
                Transparency
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            fontSize: '20px',
            color: '#847971',
            fontWeight: '500',
          }}
        >
          saturnmonitor.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
