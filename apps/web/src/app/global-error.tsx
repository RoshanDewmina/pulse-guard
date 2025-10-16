'use client';

import { SaturnButton } from '@/components/saturn';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#F7F5F3',
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '32rem',
            width: '100%',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0px 1px 2px rgba(55,50,47,0.12)',
            border: '1px solid rgba(55,50,47,0.08)',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'rgba(220, 38, 38, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <AlertTriangle style={{ width: '2rem', height: '2rem', color: '#dc2626' }} />
            </div>
            
            <h2 style={{ 
              color: '#37322F',
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              fontFamily: "'Instrument Serif', serif"
            }}>
              Something went wrong
            </h2>
            
            <p style={{ 
              color: 'rgba(55,50,47,0.80)',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              {error.message || 'An unexpected error occurred. Please try again.'}
            </p>
            
            {error.digest && (
              <p style={{ 
                color: 'rgba(55,50,47,0.60)',
                fontSize: '0.75rem',
                marginBottom: '1.5rem',
                fontFamily: 'monospace'
              }}>
                Error ID: {error.digest}
              </p>
            )}
            
            <button
              onClick={() => reset()}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                background: '#37322F',
                color: 'white',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#49423D';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#37322F';
              }}
            >
              Try again
            </button>
            
            <p style={{
              marginTop: '1rem',
              color: 'rgba(55,50,47,0.60)',
              fontSize: '0.75rem'
            }}>
              If the problem persists, please contact support
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
