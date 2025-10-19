<?php
/**
 * Plugin Name: Saturn Monitor
 * Plugin URI: https://saturn.sh
 * Description: Monitor WordPress cron jobs with Saturn monitoring platform
 * Version: 1.0.0
 * Author: Saturn Team
 * Author URI: https://saturn.sh
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: saturn-monitor
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('SATURN_MONITOR_VERSION', '1.0.0');
define('SATURN_MONITOR_PLUGIN_FILE', __FILE__);
define('SATURN_MONITOR_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SATURN_MONITOR_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Main Saturn Monitor class
 */
class SaturnMonitor {
    
    private $api_url;
    private $monitor_token;
    private $enabled;
    
    public function __construct() {
        $this->api_url = get_option('saturn_monitor_api_url', 'https://api.saturn.sh');
        $this->monitor_token = get_option('saturn_monitor_token', '');
        $this->enabled = get_option('saturn_monitor_enabled', false);
        
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('wp_ajax_saturn_test_connection', array($this, 'test_connection'));
        
        // Hook into WordPress cron
        add_action('wp_loaded', array($this, 'monitor_cron'));
        
        // Register activation/deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init() {
        // Load text domain for translations
        load_plugin_textdomain('saturn-monitor', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    public function activate() {
        // Set default options
        add_option('saturn_monitor_api_url', 'https://api.saturn.sh');
        add_option('saturn_monitor_token', '');
        add_option('saturn_monitor_enabled', false);
        add_option('saturn_monitor_check_interval', 300); // 5 minutes
        add_option('saturn_monitor_timeout', 30);
        
        // Schedule cron monitoring
        if (!wp_next_scheduled('saturn_monitor_cron_check')) {
            wp_schedule_event(time(), 'saturn_monitor_interval', 'saturn_monitor_cron_check');
        }
    }
    
    public function deactivate() {
        // Clear scheduled events
        wp_clear_scheduled_hook('saturn_monitor_cron_check');
    }
    
    public function add_admin_menu() {
        add_options_page(
            __('Saturn Monitor', 'saturn-monitor'),
            __('Saturn Monitor', 'saturn-monitor'),
            'manage_options',
            'saturn-monitor',
            array($this, 'admin_page')
        );
    }
    
    public function admin_init() {
        // Register settings
        register_setting('saturn_monitor_settings', 'saturn_monitor_api_url');
        register_setting('saturn_monitor_settings', 'saturn_monitor_token');
        register_setting('saturn_monitor_settings', 'saturn_monitor_enabled');
        register_setting('saturn_monitor_settings', 'saturn_monitor_check_interval');
        register_setting('saturn_monitor_settings', 'saturn_monitor_timeout');
        
        // Add custom cron interval
        add_filter('cron_schedules', array($this, 'add_cron_interval'));
    }
    
    public function add_cron_interval($schedules) {
        $interval = get_option('saturn_monitor_check_interval', 300);
        $schedules['saturn_monitor_interval'] = array(
            'interval' => $interval,
            'display' => sprintf(__('Every %d seconds', 'saturn-monitor'), $interval)
        );
        return $schedules;
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Saturn Monitor Settings', 'saturn-monitor'); ?></h1>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('saturn_monitor_settings');
                do_settings_sections('saturn_monitor_settings');
                ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Enable Monitoring', 'saturn-monitor'); ?></th>
                        <td>
                            <input type="checkbox" name="saturn_monitor_enabled" value="1" <?php checked(get_option('saturn_monitor_enabled'), 1); ?> />
                            <p class="description"><?php _e('Enable Saturn monitoring for WordPress cron jobs', 'saturn-monitor'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('API URL', 'saturn-monitor'); ?></th>
                        <td>
                            <input type="url" name="saturn_monitor_api_url" value="<?php echo esc_attr(get_option('saturn_monitor_api_url')); ?>" class="regular-text" />
                            <p class="description"><?php _e('Saturn API endpoint URL', 'saturn-monitor'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Monitor Token', 'saturn-monitor'); ?></th>
                        <td>
                            <input type="password" name="saturn_monitor_token" value="<?php echo esc_attr(get_option('saturn_monitor_token')); ?>" class="regular-text" />
                            <p class="description"><?php _e('Your Saturn monitor token', 'saturn-monitor'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Check Interval', 'saturn-monitor'); ?></th>
                        <td>
                            <input type="number" name="saturn_monitor_check_interval" value="<?php echo esc_attr(get_option('saturn_monitor_check_interval')); ?>" min="60" max="3600" />
                            <p class="description"><?php _e('How often to check cron status (seconds)', 'saturn-monitor'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Request Timeout', 'saturn-monitor'); ?></th>
                        <td>
                            <input type="number" name="saturn_monitor_timeout" value="<?php echo esc_attr(get_option('saturn_monitor_timeout')); ?>" min="5" max="300" />
                            <p class="description"><?php _e('Request timeout in seconds', 'saturn-monitor'); ?></p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
            
            <div class="saturn-monitor-test-section">
                <h2><?php _e('Test Connection', 'saturn-monitor'); ?></h2>
                <button type="button" id="saturn-test-connection" class="button"><?php _e('Test Connection', 'saturn-monitor'); ?></button>
                <div id="saturn-test-result"></div>
            </div>
            
            <div class="saturn-monitor-status-section">
                <h2><?php _e('Cron Status', 'saturn-monitor'); ?></h2>
                <p><?php _e('WordPress cron is', 'saturn-monitor'); ?> <strong><?php echo wp_next_scheduled('wp_scheduled_auto_draft_delete') ? __('enabled', 'saturn-monitor') : __('disabled', 'saturn-monitor'); ?></strong></p>
                <p><?php _e('Last cron run:', 'saturn-monitor'); ?> <strong><?php echo get_option('_transient_doing_cron') ? __('Running now', 'saturn-monitor') : __('Never', 'saturn-monitor'); ?></strong></p>
                
                <h3><?php _e('Scheduled Events', 'saturn-monitor'); ?></h3>
                <?php
                $cron_jobs = _get_cron_array();
                if (!empty($cron_jobs)) {
                    echo '<ul>';
                    foreach ($cron_jobs as $timestamp => $cron) {
                        foreach ($cron as $hook => $events) {
                            foreach ($events as $key => $event) {
                                $next_run = wp_next_scheduled($hook, $event['args']);
                                echo '<li>' . esc_html($hook) . ' - ' . date('Y-m-d H:i:s', $next_run) . '</li>';
                            }
                        }
                    }
                    echo '</ul>';
                } else {
                    echo '<p>' . __('No scheduled events found', 'saturn-monitor') . '</p>';
                }
                ?>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('#saturn-test-connection').click(function() {
                var button = $(this);
                var result = $('#saturn-test-result');
                
                button.prop('disabled', true).text('<?php _e('Testing...', 'saturn-monitor'); ?>');
                result.html('');
                
                $.post(ajaxurl, {
                    action: 'saturn_test_connection',
                    nonce: '<?php echo wp_create_nonce('saturn_test_connection'); ?>'
                }, function(response) {
                    if (response.success) {
                        result.html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>');
                    } else {
                        result.html('<div class="notice notice-error"><p>' + response.data.message + '</p></div>');
                    }
                }).always(function() {
                    button.prop('disabled', false).text('<?php _e('Test Connection', 'saturn-monitor'); ?>');
                });
            });
        });
        </script>
        <?php
    }
    
    public function test_connection() {
        check_ajax_referer('saturn_test_connection', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'saturn-monitor'));
        }
        
        $result = $this->send_ping('test', 0, 0, 'WordPress cron test');
        
        if ($result) {
            wp_send_json_success(array('message' => __('Connection successful!', 'saturn-monitor')));
        } else {
            wp_send_json_error(array('message' => __('Connection failed. Please check your settings.', 'saturn-monitor')));
        }
    }
    
    public function monitor_cron() {
        if (!$this->enabled || empty($this->monitor_token)) {
            return;
        }
        
        // Check if we should run the monitoring
        if (!wp_next_scheduled('saturn_monitor_cron_check')) {
            $interval = get_option('saturn_monitor_check_interval', 300);
            wp_schedule_event(time(), 'saturn_monitor_interval', 'saturn_monitor_cron_check');
        }
        
        // Hook into the scheduled event
        add_action('saturn_monitor_cron_check', array($this, 'check_cron_status'));
    }
    
    public function check_cron_status() {
        if (!$this->enabled || empty($this->monitor_token)) {
            return;
        }
        
        // Check if WordPress cron is working
        $cron_disabled = defined('DISABLE_WP_CRON') && DISABLE_WP_CRON;
        $last_cron = get_option('_transient_doing_cron');
        $cron_jobs = _get_cron_array();
        
        $status = 'success';
        $message = 'WordPress cron is working normally';
        $exit_code = 0;
        
        if ($cron_disabled) {
            $status = 'failed';
            $message = 'WordPress cron is disabled (DISABLE_WP_CRON is set)';
            $exit_code = 1;
        } elseif (empty($cron_jobs)) {
            $status = 'warning';
            $message = 'No cron jobs scheduled';
            $exit_code = 0;
        } elseif ($last_cron && (time() - $last_cron) > 3600) {
            $status = 'failed';
            $message = 'WordPress cron appears to be stuck or not running';
            $exit_code = 1;
        }
        
        // Send ping to Saturn
        $this->send_ping($status, 0, $exit_code, $message);
    }
    
    private function send_ping($status, $duration, $exit_code, $output = '') {
        if (empty($this->monitor_token)) {
            return false;
        }
        
        $data = array(
            'token' => $this->monitor_token,
            'status' => $status,
            'durationMs' => $duration,
            'exitCode' => $exit_code,
            'output' => $output,
            'timestamp' => current_time('c')
        );
        
        $args = array(
            'method' => 'POST',
            'timeout' => get_option('saturn_monitor_timeout', 30),
            'headers' => array(
                'Content-Type' => 'application/json',
                'User-Agent' => 'Saturn-WordPress-Plugin/1.0'
            ),
            'body' => json_encode($data)
        );
        
        $response = wp_remote_post($this->api_url . '/api/ping', $args);
        
        if (is_wp_error($response)) {
            error_log('Saturn Monitor: ' . $response->get_error_message());
            return false;
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code >= 400) {
            error_log('Saturn Monitor: HTTP ' . $response_code . ' - ' . wp_remote_retrieve_body($response));
            return false;
        }
        
        return true;
    }
}

// Initialize the plugin
new SaturnMonitor();

// Add custom cron interval on plugin load
add_filter('cron_schedules', function($schedules) {
    $interval = get_option('saturn_monitor_check_interval', 300);
    $schedules['saturn_monitor_interval'] = array(
        'interval' => $interval,
        'display' => sprintf(__('Every %d seconds', 'saturn-monitor'), $interval)
    );
    return $schedules;
});
