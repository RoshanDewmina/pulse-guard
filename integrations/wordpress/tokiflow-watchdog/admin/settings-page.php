<?php
/**
 * Settings Page Template
 */

if (!defined('ABSPATH')) exit;
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <?php settings_errors(); ?>
    
    <!-- Status Card -->
    <div class="card" style="max-width: none; margin-top: 20px;">
        <h2>WP-Cron Status</h2>
        <table class="widefat">
            <tr>
                <td style="width: 200px;"><strong>Overall Status:</strong></td>
                <td>
                    <?php
                    $status_colors = array(
                        'healthy' => '#46b450',
                        'warning' => '#ffb900',
                        'error' => '#dc3232',
                    );
                    $status_emoji = array(
                        'healthy' => '✅',
                        'warning' => '⚠️',
                        'error' => '❌',
                    );
                    $color = $status_colors[$health['status']] ?? '#999';
                    $emoji = $status_emoji[$health['status']] ?? '⚪';
                    ?>
                    <span style="color: <?php echo $color; ?>; font-weight: bold;">
                        <?php echo $emoji; ?> <?php echo esc_html(ucfirst($health['status'])); ?>
                    </span>
                    <br>
                    <small><?php echo esc_html($health['message']); ?></small>
                </td>
            </tr>
            <tr>
                <td><strong>Scheduled Events:</strong></td>
                <td><?php echo intval($health['scheduled_events']); ?> events</td>
            </tr>
            <tr>
                <td><strong>WP-Cron Running:</strong></td>
                <td><?php echo $health['is_running'] ? '<span style="color: #46b450;">✓ Yes</span>' : '<span style="color: #dc3232;">✗ No</span>'; ?></td>
            </tr>
            <tr>
                <td><strong>Last Ping:</strong></td>
                <td>
                    <?php
                    $last_ping = get_option('tokiflow_last_ping', 0);
                    if ($last_ping > 0) {
                        echo human_time_diff($last_ping) . ' ago';
                    } else {
                        echo 'Never';
                    }
                    ?>
                </td>
            </tr>
            <tr>
                <td><strong>Total Pings Sent:</strong></td>
                <td><?php echo intval(get_option('tokiflow_ping_count', 0)); ?></td>
            </tr>
        </table>
    </div>
    
    <!-- Configuration Form -->
    <form method="post" action="options.php" style="margin-top: 20px;">
        <?php settings_fields('tokiflow_settings'); ?>
        
        <table class="form-table" role="presentation">
            <tr>
                <th scope="row">
                    <label for="tokiflow_token">Monitor Token</label>
                </th>
                <td>
                    <input type="text" 
                           id="tokiflow_token" 
                           name="tokiflow_token" 
                           value="<?php echo esc_attr(get_option('tokiflow_token')); ?>" 
                           class="regular-text code"
                           placeholder="pg_..." />
                    <p class="description">
                        Get your monitor token from the <a href="https://app.tokiflow.com" target="_blank">Tokiflow Dashboard</a>.
                        Create a new monitor with an INTERVAL schedule matching your wp-cron frequency.
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="tokiflow_api_url">API URL</label>
                </th>
                <td>
                    <input type="url" 
                           id="tokiflow_api_url" 
                           name="tokiflow_api_url" 
                           value="<?php echo esc_url(get_option('tokiflow_api_url', 'https://api.tokiflow.com')); ?>" 
                           class="regular-text" />
                    <p class="description">
                        Default: <code>https://api.tokiflow.com</code>. Change if using self-hosted Tokiflow.
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="tokiflow_capture_output">Capture Output</label>
                </th>
                <td>
                    <label>
                        <input type="checkbox" 
                               id="tokiflow_capture_output" 
                               name="tokiflow_capture_output" 
                               value="1"
                               <?php checked(get_option('tokiflow_capture_output'), 1); ?> />
                        Capture wp-cron output for debugging
                    </label>
                    <p class="description">
                        Enable to send wp-cron execution logs to Tokiflow (experimental).
                    </p>
                </td>
            </tr>
        </table>
        
        <?php submit_button('Save Settings'); ?>
    </form>
    
    <!-- Test Connection -->
    <div class="card" style="max-width: none; margin-top: 20px;">
        <h2>Test Connection</h2>
        <p>Test your Tokiflow connection to ensure the plugin is working correctly.</p>
        
        <button type="button" id="tokiflow-test-connection" class="button button-secondary">
            Test Connection
        </button>
        
        <div id="tokiflow-test-result" style="margin-top: 15px;"></div>
    </div>
    
    <!-- Help -->
    <div class="card" style="max-width: none; margin-top: 20px;">
        <h2>Troubleshooting</h2>
        
        <?php if (defined('DISABLE_WP_CRON') && DISABLE_WP_CRON): ?>
        <div class="notice notice-error inline">
            <p>
                <strong>WP-Cron is Disabled!</strong> The <code>DISABLE_WP_CRON</code> constant is set to true in your wp-config.php.
                This means WordPress will not automatically run scheduled tasks.
            </p>
            <p>
                <strong>Solution:</strong> Set up a real cron job:
            </p>
            <pre style="background: #f5f5f5; padding: 10px;">wget -q -O - <?php echo site_url('/wp-cron.php?doing_wp_cron'); ?> >/dev/null 2>&1</pre>
            <p>Or add to your server's crontab:</p>
            <pre style="background: #f5f5f5; padding: 10px;">*/15 * * * * cd <?php echo ABSPATH; ?> && php wp-cron.php</pre>
        </div>
        <?php endif; ?>
        
        <h3>Common Issues</h3>
        <ul style="list-style: disc; margin-left: 20px;">
            <li><strong>Connection fails:</strong> Check your token and API URL are correct.</li>
            <li><strong>No pings received:</strong> WP-Cron may not be running. Check if DISABLE_WP_CRON is set.</li>
            <li><strong>Pings too frequent:</strong> Normal - WordPress runs wp-cron on page loads.</li>
            <li><strong>Token not working:</strong> Create a new monitor in Tokiflow dashboard with INTERVAL schedule.</li>
        </ul>
        
        <h3>Recommended Setup</h3>
        <ol style="list-style: decimal; margin-left: 20px;">
            <li>Create a monitor in Tokiflow with:
                <ul style="list-style: circle; margin-left: 20px; margin-top: 5px;">
                    <li>Schedule Type: <strong>INTERVAL</strong></li>
                    <li>Interval: <strong>15 minutes</strong> (900 seconds)</li>
                    <li>Grace Period: <strong>5 minutes</strong> (300 seconds)</li>
                </ul>
            </li>
            <li>Copy the monitor token</li>
            <li>Paste it in the field above and save</li>
            <li>Click "Test Connection" to verify</li>
            <li>Monitor will start receiving pings automatically</li>
        </ol>
        
        <h3>Support</h3>
        <p>
            Need help? Visit <a href="https://docs.tokiflow.com/wordpress" target="_blank">Tokiflow WordPress Documentation</a>
            or email <a href="mailto:support@tokiflow.com">support@tokiflow.com</a>.
        </p>
    </div>
    
    <!-- Scheduled Events (Debug Info) -->
    <?php if (current_user_can('manage_options')): ?>
    <div class="card" style="max-width: none; margin-top: 20px;">
        <h2>Scheduled Events (Debug)</h2>
        <?php
        $events = $monitor->get_scheduled_events();
        if (empty($events)):
        ?>
            <p>No scheduled events found.</p>
        <?php else: ?>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>Hook</th>
                        <th>Schedule</th>
                        <th>Next Run</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($events as $event): ?>
                    <tr>
                        <td><code><?php echo esc_html($event['hook']); ?></code></td>
                        <td><?php echo esc_html($event['schedule']); ?></td>
                        <td><?php echo esc_html($event['next_run']); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <p class="description">
                Showing <?php echo count($events); ?> scheduled events. 
                These are managed by WordPress and plugins.
            </p>
        <?php endif; ?>
    </div>
    <?php endif; ?>
</div>




