=== Tokiflow Watchdog ===
Contributors: tokiflow
Tags: monitoring, cron, wp-cron, alerts, uptime
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Monitor WordPress cron jobs with Tokiflow. Detect if wp-cron is broken and get instant alerts.

== Description ==

Tokiflow Watchdog monitors your WordPress cron system (wp-cron) and sends heartbeat pings to Tokiflow, ensuring your scheduled tasks are running correctly.

**Features:**

* 🔍 **Automatic WP-Cron Monitoring** - Tracks every wp-cron execution
* 🚨 **Instant Alerts** - Get notified via Email, Slack, or Discord if wp-cron fails
* 📊 **Health Dashboard** - See wp-cron status at a glance
* ⚙️ **Zero Configuration** - Just add your Tokiflow token
* 🛡️ **Detect Broken Cron** - Alerts if wp-cron hasn't run in 24 hours
* 📝 **Scheduled Events List** - See all your scheduled WordPress tasks
* ✅ **Connection Testing** - Verify your setup works

**Why Monitor WP-Cron?**

WordPress wp-cron is fragile. It only runs when someone visits your site. If you have low traffic, your cron jobs (backups, scheduled posts, updates) may never run!

**What is Tokiflow?**

Tokiflow is a modern cron monitoring service. It tracks your scheduled jobs and alerts you when they fail, run late, or behave unusually.

**Pricing:**

* Free plan: 5 monitors (perfect for WordPress sites)
* Pro plan: 100 monitors, advanced features ($19/month)
* Self-hosted option available

== Installation ==

1. Install and activate the plugin
2. Go to Settings → Tokiflow
3. Sign up at [tokiflow.co](https://tokiflow.co) (free plan available)
4. Create a new monitor:
   - Schedule Type: **INTERVAL**
   - Interval: **15 minutes** (900 seconds)
   - Grace Period: **5 minutes** (300 seconds)
5. Copy the monitor token (starts with `tf_`)
6. Paste token into the plugin settings
7. Click "Test Connection" to verify
8. Done! Your wp-cron is now monitored

== Frequently Asked Questions ==

= Is Tokiflow free? =

Yes! Tokiflow offers a free plan with 5 monitors, perfect for WordPress sites. Pro and Business plans available for larger needs.

= Do I need to change my code? =

No! The plugin automatically monitors wp-cron. No code changes needed.

= What happens if wp-cron fails? =

You'll receive an alert via Email, Slack, Discord, or your preferred channel. You can acknowledge and resolve incidents from the Tokiflow dashboard.

= Does this work with real cron? =

Yes! If you've disabled wp-cron and set up a real cron job (recommended), the plugin will still monitor those executions.

= Is my data secure? =

Yes. The plugin only sends heartbeat pings (no sensitive data). All communication uses HTTPS.

= What if I use a caching plugin? =

WP-Cron can be unreliable with aggressive caching. This plugin helps you detect when cron stops working.

= Can I monitor multiple WordPress sites? =

Yes! Create a separate monitor for each site in your Tokiflow account.

== Screenshots ==

1. Plugin settings page showing wp-cron status
2. Tokiflow dashboard showing WordPress monitor
3. Alert received when wp-cron fails
4. Scheduled events debug view

== Changelog ==

= 1.0.0 - 2025-10-12 =
* Initial release
* Automatic wp-cron monitoring
* Tokiflow API integration
* Admin settings page
* Connection testing
* Health status indicators
* Scheduled events viewer

== Upgrade Notice ==

= 1.0.0 =
Initial release of Tokiflow Watchdog.

== Additional Info ==

**Links:**

* [Tokiflow](https://tokiflow.co)
* [Documentation](https://docs.tokiflow.co/wordpress)
* [Support](https://tokiflow.co/support)
* [GitHub](https://github.com/tokiflow/tokiflow)

**Requirements:**

* WordPress 5.0 or higher
* PHP 7.4 or higher
* Active internet connection
* Tokiflow account (free plan available)

**Privacy:**

This plugin connects to Tokiflow's external service to send heartbeat pings. No personal data or content is transmitted. Only ping timestamps and execution status are sent.

**Support:**

For support, please visit [tokiflow.co/support](https://tokiflow.co/support) or email support@tokiflow.co.




