<?php
/**
 * Plugin Name: Saturn Watchdog
 * Plugin URI: https://saturn.io/wordpress
 * Description: Monitor WordPress cron jobs with Saturn. Detect if wp-cron is broken and get alerts when scheduled tasks fail.
 * Version: 1.0.0
 * Author: Saturn
 * Author URI: https://saturn.io
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: saturn-watchdog
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.4
 *
 * @package Saturn_Watchdog
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('SATURN_VERSION', '1.0.0');
define('SATURN_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SATURN_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include required files
require_once SATURN_PLUGIN_DIR . 'includes/class-monitor.php';
require_once SATURN_PLUGIN_DIR . 'includes/class-settings.php';
require_once SATURN_PLUGIN_DIR . 'includes/class-api.php';

/**
 * Main plugin class
 */
class Saturn_Watchdog {
    
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
        $this->api = new Saturn_API();
        $this->monitor = new Saturn_Monitor($this->api);
        $this->settings = new Saturn_Settings($this->api);
        
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
        if (!get_option('saturn_token')) {
            add_option('Saturn_token', '');
        }
        if (!get_option('Saturn_api_url')) {
            add_option('Saturn_api_url', 'https://api.Saturn.com');
        }
        if (!get_option('Saturn_last_ping')) {
            add_option('Saturn_last_ping', 0);
        }
        
        // Schedule health check
        if (!wp_next_scheduled('Saturn_health_check')) {
            wp_schedule_event(time(), 'hourly', 'Saturn_health_check');
        }
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Remove scheduled events
        wp_clear_scheduled_hook('Saturn_health_check');
    }
    
    /**
     * Check WP-Cron status
     */
    public function check_wp_cron_status() {
        // Check if WP_CRON is disabled
        if (defined('DISABLE_WP_CRON') && DISABLE_WP_CRON) {
            update_option('Saturn_wp_cron_disabled', true);
        } else {
            update_option('Saturn_wp_cron_disabled', false);
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
        $token = get_option('Saturn_token');
        if (empty($token)) {
            echo '<div class="notice notice-warning is-dismissible">';
            echo '<p><strong>Saturn Watchdog:</strong> Please configure your monitor token in <a href="' . admin_url('options-general.php?page=Saturn-watchdog') . '">Settings</a>.</p>';
            echo '</div>';
            return;
        }
        
        // Check if WP-Cron is disabled
        if (get_option('Saturn_wp_cron_disabled')) {
            echo '<div class="notice notice-error">';
            echo '<p><strong>Saturn Watchdog:</strong> WP-Cron is disabled (DISABLE_WP_CRON constant). Please set up a real cron job or enable WP-Cron.</p>';
            echo '</div>';
        }
        
        // Check last successful ping
        $last_ping = get_option('Saturn_last_ping', 0);
        $hours_since_ping = (time() - $last_ping) / 3600;
        
        if ($last_ping > 0 && $hours_since_ping > 24) {
            echo '<div class="notice notice-warning">';
            echo '<p><strong>Saturn Watchdog:</strong> No successful ping to Saturn in the last 24 hours. WP-Cron may not be running.</p>';
            echo '</div>';
        }
    }
    
    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        // Only load on our settings page
        if ('settings_page_Saturn-watchdog' !== $hook) {
            return;
        }
        
        wp_enqueue_style(
            'saturn-admin',
            SATURN_PLUGIN_URL . 'admin/css/admin.css',
            array(),
            SATURN_VERSION
        );
        
        wp_enqueue_script(
            'saturn-admin',
            SATURN_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            SATURN_VERSION,
            true
        );
        
        wp_localize_script('Saturn-admin', 'pulseGuardAdmin', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('Saturn_test_connection'),
        ));
    }
}

// Initialize plugin
function Saturn_watchdog_init() {
    return Saturn_Watchdog::get_instance();
}

// Start plugin
Saturn_watchdog_init();




