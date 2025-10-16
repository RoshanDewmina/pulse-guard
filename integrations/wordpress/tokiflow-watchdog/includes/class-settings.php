<?php
/**
 * Saturn Settings Page
 * 
 * Admin interface for plugin configuration
 */

class Saturn_Settings {
    
    private $api;
    
    public function __construct($api) {
        $this->api = $api;
        
        // AJAX handlers
        add_action('wp_ajax_saturn_test_connection', array($this, 'ajax_test_connection'));
    }
    
    /**
     * Add settings page to WordPress admin
     */
    public function add_settings_page() {
        add_options_page(
            'Saturn Watchdog Settings',
            'Saturn',
            'manage_options',
            'saturn-watchdog',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting('saturn_settings', 'saturn_token');
        register_setting('saturn_settings', 'saturn_api_url');
        register_setting('saturn_settings', 'saturn_capture_output');
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // Get monitor instance to check health
        $monitor = new Saturn_Monitor($this->api);
        $health = $monitor->check_cron_health();
        
        include SATURN_PLUGIN_DIR . 'admin/settings-page.php';
    }
    
    /**
     * AJAX handler for connection test
     */
    public function ajax_test_connection() {
        check_ajax_referer('saturn_test_connection', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
            return;
        }
        
        $token = sanitize_text_field($_POST['token'] ?? '');
        $api_url = esc_url_raw($_POST['api_url'] ?? 'https://api.saturn.io');
        
        if (empty($token)) {
            wp_send_json_error('Token is required');
            return;
        }
        
        $result = $this->api->test_connection($token, $api_url);
        
        if ($result['success']) {
            wp_send_json_success($result['message']);
        } else {
            wp_send_json_error($result['message']);
        }
    }
}




