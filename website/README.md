# Saturn Documentation

Comprehensive documentation for Saturn - cron and scheduled job monitoring with anomaly detection.

## Local Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- Node.js >= 18.0 (fallback)

### Quick Start

\`\`\`bash
# Install dependencies
cd website
bun install

# Start development server
bun start

# Open http://localhost:3000
\`\`\`

### Build

\`\`\`bash
# Production build
bun run build

# Serve build locally
bun run serve
\`\`\`

### Type Checking

\`\`\`bash
bun run typecheck
\`\`\`

## Project Structure

\`\`\`
website/
├── docs/                    # MDX documentation files
│   ├── get-started/        # Getting started guides
│   ├── monitors/           # Monitor configuration
│   ├── incidents/          # Incident management
│   ├── anomalies/          # Anomaly detection
│   ├── analytics/          # Analytics & metrics
│   ├── alerts/             # Alert channels
│   ├── kubernetes/         # Kubernetes integration
│   ├── wordpress/          # WordPress plugin
│   ├── cli/                # CLI documentation
│   └── ...                 # Other sections
├── src/
│   ├── config/             # Configuration constants
│   ├── components/         # Custom React components
│   └── css/                # Custom styles
├── static/
│   ├── img/                # Images and logos
│   ├── openapi.yaml        # API specification
│   └── robots.txt          # SEO robots file
├── docusaurus.config.ts    # Docusaurus configuration
├── sidebars.ts             # Sidebar navigation
└── package.json
\`\`\`

## Configuration

### Update Constants

Edit \`src/config/constants.ts\` to update:
- Product name and branding
- API endpoints
- Social media links
- Analytics keys

**Note**: All placeholder URLs are marked with `TODO` comments.

### Sidebar Navigation

Edit \`sidebars.ts\` to modify navigation structure.

### Theme Customization

Edit \`src/css/custom.css\` for custom styling.

## Writing Documentation

### Creating a New Page

1. Create MDX file in appropriate directory:
   \`\`\`bash
   touch docs/category/my-page.mdx
   \`\`\`

2. Add frontmatter:
   \`\`\`mdx
   ---
   id: my-page
   title: My Page Title
   description: Brief description for SEO
   keywords: [keyword1, keyword2, keyword3]
   ---
   \`\`\`

3. Add to sidebar in \`sidebars.ts\`

### Markdown Features

Saturn docs support:

- **MDX**: JSX in Markdown
- **Mermaid**: Diagrams with \`\`\`mermaid
- **Admonitions**: :::info, :::tip, :::warning, :::danger
- **Code blocks**: With syntax highlighting
- **Tabs**: For multi-language examples

### Code Examples

\`\`\`bash
# Use descriptive language labels
curl -X POST https://api.saturn.example.com/api/ping/<MONITOR_ID>/success
\`\`\`

### Admonitions

\`\`\`markdown
:::tip Pro Tip
This is a helpful tip for users.
:::

:::warning Important
This is important information.
:::
\`\`\`

## OpenAPI Specification

The API reference is generated from \`static/openapi.yaml\`.

### Validate OpenAPI

\`\`\`bash
npx @redocly/cli lint static/openapi.yaml
\`\`\`

### Update API Docs

1. Edit \`static/openapi.yaml\`
2. Rebuild docs
3. API reference page updates automatically

## SEO & Metadata

### Per-Page SEO

Each page should have:
- Unique \`title\`
- Descriptive \`description\` (150-160 chars)
- Relevant \`keywords\` (5-10)

### Global SEO

Configured in \`docusaurus.config.ts\`:
- Site metadata
- Open Graph tags
- Twitter cards
- JSON-LD structured data

### Sitemap

Automatically generated at \`/sitemap.xml\` on build.

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Set build settings:
   - **Build Command**: \`cd website && bun install && bun run build\`
   - **Output Directory**: \`website/build\`
   - **Install Command**: \`bun install\`
3. Deploy

### Netlify

\`\`\`toml
# netlify.toml
[build]
  base = "website"
  command = "bun install && bun run build"
  publish = "build"
\`\`\`

### GitHub Pages

\`\`\`bash
# Build and deploy
cd website
GIT_USER=<YOUR_USERNAME> bun run deploy
\`\`\`

## Contributing

### Documentation Style Guide

1. **Tone**: Technical but friendly, active voice
2. **Structure**: Start with outcome, then how, then details
3. **Code**: Always provide runnable, copy-paste examples
4. **Placeholders**: Use \`<VARIABLE>\` format (e.g., \`<MONITOR_ID>\`)
5. **Links**: Use relative links for internal pages
6. **Images**: Optimize before adding (< 200 KB)

### Before Submitting

- [ ] Spell check (\`cspell\`)
- [ ] Link check (all links work)
- [ ] Build succeeds (\`bun run build\`)
- [ ] Preview locally (\`bun start\`)
- [ ] Screenshots updated (if visual changes)

### Pull Request Process

1. Create feature branch
2. Make changes
3. Test locally
4. Submit PR with description
5. CI will run checks automatically
6. Address any feedback
7. Merge after approval

## CI/CD

### GitHub Actions

Two workflows run automatically:

1. **docs.yml**: Build, typecheck, spell-check, link-check
2. **marketing_assets.yml**: Validate launch assets

### Local Validation

Run checks locally before pushing:

\`\`\`bash
# Type check
bun run typecheck

# Spell check (requires cspell globally)
npx cspell "docs/**/*.mdx"

# Link check (requires lychee)
lychee docs/**/*.mdx

# OpenAPI validation
npx @redocly/cli lint static/openapi.yaml
\`\`\`

## Troubleshooting

### Build Fails

\`\`\`bash
# Clear cache and rebuild
rm -rf .docusaurus build node_modules
bun install
bun run build
\`\`\`

### Search Not Working

Local search plugin requires a full build:

\`\`\`bash
bun run build
bun run serve
\`\`\`

### Mermaid Diagrams Not Rendering

Ensure \`@docusaurus/theme-mermaid\` is installed and configured in \`docusaurus.config.ts\`.

## Support

- **Documentation Issues**: Open an issue in the repo
- **Product Support**: support@saturn.example.com
- **Feature Requests**: feedback@saturn.example.com

## License

Documentation is © Saturn. Code examples are MIT licensed.

