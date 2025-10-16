import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/api/reference',
    component: ComponentCreator('/api/reference', 'aca'),
    exact: true
  },
  {
    path: '/search',
    component: ComponentCreator('/search', '822'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '27b'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '34c'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '79d'),
            routes: [
              {
                path: '/alerts/discord',
                component: ComponentCreator('/alerts/discord', 'b8f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/alerts/email',
                component: ComponentCreator('/alerts/email', '467'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/alerts/slack',
                component: ComponentCreator('/alerts/slack', '591'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/alerts/webhooks',
                component: ComponentCreator('/alerts/webhooks', 'f80'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/analytics/health-score',
                component: ComponentCreator('/analytics/health-score', '079'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/analytics/mtbf-mttr',
                component: ComponentCreator('/analytics/mtbf-mttr', '121'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/analytics/percentiles',
                component: ComponentCreator('/analytics/percentiles', '892'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/analytics/uptime-sla',
                component: ComponentCreator('/analytics/uptime-sla', '18f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/anomalies/overview',
                component: ComponentCreator('/anomalies/overview', 'b73'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/anomalies/rules',
                component: ComponentCreator('/anomalies/rules', '138'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/anomalies/tuning',
                component: ComponentCreator('/anomalies/tuning', '038'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/anomalies/welford',
                component: ComponentCreator('/anomalies/welford', '472'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/api/reference',
                component: ComponentCreator('/api/reference', 'cef'),
                exact: true
              },
              {
                path: '/billing/plans',
                component: ComponentCreator('/billing/plans', 'fbf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/billing/usage-enforcement',
                component: ComponentCreator('/billing/usage-enforcement', '010'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/changelog/',
                component: ComponentCreator('/changelog/', '88f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/cli/install',
                component: ComponentCreator('/cli/install', '2eb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/cli/pulse-run',
                component: ComponentCreator('/cli/pulse-run', 'fb5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/cli/reference',
                component: ComponentCreator('/cli/reference', '2d1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/contact/',
                component: ComponentCreator('/contact/', '229'),
                exact: true
              },
              {
                path: '/faq/',
                component: ComponentCreator('/faq/', 'ad3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/get-started/choose-your-path',
                component: ComponentCreator('/get-started/choose-your-path', '4d3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/get-started/overview',
                component: ComponentCreator('/get-started/overview', '137'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/get-started/quickstart-ci',
                component: ComponentCreator('/get-started/quickstart-ci', '93e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/get-started/quickstart-kubernetes',
                component: ComponentCreator('/get-started/quickstart-kubernetes', '1bb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/get-started/quickstart-linux-cron',
                component: ComponentCreator('/get-started/quickstart-linux-cron', 'cf9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/get-started/quickstart-wordpress',
                component: ComponentCreator('/get-started/quickstart-wordpress', '40e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/incidents/lifecycle',
                component: ComponentCreator('/incidents/lifecycle', '519'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/incidents/maintenance-windows',
                component: ComponentCreator('/incidents/maintenance-windows', '00f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/incidents/types',
                component: ComponentCreator('/incidents/types', 'e3e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/kubernetes/examples',
                component: ComponentCreator('/kubernetes/examples', '074'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/kubernetes/helm-values',
                component: ComponentCreator('/kubernetes/helm-values', '84b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/kubernetes/sidecar',
                component: ComponentCreator('/kubernetes/sidecar', 'c5c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/legal/dpa',
                component: ComponentCreator('/legal/dpa', '131'),
                exact: true
              },
              {
                path: '/legal/privacy',
                component: ComponentCreator('/legal/privacy', 'a48'),
                exact: true
              },
              {
                path: '/legal/terms',
                component: ComponentCreator('/legal/terms', '909'),
                exact: true
              },
              {
                path: '/maintenance-windows/',
                component: ComponentCreator('/maintenance-windows/', 'ac9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/monitors/grace-periods',
                component: ComponentCreator('/monitors/grace-periods', '479'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/monitors/pings',
                component: ComponentCreator('/monitors/pings', '8a5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/monitors/tokens-rbac',
                component: ComponentCreator('/monitors/tokens-rbac', '2b5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/monitors/types',
                component: ComponentCreator('/monitors/types', '5d8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/output-capture/overview',
                component: ComponentCreator('/output-capture/overview', 'a27'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/roadmap/',
                component: ComponentCreator('/roadmap/', '2ca'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/security/overview',
                component: ComponentCreator('/security/overview', '047'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/security/redaction',
                component: ComponentCreator('/security/redaction', 'f3e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/wordpress/bulk-agency',
                component: ComponentCreator('/wordpress/bulk-agency', 'c8f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/wordpress/install',
                component: ComponentCreator('/wordpress/install', '4f6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/wordpress/troubleshooting',
                component: ComponentCreator('/wordpress/troubleshooting', 'bf7'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
