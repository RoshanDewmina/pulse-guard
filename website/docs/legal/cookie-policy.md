---
title: Cookie Policy
description: How Saturn uses cookies and similar technologies. Transparent disclosure of tracking technologies for compliance and user privacy.
slug: cookies
keywords: [cookies, tracking, browser storage, privacy, GDPR, cookie consent, local storage]
canonical: https://saturn.io/legal/cookies
lastReviewed: 2025-10-16
---

# Cookie Policy

**Last Updated:** October 16, 2025

This Cookie Policy explains how Saturn, Inc. ("Saturn", "we", "us", or "our") uses cookies and similar technologies on our website and web application (collectively, the "Services").

## 1. What Are Cookies?

Cookies are small text files stored on your device (computer, tablet, or mobile) when you visit a website. They allow the website to recognize your device and remember information about your visit, such as your preferences or login state.

### Types of Cookies

- **Session cookies**: Temporary cookies deleted when you close your browser
- **Persistent cookies**: Remain on your device for a set period or until you delete them
- **First-party cookies**: Set by Saturn directly
- **Third-party cookies**: Set by external services (e.g., analytics providers)

## 2. Why We Use Cookies

We use cookies to:

- **Authenticate you**: Keep you logged in as you navigate the application
- **Protect your account**: Prevent cross-site request forgery (CSRF) attacks
- **Remember your preferences**: Language, timezone, theme settings
- **Analyze usage**: Understand how you use our Services to improve them (if analytics enabled)
- **Provide customer support**: Debug issues when you report problems

## 3. Cookies We Use

### 3.1 Strictly Necessary Cookies

These cookies are essential for the Services to function. You cannot opt out of these cookies without disabling core functionality.

| Cookie Name | Purpose | Duration | Type |
|-------------|---------|----------|------|
| `next-auth.session-token` | Stores your login session (JWT token) | 7 days | Session |
| `__Host-next-auth.csrf-token` | Protects against CSRF attacks | Session | Security |
| `next-auth.callback-url` | Stores redirect URL after login | Session | Functional |
| `next-auth.pkce.code_verifier` | OAuth PKCE flow for CLI device auth | 10 minutes | Security |

**Security Features**:
- `httpOnly`: Cannot be accessed by JavaScript (protects against XSS)
- `secure`: Only transmitted over HTTPS
- `SameSite=Lax`: Prevents some cross-site attacks

**Technical Implementation**: Managed by NextAuth v5 authentication library.

### 3.2 Functional Cookies

These cookies enhance your experience but are not strictly necessary. They remember your preferences and settings.

| Cookie Name | Purpose | Duration | Opt-Out |
|-------------|---------|----------|---------|
| `saturn_theme` | Remembers dark/light mode preference | 1 year | Yes (via browser settings) |
| `saturn_timezone` | Stores your timezone for cron schedule display | 1 year | Yes (via browser settings) |
| `saturn_org_last` | Remembers your last active organization | 30 days | Yes (via browser settings) |

**Opt-Out**: You can delete these cookies via your browser settings. The Services will still work, but you'll need to re-configure preferences.

### 3.3 Analytics Cookies (Optional)

<!-- TODO: Specify if Saturn uses analytics (PostHog, Google Analytics, Plausible, or none) -->

We may use analytics cookies to understand how users interact with the Services. This helps us identify bugs, improve features, and prioritize development.

**Analytics Provider**: <!-- TODO: Specify provider, e.g., "PostHog (privacy-first analytics)" or "None - we do not use analytics cookies" -->

**Cookies Used** (if applicable):

| Cookie Name | Purpose | Duration | Third-Party |
|-------------|---------|----------|-------------|
| <!-- TODO: List analytics cookies --> | | | |

**Data Collected** (if applicable):
- Pages visited, time on page, navigation paths
- Device type, browser, operating system
- Referrer URL (how you arrived at Saturn)
- Anonymous user ID (not linked to your email or identity)

**Opt-Out**: <!-- TODO: Specify opt-out mechanism, e.g., "Settings → Privacy → Disable Analytics" or "We use Plausible, which doesn't require consent banners" -->

### 3.4 Marketing Cookies

**We do NOT use marketing or advertising cookies.** Saturn does not:

- Serve targeted advertisements
- Share data with ad networks
- Track you across other websites (no third-party tracking pixels)
- Sell your data to marketers

## 4. Local Storage & Similar Technologies

In addition to cookies, we use **browser local storage** and **session storage** to:

| Storage Key | Purpose | Duration | Type |
|-------------|---------|----------|------|
| `saturn_draft_monitor_{id}` | Auto-save monitor configurations as you type | Until saved or tab closed | Local Storage |
| `saturn_ui_preferences` | UI state (sidebar collapsed, table column widths) | Persistent | Local Storage |
| `saturn_cli_device_code` | Temporary device code during CLI authentication | 10 minutes | Session Storage |

**Local storage** persists until you clear browser data. **Session storage** is deleted when you close the tab.

## 5. Managing Cookies

You have control over cookies and can manage or delete them at any time.

### 5.1 Browser Settings

All modern browsers allow you to:

