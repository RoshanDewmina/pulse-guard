import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Get Started',
      collapsed: false,
      items: [
        'get-started/overview',
        'get-started/choose-your-path',
        'get-started/quickstart-kubernetes',
        'get-started/quickstart-wordpress',
        'get-started/quickstart-linux-cron',
        'get-started/quickstart-ci',
      ],
    },
    {
      type: 'category',
      label: 'Monitors',
      items: [
        'monitors/types',
        'monitors/pings',
        'monitors/grace-periods',
        'monitors/tokens-rbac',
      ],
    },
    {
      type: 'category',
      label: 'Incidents',
      items: [
        'incidents/types',
        'incidents/lifecycle',
        'incidents/maintenance-windows',
      ],
    },
    {
      type: 'category',
      label: 'Anomalies',
      items: [
        'anomalies/overview',
        'anomalies/rules',
        'anomalies/welford',
        'anomalies/tuning',
      ],
    },
    {
      type: 'category',
      label: 'Analytics',
      items: [
        'analytics/health-score',
        'analytics/uptime-sla',
        'analytics/mtbf-mttr',
        'analytics/percentiles',
      ],
    },
    {
      type: 'category',
      label: 'Alerts',
      items: [
        'alerts/email',
        'alerts/slack',
        'alerts/discord',
        'alerts/webhooks',
      ],
    },
    {
      type: 'category',
      label: 'Kubernetes',
      items: [
        'kubernetes/sidecar',
        'kubernetes/helm-values',
        'kubernetes/examples',
      ],
    },
    {
      type: 'category',
      label: 'WordPress',
      items: [
        'wordpress/install',
        'wordpress/bulk-agency',
        'wordpress/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'CLI',
      items: [
        'cli/install',
        'cli/reference',
        'cli/pulse-run',
      ],
    },
    {
      type: 'doc',
      id: 'maintenance-windows/index',
      label: 'Maintenance Windows',
    },
    {
      type: 'doc',
      id: 'output-capture/overview',
      label: 'Output Capture',
    },
    {
      type: 'category',
      label: 'Security',
      items: [
        'security/overview',
        'security/redaction',
      ],
    },
    {
      type: 'category',
      label: 'Billing',
      items: [
        'billing/plans',
        'billing/usage-enforcement',
      ],
    },
    {
      type: 'doc',
      id: 'faq/index',
      label: 'FAQ',
    },
    {
      type: 'doc',
      id: 'changelog/index',
      label: 'Changelog',
    },
    {
      type: 'doc',
      id: 'roadmap/index',
      label: 'Roadmap',
    },
  ],
};

export default sidebars;

