<?php
/**
 * Plugin Name: Tokiflow Watchdog
 * Plugin URI: https://tokiflow.com/wordpress
 * Description: Monitor WordPress cron jobs with Tokiflow. Detect if wp-cron is broken and get alerts when scheduled tasks fail.
 * Version: 1.0.0
 * Author: Tokiflow
 * Author URI: https://tokiflow.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: tokiflow-watchdog
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.4
 *
 * @package Tokiflow_Watchdog
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('PULSEGUARD_VERSION', '1.0.0');
define('PULSEGUARD_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PULSEGUARD_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include required files
require_once PULSEGUARD_PLUGIN_DIR . 'includes/class-monitor.php';
require_once PULSEGUARD_PLUGIN_DIR . 'includes/class-settings.php';
require_once PULSEGUARD_PLUGIN_DIR . 'includes/class-api.php';

/**
 * Main plugin class
 */
class Tokiflow_Watchdog {
    
    private static $instance = null;
    private $monitor;
    private $settings;
    private $api;
    
    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init();
    }
    
    /**
     * Initialize plugin
     */
    private function init() {
        // Initialize components
        $this->api = new Tokiflow_API();
        $this->monitor = new Tokiflow_Monitor($this->api);
        $this->settings = new Tokiflow_Settings($this->api);
        
        // Hooks
        add_action('init', array($this, 'check_wp_cron_status'));
        add_action('wp_loaded', array($this, 'monitor_wp_cron'));
        add_action('admin_menu', array($this->settings, 'add_settings_page'));
        add_action('admin_init', array($this->settings, 'register_settings'));
        add_action('admin_notices', array($this, 'admin_notices'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        
        // Plugin activation/deactivation
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Set default options
        if (!get_option('tokiflow_token')) {
            add_option('tokiflow_token', '');
        }
        if (!get_option('tokiflow_api_url')) {
            add_option('tokiflow_api_url', 'https://api.tokiflow.com');
        }
        if (!get_option('tokiflow_last_ping')) {
            add_option('tokiflow_last_ping', 0);
        }
        
        // Schedule health check
        if (!wp_next_scheduled('tokiflow_health_check')) {
            wp_schedule_event(time(), 'hourly', 'tokiflow_health_check');
        }
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Remove scheduled events
        wp_clear_scheduled_hook('tokiflow_health_check');
    }
    
    /**
     * Check WP-Cron status
     */
    public function check_wp_cron_status() {
        // Check if WP_CRON is disabled
        if (defined('DISABLE_WP_CRON') && DISABLE_WP_CRON) {
            update_option('tokiflow_wp_cron_disabled', true);
        } else {
            update_option('tokiflow_wp_cron_disabled', false);
        }
    }
    
    /**
     * Monitor WP-Cron execution
     */
    public function monitor_wp_cron() {
        // Only run on cron requests
        if (!defined('DOING_CRON') || !DOING_CRON) {
            return;
        }
        
        $this->monitor->ping_on_cron_run();
    }
    
    /**
     * Display admin notices
     */
    public function admin_notices() {
        // Check if token is set
        $token = get_option('tokiflow_token');
        if (empty($token)) {
            echo '<div class="notice notice-warning is-dismissible">';
            echo '<p><strong>Tokiflow Watchdog:</strong> Please configure your monitor token in <a href="' . admin_url('options-general.php?page=tokiflow-watchdog') . '">Settings</a>.</p>';
            echo '</div>';
            return;
        }
        
        // Check if WP-Cron is disabled
        if (get_option('tokiflow_wp_cron_disabled')) {
            echo '<div class="notice notice-error">';
            echo '<p><strong>Tokiflow Watchdog:</strong> WP-Cron is disabled (DISABLE_WP_CRON constant). Please set up a real cron job or enable WP-Cron.</p>';
            echo '</div>';
        }
        
        // Check last successful ping
        $last_ping = get_option('tokiflow_last_ping', 0);
        $hours_since_ping = (time() - $last_ping) / 3600;
        
        if ($last_ping > 0 && $hours_since_ping > 24) {
            echo '<div class="notice notice-warning">';
            echo '<p><strong>Tokiflow Watchdog:</strong> No successful ping to Tokiflow in the last 24 hours. WP-Cron may not be running.</p>';
            echo '</div>';
        }
    }
    
    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        // Only load on our settings page
        if ('settings_page_tokiflow-watchdog' !== $hook) {
            return;
        }
        
        wp_enqueue_style(
            'tokiflow-admin',
            PULSEGUARD_PLUGIN_URL . 'admin/css/admin.css',
            array(),
            PULSEGUARD_VERSION
        );
        
        wp_enqueue_script(
            'tokiflow-admin',
            PULSEGUARD_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            PULSEGUARD_VERSION,
            true
        );
        
        wp_localize_script('tokiflow-admin', 'pulseGuardAdmin', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('tokiflow_test_connection'),
        ));
    }
}

// Initialize plugin
function tokiflow_watchdog_init() {
    return Tokiflow_Watchdog::get_instance();
}

// Start plugin
tokiflow_watchdog_init();




