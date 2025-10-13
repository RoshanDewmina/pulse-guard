// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Capture more context
  integrations: [
    Sentry.prismaIntegration(),
    Sentry.httpIntegration(),
  ],

  // Filter sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    // Remove sensitive query params
    if (event.request?.query_string) {
      const url = new URL(`http://dummy?${event.request.query_string}`);
      url.searchParams.delete('token');
      url.searchParams.delete('key');
      event.request.query_string = url.searchParams.toString();
    }

    return event;
  },

  environment: process.env.NODE_ENV,
});

