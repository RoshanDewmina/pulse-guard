# ADR-004: Status Pages Architecture

**Date**: 2025-10-16  
**Status**: Accepted  
**Deciders**: Engineering Team  
**Related**: PR6 - Status Pages & Custom Domains

## Context

Users need a way to communicate service health to their customers transparently. A public-facing status page is essential for:
- Proactive communication during incidents
- Building user trust through transparency
- Reducing support load during outages
- SEO and public accountability

## Decision

We will implement a comprehensive status page system with the following architecture:

### 1. **Data Model**
```prisma
model StatusPage {
  id            String   @id @default(cuid())
  orgId         String
  slug          String   @unique
  title         String
  isPublic      Boolean  @default(true)
  customDomain  String?
  accessToken   String   // For private pages
  components    Json     // Array of {id, name, description, monitorIds[]}
  theme         Json     // {primaryColor, backgroundColor, textColor, logoUrl}
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 2. **Rendering Strategy: ISR (Incremental Static Regeneration)**
- Use Next.js 15 ISR with 60-second revalidation
- Benefits:
  - Fast page loads (static HTML)
  - Fresh data (revalidates every 60s)
  - CDN-friendly
  - SEO-optimized
  - Handles traffic spikes gracefully

### 3. **Component Architecture**
Components are logical groupings of monitors displayed on the status page:
- Each component tracks multiple monitors
- Calculates aggregate status (operational/degraded/outage)
- Shows 90-day uptime history as visual bars
- Status determined by worst monitor state

### 4. **Status Calculation Logic**
```typescript
operational: All monitors OK
degraded: Any monitor LATE or DEGRADED
outage: Any monitor FAILING or MISSED
maintenance: Manually set maintenance mode
```

### 5. **Custom Domains**
Users can host status pages on their own domains (e.g., `status.company.com`):
- **Verification Method**: DNS CNAME or TXT record
  - CNAME: `status.company.com` → `status.saturn.co`
  - TXT: `saturn-verification={statusPageId}`
- **Implementation**: 
  - API endpoint `/api/status-pages/[id]/verify-domain` checks DNS
  - Stores verification status in database
  - Next.js middleware handles custom domain routing

### 6. **Theme Customization**
Users can customize:
- Primary color (branding)
- Background color
- Text color
- Logo URL

### 7. **Security Considerations**
- **Public pages**: No authentication, but rate-limited
- **Private pages**: Require access token in URL or cookie
- **XSS Protection**: All user input (titles, descriptions) sanitized
- **CSRF Protection**: API mutations require authentication

### 8. **Performance Optimizations**
- Static generation with ISR (60s revalidation)
- Minimal client-side JavaScript
- Optimized uptime bar rendering (90 small divs)
- Database queries optimized with proper indexing

## Alternatives Considered

### 1. **Server-Side Rendering (SSR) on Every Request**
**Rejected**: Would not scale, high database load, slow page loads.

### 2. **Client-Side Rendering (SPA)**
**Rejected**: Poor SEO, slow initial load, not ideal for public status pages.

### 3. **Static Site Generation (SSG) Only**
**Rejected**: Would require rebuild/deploy for every status change, not real-time enough.

### 4. **Real-time WebSocket Updates**
**Rejected**: Overkill for status pages, 60s staleness acceptable, adds complexity.

## Consequences

### Positive
✅ Fast, scalable status pages  
✅ SEO-friendly for public discovery  
✅ Custom domain support enhances branding  
✅ ISR provides good balance of performance and freshness  
✅ Component-based organization is intuitive  
✅ Theme customization allows brand consistency

### Negative
⚠️ 60-second staleness (acceptable trade-off)  
⚠️ Custom domain setup requires DNS knowledge  
⚠️ ISR cache warming on first request (minor delay)

### Neutral
🔹 Requires users to configure DNS for custom domains  
🔹 90-day uptime bars limit granularity (by design)

## Implementation Notes

### Database Queries
```sql
-- Efficient query for status page with 90-day data
SELECT * FROM "StatusPage"
WHERE slug = $1
INCLUDE monitors (
  WHERE status != 'DISABLED'
  INCLUDE runs (
    WHERE startedAt >= NOW() - INTERVAL '90 days'
    ORDER BY startedAt DESC
    LIMIT 90 per monitor
  )
)
```

### Custom Domain Verification Example
```typescript
// User sets customDomain = 'status.acme.com'
// Vercel requires CNAME: status.acme.com -> cname.saturn.co
// Or TXT record: saturn-verification=cuid1234567890

const verified = await dns.resolveCname('status.acme.com');
// Returns ['cname.saturn.co'] if configured correctly
```

### ISR Configuration
```typescript
// In app/status/[slug]/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds
export const dynamic = 'force-static'; // Enable ISR
```

## Future Enhancements

1. **Incident Updates**: Allow posting updates to ongoing incidents on status page
2. **Maintenance Scheduling**: Proactively schedule maintenance windows
3. **Subscription System**: Email/SMS subscriptions for status updates
4. **Historical Metrics**: Expand beyond 90 days
5. **Custom Components**: Allow richer component types (graphs, metrics)
6. **Multi-language Support**: Internationalization for global services
7. **Status Page Analytics**: Track visitor metrics

## References

- [Next.js ISR Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Status Page Best Practices](https://www.atlassian.com/incident-management/kpis/status-page)
- [DNS CNAME Records](https://www.cloudflare.com/learning/dns/dns-records/dns-cname-record/)