- **Block cookies entirely**: Services may not work properly
- **Delete existing cookies**: Clears all stored cookies from your device
- **View cookies**: See what cookies are stored and their values
- **Block third-party cookies**: Recommended for privacy (does not affect Saturn's functionality)

**How to Manage Cookies**:

- **Chrome**: Settings → Privacy and Security → Cookies and other site data
- **Firefox**: Settings → Privacy & Security → Cookies and Site Data
- **Safari**: Preferences → Privacy → Manage Website Data
- **Edge**: Settings → Cookies and site permissions → Manage and delete cookies

**Mobile Browsers**: Check your browser's help section for mobile cookie management.

### 5.2 Saturn-Specific Controls

<!-- TODO: If Saturn implements cookie consent banner or preference center, describe it here -->

Currently, we do not display a cookie consent banner because:

- **Strictly necessary cookies** do not require consent under GDPR/ePrivacy
- **We do not use analytics/marketing cookies** (if true; otherwise, specify consent mechanism)

If you are in the EEA/UK and we add analytics cookies in the future, we will implement a consent banner before setting non-essential cookies.

### 5.3 Do Not Track (DNT)

"Do Not Track" is a browser setting that signals your preference not to be tracked. However, there is no industry standard for honoring DNT signals.

**Saturn's Position**: <!-- TODO: Specify DNT handling, e.g., "We honor DNT signals and disable analytics if DNT=1" or "We do not currently use tracking technologies that DNT affects" -->

## 6. Cookies Set by Third-Party Services

When you use certain features, third-party services may set their own cookies:

### 6.1 Stripe (Payment Processing)

When you visit billing pages or checkout, **Stripe** may set cookies for:

- Fraud detection and prevention
- Payment form security (PCI compliance)
- Session management during checkout

**Stripe's Cookie Policy**: https://stripe.com/cookies-policy

**Opt-Out**: You cannot opt out of Stripe cookies if you use paid plans (they're required for secure payment processing).

### 6.2 Google Fonts (Optional)

<!-- TODO: Specify if Saturn uses Google Fonts (which can set cookies) or self-hosts fonts -->

If we use Google Fonts, Google may set cookies to track font requests. **Alternative**: We may self-host fonts to avoid third-party cookies.

### 6.3 Sentry (Error Tracking)

Our error tracking service, **Sentry**, may set cookies to:

- Track error sessions
- Correlate errors with specific user actions

**Sentry's Cookie Policy**: https://sentry.io/trust/privacy/

**Data Collected**: Error messages, stack traces, user ID (for support purposes). No PII like passwords or payment data is sent to Sentry.

## 7. Cookies for Integrations

When you connect integrations (Slack, Discord), those platforms may set cookies on **their own domains**, not on Saturn:

- **Slack OAuth**: Slack sets cookies on `slack.com` during authorization
- **Discord webhooks**: Discord sets cookies on `discord.com` (we only send data to Discord; they don't set cookies on Saturn)

**You control these via the third-party platform's settings**, not via Saturn.

## 8. Cookies in Email

We use **Resend** to send transactional emails (alerts, password resets, billing notifications). These emails do NOT contain tracking pixels or cookies.

**Email Links**: Links in emails may include a token (e.g., magic link authentication) that identifies the email. This token is single-use and expires after 15 minutes.

## 9. GDPR & ePrivacy Compliance

### 9.1 Legal Basis

We rely on the following legal bases for cookies:

- **Strictly necessary cookies**: Exempted from consent requirements under GDPR Art. 6(1)(f) and ePrivacy Directive Art. 5(3)
- **Functional cookies**: Legitimate interest (GDPR Art. 6(1)(f)) with easy opt-out
- **Analytics cookies**: Consent (GDPR Art. 6(1)(a)) <!-- TODO: Or specify "not used" if no analytics -->

### 9.2 Your Rights

Under GDPR, you have the right to:

- **Withdraw consent**: If you've consented to analytics cookies, withdraw anytime via Settings (if applicable)
- **Access cookie data**: Request information about what cookies we set
- **Object to processing**: Object to use of cookies for purposes other than strictly necessary functionality

Contact legal@saturn.io to exercise these rights.

## 10. CCPA Compliance (California Residents)

**We do NOT sell personal information collected via cookies.** Cookies are used solely to operate the Services and improve user experience.

**CCPA Rights**: California residents may request disclosure of cookies set in the last 12 months. Email legal@saturn.io with "CCPA Cookie Request".

## 11. Updates to This Policy

We may update this Cookie Policy when:

- We add new cookies or similar technologies
- We change analytics providers
- Cookie regulations change
- Our Services evolve

**Notification**: Material changes will be announced via email and a prominent notice in the application. The "Last Updated" date at the top will reflect changes.

## 12. Cookie List Changes

As we develop new features, cookies may be added or removed. This Cookie Policy is reviewed quarterly to ensure accuracy.

**Last Review Date**: October 16, 2025

**Next Review Date**: January 16, 2026

## 13. Contact Us

Questions about cookies or this policy?

- **Email**: support@saturn.io
- **Privacy inquiries**: legal@saturn.io
- **GDPR Data Protection Officer**: <!-- TODO: Add DPO email if required -->

To request deletion of cookies stored on your device, use your browser's cookie management tools (we cannot delete cookies remotely).

---

**Related Documents**:
- [Privacy Policy](/legal/privacy)
- [Terms of Service](/legal/terms)
- [Security Overview](/legal/security)

---

**Last Updated**: October 16, 2025



