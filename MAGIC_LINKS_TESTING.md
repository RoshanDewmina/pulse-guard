# Magic Links Testing Guide

## Overview

Magic links authentication has been implemented and tested for Tokiflow. This allows users to sign in via email without needing a password.

## What Was Fixed

### 1. **Email Sending Integration** (`apps/web/src/lib/auth.ts`)
   - Integrated Resend API for actual email delivery
   - Added beautiful HTML email template with gradient branding
   - Fallback to console logging when RESEND_API_KEY is not configured
   - Proper error handling and logging

### 2. **Sign-In UI** (`apps/web/src/app/auth/signin/page.tsx`)
   - Added "Sign in with magic link instead" option
   - Implemented magic link request form
   - Added success state showing "Check your email" message
   - Smooth transitions between password and magic link modes

### 3. **Bug Fixes**
   - Fixed typo in home page (`page.tsx` line 22)
   - Fixed TypeScript build errors in `jest.setup.ts`
   - Excluded scripts directory from TypeScript compilation

## Testing Results

### Automated Tests ✅

All automated tests pass successfully:

```bash
# Basic functionality test
./test-magic-links.sh

# End-to-end flow test
./test-magic-links-e2e.sh
```

**Test Coverage:**
- ✅ Sign-in page loads correctly
- ✅ Verify-request page loads correctly
- ✅ Email provider is configured in NextAuth
- ✅ CSRF protection works
- ✅ Magic link request endpoint works
- ✅ Database integration works
- ✅ Magic link callback endpoint works

### Manual Testing

#### Without RESEND_API_KEY (Development Mode)

1. Go to http://localhost:3000/auth/signin
2. Click "Sign in with magic link instead"
3. Enter your email address
4. Click "Send Magic Link"
5. Check the server console for output like:
   ```
   🔗 Magic Link for user@example.com
   📧 Sign in URL: http://localhost:3000/api/auth/callback/email?token=...
   ⚠️  RESEND_API_KEY not configured - magic link only logged to console
   ```
6. Copy the URL from console and open it in your browser
7. You should be signed in and redirected to `/app`

#### With RESEND_API_KEY (Production Mode)

1. Set `RESEND_API_KEY` in `.env.local`:
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=noreply@tokiflow.co
   ```

2. Restart the dev server:
   ```bash
   cd apps/web
   bun run dev
   ```

3. Follow the same steps as above
4. Check the server console for:
   ```
   🔗 Magic Link for user@example.com
   📧 Sign in URL: http://localhost:3000/api/auth/callback/email?token=...
   ✅ Magic link email sent successfully to user@example.com
   ```

5. Check your email inbox for the magic link email
6. Click the "Sign in to Tokiflow" button in the email
7. You should be signed in and redirected to `/app`

## Email Template

The magic link email includes:
- **Branded header** with gradient background and Tokiflow logo
- **Clear call-to-action** button with gradient styling [[memory:6652314]]
- **Expiration notice** (24 hours)
- **Security notice** about ignoring if not requested
- **Fallback URL** in plain text for email clients that block buttons
- **Professional footer** with copyright

## Architecture

### Flow Diagram

```
User enters email
       ↓
NextAuth EmailProvider
       ↓
sendVerificationRequest()
       ↓
    ┌──────┴──────┐
    ↓             ↓
Console Log   Resend API
    ↓             ↓
Dev Testing   Production Email
    ↓             ↓
    └──────┬──────┘
           ↓
Verification Token
created in database
           ↓
User clicks link
           ↓
NextAuth callback
           ↓
User authenticated
```

### Key Files

1. **`apps/web/src/lib/auth.ts`**
   - NextAuth configuration
   - EmailProvider with sendVerificationRequest
   - Resend integration

2. **`apps/web/src/app/auth/signin/page.tsx`**
   - Sign-in UI
   - Magic link request form
   - State management for different views

3. **`apps/web/src/app/auth/verify-request/page.tsx`**
   - Success page shown after requesting magic link
   - Instructions for user

## Configuration

### Environment Variables

```bash
# Required for NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# Required for magic links
DATABASE_URL=postgresql://...

# Optional - for actual email sending
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@tokiflow.co
```

### NextAuth Configuration

```typescript
EmailProvider({
  from: process.env.EMAIL_FROM || 'noreply@tokiflow.co',
  sendVerificationRequest: async ({ identifier, url, provider }) => {
    // Always log for debugging
    console.log('Magic Link for', identifier);
    console.log('Sign in URL:', url);
    
    // Send email if configured
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({ /* ... */ });
    }
  },
})
```

## Security Features

1. **CSRF Protection**: All requests require valid CSRF token
2. **Token Expiration**: Magic links expire after 24 hours
3. **One-time Use**: Verification tokens are consumed after use
4. **Secure Storage**: Tokens hashed in database
5. **Email Verification**: Only sent to provided email address

## Troubleshooting

### Issue: Magic link email not received

**Solutions:**
1. Check server console for the magic link URL (development mode)
2. Verify RESEND_API_KEY is set correctly
3. Check email spam folder
4. Verify EMAIL_FROM domain is verified in Resend

### Issue: "Invalid or expired token" error

**Solutions:**
1. Magic links expire after 24 hours
2. Each magic link can only be used once
3. Request a new magic link

### Issue: 500 error on signin page

**Solutions:**
1. Restart the dev server
2. Check database is running: `docker compose ps`
3. Verify DATABASE_URL is correct
4. Check server logs for specific error

## Production Checklist

Before deploying magic links to production:

- [ ] Set RESEND_API_KEY environment variable
- [ ] Verify EMAIL_FROM domain in Resend dashboard
- [ ] Set NEXTAUTH_SECRET to a secure random value
- [ ] Set NEXTAUTH_URL to production domain
- [ ] Test magic links with multiple email providers (Gmail, Outlook, etc.)
- [ ] Verify email deliverability (check spam scores)
- [ ] Set up email monitoring in Resend dashboard
- [ ] Configure rate limiting for magic link requests
- [ ] Test expired token handling
- [ ] Verify mobile email client rendering

## Future Enhancements

Possible improvements for the future:

1. **Rate Limiting**: Limit magic link requests per email/IP
2. **Custom Expiration**: Allow configuring token expiration time
3. **Email Customization**: Allow users to customize email template
4. **Analytics**: Track magic link usage and success rates
5. **Multi-language**: Support for different languages in emails
6. **SMS Magic Links**: Alternative to email
7. **QR Codes**: Generate QR codes for magic links

## Support

For issues or questions:
- Check the server console logs
- Run the test scripts: `./test-magic-links.sh` or `./test-magic-links-e2e.sh`
- Review NextAuth documentation: https://next-auth.js.org/providers/email
- Review Resend documentation: https://resend.com/docs

## Conclusion

Magic links are now fully functional in Tokiflow! Users can sign in securely without passwords, and the implementation includes both development-friendly console logging and production-ready email delivery via Resend.

