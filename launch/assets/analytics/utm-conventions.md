# UTM Parameter Conventions for Saturn

Standardized UTM parameter guidelines for all marketing campaigns, links, and integrations.

## Format

```
https://saturn.example.com/[page]?utm_source=[source]&utm_medium=[medium]&utm_campaign=[campaign]&utm_content=[content]&utm_term=[term]
```

## Parameters

### utm_source (required)

**What**: Where the traffic comes from

**Examples**:
- `product-hunt`
- `show-hn`
- `google-ads`
- `linkedin`
- `twitter`
- `github`
- `artifact-hub`
- `wordpress-org`
- `slack-app-directory`
- `cronitor-alt` (comparison page)
- `healthchecks-alt` (comparison page)
- `newsletter`
- `reddit`
- `youtube`

**Rules**:
- Lowercase, hyphenated
- Specific platform, not generic (use `linkedin` not `social`)
- Persistent (don't change `product-hunt` to `ph` later)

---

### utm_medium (required)

**What**: The marketing medium/channel type

**Examples**:
- `cpc` — Cost per click (paid ads)
- `display` — Display ads
- `social` — Organic social posts
- `email` — Email campaigns
- `referral` — Partner/affiliate referrals
- `content` — Blog posts, guides
- `launch-post` — Launch announcements
- `comparison` — Comparison pages
- `docs` — Documentation links
- `in-app` — In-product notifications

**Rules**:
- Standard categories (don't invent new ones without reason)
- Describes the channel type, not the source

---

### utm_campaign (required)

**What**: Specific campaign or initiative

**Examples**:
- `2025-10-launch` — October 2025 launch week
- `kubernetes-q4-2025` — Q4 Kubernetes campaign
- `wordpress-agency-outreach` — WordPress agency focus
- `black-friday-2025` — Black Friday promotion
- `anomaly-detection-series` — Content series
- `free-tier-expansion` — Free tier announcement

**Format**: `[topic]-[time-period]` or `[event]-[year]`

**Rules**:
- Lowercase, hyphenated
- Include year or quarter for time-bound campaigns
- Descriptive and unique

---

### utm_content (optional)

**What**: Differentiates similar content/links within the same campaign

**Examples**:
- `hero-cta` — Hero section CTA button
- `nav-cta` — Navigation bar CTA
- `feature-anomaly` — Anomaly detection feature section
- `comparison-table` — Comparison table CTA
- `pricing-card-pro` — Pro tier pricing card
- `footer-signup` — Footer signup link
- `sidebar-cta` — Sidebar call-to-action
- `banner-top` — Top banner
- `exit-intent-modal` — Exit intent popup

**Rules**:
- Use to A/B test different CTAs
- Descriptive of the link location or content

---

### utm_term (optional, rare)

**What**: Paid search keywords (primarily for Google Ads)

**Examples**:
- `kubernetes+cron+monitoring`
- `wp-cron+monitor`
- `cronitor+alternative`

**Rules**:
- Only use for paid search campaigns
- Matches ad group keywords

---

## Campaign Examples

### Product Hunt Launch

```
# Launch day post
https://saturn.example.com/signup?utm_source=product-hunt&utm_medium=launch-post&utm_campaign=2025-10-launch&utm_content=hero-cta

# Comments reply
https://saturn.example.com/signup?utm_source=product-hunt&utm_medium=launch-post&utm_campaign=2025-10-launch&utm_content=comment-reply
```

---

### Show HN Post

```
# Post body
https://saturn.example.com/signup?utm_source=show-hn&utm_medium=launch-post&utm_campaign=2025-10-launch&utm_content=post-body

# Comment reply
https://docs.saturn.example.com?utm_source=show-hn&utm_medium=launch-post&utm_campaign=2025-10-launch&utm_content=comment-docs
```

---

### Google Ads

```
# Kubernetes campaign
https://saturn.example.com/kubernetes/cronjob-monitoring?utm_source=google-ads&utm_medium=cpc&utm_campaign=kubernetes-q4-2025&utm_term=kubernetes+cron+monitoring

# WordPress campaign
https://saturn.example.com/wordpress/wp-cron-monitoring?utm_source=google-ads&utm_medium=cpc&utm_campaign=wordpress-agency-outreach&utm_term=wp-cron+monitoring
```

---

### LinkedIn Organic

```
# Launch post
https://saturn.example.com/signup?utm_source=linkedin&utm_medium=social&utm_campaign=2025-10-launch&utm_content=launch-post

# Article share
https://saturn.example.com?utm_source=linkedin&utm_medium=social&utm_campaign=anomaly-detection-series&utm_content=article-1
```

---

### Comparison Pages

```
# Cronitor alternative page
https://saturn.example.com/signup?utm_source=cronitor-alt&utm_medium=comparison&utm_campaign=competitor-seo&utm_content=hero-cta

# Healthchecks alternative
https://saturn.example.com/signup?utm_source=healthchecks-alt&utm_medium=comparison&utm_campaign=competitor-seo&utm_content=pricing-table
```

---

### Email Campaigns

```
# Welcome email
https://saturn.example.com/dashboard?utm_source=newsletter&utm_medium=email&utm_campaign=welcome-series&utm_content=email-1-cta

# Weekly digest
https://docs.saturn.example.com/anomalies/overview?utm_source=newsletter&utm_medium=email&utm_campaign=weekly-digest&utm_content=feature-highlight
```

---

### Artifact Hub

```
# Chart listing
https://saturn.example.com?utm_source=artifact-hub&utm_medium=referral&utm_campaign=helm-chart-listing&utm_content=chart-home-link

# README
https://docs.saturn.example.com/kubernetes/sidecar?utm_source=artifact-hub&utm_medium=referral&utm_campaign=helm-chart-listing&utm_content=readme-docs
```

---

### WordPress.org Plugin Directory

```
# Plugin page
https://saturn.example.com?utm_source=wordpress-org&utm_medium=referral&utm_campaign=plugin-listing&utm_content=plugin-home-link

# Screenshots
https://saturn.example.com/signup?utm_source=wordpress-org&utm_medium=referral&utm_campaign=plugin-listing&utm_content=screenshot-cta
```

---

### Slack App Directory

```
# App listing
https://saturn.example.com?utm_source=slack-app-directory&utm_medium=referral&utm_campaign=slack-listing&utm_content=app-home

# OAuth redirect
https://saturn.example.com/integrations/slack?utm_source=slack-app-directory&utm_medium=referral&utm_campaign=slack-listing&utm_content=oauth-redirect
```

---

## Link Shortening

For social media (especially Twitter with character limits):

**Original**:
```
https://saturn.example.com/signup?utm_source=twitter&utm_medium=social&utm_campaign=2025-10-launch&utm_content=launch-tweet
```

**Shortened** (via Bitly or custom domain):
```
https://saturn.link/ph-launch
```

**Redirect**: Short link → full URL with UTM params

**Best practice**: Use short links for social, full URLs for documentation/email.

---

## Implementation

### React Component

```typescript
import { useSearchParams } from 'next/navigation';

export function SignupButton() {
  const searchParams = useSearchParams();
  
  const buildSignupUrl = () => {
    const params = new URLSearchParams({
      utm_source: searchParams.get('utm_source') || 'direct',
      utm_medium: searchParams.get('utm_medium') || 'none',
      utm_campaign: searchParams.get('utm_campaign') || 'organic',
      utm_content: 'signup-button'
    });
    
    return `/signup?${params.toString()}`;
  };
  
  return <Link href={buildSignupUrl()}>Sign Up</Link>;
}
```

---

### Server-Side Tracking

```typescript
// On signup, capture UTM params
export async function POST(request: Request) {
  const { email, password } = await request.json();
  const url = new URL(request.url);
  
  const utmParams = {
    utmSource: url.searchParams.get('utm_source'),
    utmMedium: url.searchParams.get('utm_medium'),
    utmCampaign: url.searchParams.get('utm_campaign'),
    utmContent: url.searchParams.get('utm_content'),
    utmTerm: url.searchParams.get('utm_term'),
  };
  
  // Store in user record
  const user = await createUser({
    email,
    password,
    ...utmParams,
  });
  
  // Track with PostHog
  posthog.capture('Signup', {
    userId: user.id,
    email: user.email,
    ...utmParams,
  });
}
```

---

## Validation

### Check UTM Parameters

Use this bookmarklet to validate UTM params on any Saturn link:

```javascript
javascript:(function(){
  const url = new URL(window.location.href);
  const params = {
    source: url.searchParams.get('utm_source'),
    medium: url.searchParams.get('utm_medium'),
    campaign: url.searchParams.get('utm_campaign'),
    content: url.searchParams.get('utm_content'),
    term: url.searchParams.get('utm_term')
  };
  alert(JSON.stringify(params, null, 2));
})();
```

---

## Campaign Tracking Spreadsheet

Maintain a spreadsheet with all active campaigns:

| Campaign | Start Date | End Date | Source | Medium | UTM Campaign | Target URL | Owner |
|----------|-----------|----------|--------|--------|--------------|------------|-------|
| Product Hunt Launch | 2025-10-15 | 2025-10-15 | product-hunt | launch-post | 2025-10-launch | /signup | Marketing |
| Kubernetes Q4 | 2025-10-01 | 2025-12-31 | google-ads | cpc | kubernetes-q4-2025 | /kubernetes | Growth |

---

## Common Mistakes to Avoid

### ❌ Don't

```
utm_source=social (too generic)
utm_source=ProductHunt (inconsistent casing)
utm_campaign=launch (not unique/time-bound)
utm_content=cta1 (not descriptive)
```

### ✅ Do

```
utm_source=linkedin
utm_source=product-hunt
utm_campaign=2025-10-launch
utm_content=hero-cta-primary
```

---

## Testing

Before launching campaigns:

1. **Click the link** — Verify redirect works
2. **Check analytics** — Ensure UTM params captured
3. **Verify attribution** — Check user record includes params
4. **Test variations** — A/B test different content values

---

## Reporting

### Dashboard Metrics

- **Top sources**: Which utm_source drives most signups?
- **Best campaigns**: Which utm_campaign has highest conversion?
- **CTA performance**: Which utm_content converts best?
- **Cost per acquisition**: UTM + ad spend → CPA

### Monthly Review

1. Analyze conversion by source/medium/campaign
2. Identify best-performing channels
3. Double down on winners, cut losers
4. Update campaign spreadsheet

---

## Reference

- [Google Analytics UTM Guide](https://support.google.com/analytics/answer/1033863)
- [UTM Builder Tool](https://ga-dev-tools.google/campaign-url-builder/)

---

**Owner**: Marketing team  
**Last updated**: 2025-10-15  
**Review frequency**: Quarterly

