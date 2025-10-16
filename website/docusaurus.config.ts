import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {SATURN_CONFIG} from './src/config/constants';

const config: Config = {
  title: SATURN_CONFIG.PRODUCT_NAME,
  tagline: SATURN_CONFIG.TAGLINE,
  favicon: 'img/favicon.ico',

  url: SATURN_CONFIG.DOCS_URL,
  baseUrl: '/',

  organizationName: 'saturn',
  projectName: 'saturn-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/saturn/saturn/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
    [
      'redocusaurus',
      {
        specs: [
          {
            spec: 'static/openapi.yaml',
            route: '/api/reference',
          },
        ],
        theme: {
          primaryColor: '#1890ff',
        },
      },
    ],
  ],

  themeConfig: {
    image: 'img/saturn-og.png',
    navbar: {
      title: SATURN_CONFIG.PRODUCT_NAME,
      logo: {
        alt: 'Saturn Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/api/reference',
          position: 'left',
          label: 'API',
        },
        {
          href: SATURN_CONFIG.STATUS_URL,
          label: 'Status',
          position: 'right',
        },
        {
          href: `https://github.com/${SATURN_CONFIG.SOCIAL.GITHUB}`,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Get Started',
              to: '/get-started/overview',
            },
            {
              label: 'Kubernetes',
              to: '/kubernetes/sidecar',
            },
            {
              label: 'WordPress',
              to: '/wordpress/install',
            },
            {
              label: 'API Reference',
              to: '/api/reference',
            },
          ],
        },
        {
          title: 'Product',
          items: [
            {
              label: 'Pricing',
              href: `${SATURN_CONFIG.BASE_URL}/pricing`,
            },
            {
              label: 'Status',
              href: SATURN_CONFIG.STATUS_URL,
            },
            {
              label: 'Changelog',
              to: '/changelog',
            },
            {
              label: 'Roadmap',
              to: '/roadmap',
            },
          ],
        },
        {
          title: 'Legal',
          items: [
            {
              label: 'Privacy Policy',
              to: SATURN_CONFIG.PRIVACY_URL,
            },
            {
              label: 'Terms of Service',
              to: SATURN_CONFIG.TERMS_URL,
            },
            {
              label: 'DPA',
              to: SATURN_CONFIG.DPA_URL,
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: `https://github.com/${SATURN_CONFIG.SOCIAL.GITHUB}`,
            },
            {
              label: 'Twitter',
              href: `https://twitter.com/${SATURN_CONFIG.SOCIAL.TWITTER.replace('@', '')}`,
            },
            {
              label: 'Contact',
              to: SATURN_CONFIG.CONTACT_URL,
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ${SATURN_CONFIG.PRODUCT_NAME}. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'typescript', 'javascript', 'go', 'php'],
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    metadata: [
      {name: 'keywords', content: 'cron monitoring, kubernetes cronjob, wp-cron, anomaly detection, job monitoring, MTTR, MTBF'},
      {name: 'description', content: SATURN_CONFIG.ONE_LINER},
      {property: 'og:type', content: 'website'},
      {property: 'og:description', content: SATURN_CONFIG.ONE_LINER},
      {name: 'twitter:card', content: 'summary_large_image'},
      {name: 'twitter:description', content: SATURN_CONFIG.ONE_LINER},
    ],
  } satisfies Preset.ThemeConfig,

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],
};

export default config;

