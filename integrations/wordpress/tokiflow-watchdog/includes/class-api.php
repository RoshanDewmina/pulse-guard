<?php
/**
 * Saturn API Client
 * 
 * Handles communication with Saturn API
 */

class Saturn_API {
    
    /**
     * Send ping to Saturn
     * 
     * @param string $token Monitor token
     * @param string $state State: start, success, or fail
     * @param int|null $exit_code Exit code (optional)
     * @param int|null $duration_ms Duration in milliseconds (optional)
     * @param string|null $output Job output (optional)
     * @return bool Success status
     */
    public function send_ping($token, $state = 'success', $exit_code = null, $duration_ms = null, $output = null) {
        $api_url = get_option('saturn_api_url', 'https://api.saturn.io');
        $endpoint = $api_url . '/api/ping/' . $token;
        
        // Build query parameters
        $params = array('state' => $state);
        if ($exit_code !== null) {
            $params['exitCode'] = $exit_code;
        }
        if ($duration_ms !== null) {
            $params['durationMs'] = $duration_ms;
        }
        
        $url = add_query_arg($params, $endpoint);
        
        $args = array(
            'timeout' => 10,
            'headers' => array(
                'User-Agent' => 'Saturn-WordPress/' . SATURN_VERSION,
            ),
        );
        
        // If we have output, send as POST
        if (!empty($output)) {
            $args['method'] = 'POST';
            $args['body'] = $output;
            $args['headers']['Content-Type'] = 'text/plain';
            $response = wp_remote_post($url, $args);
        } else {
            $response = wp_remote_get($url, $args);
        }
        
        // Check response
        if (is_wp_error($response)) {
            error_log('Saturn API Error: ' . $response->get_error_message());
            return false;
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code < 200 || $status_code >= 300) {
            error_log('Saturn API returned status ' . $status_code);
            return false;
        }
        
        return true;
    }
    
    /**
     * Test connection to Saturn
     * 
     * @param string $token Monitor token
     * @param string $api_url API URL
     * @return array Result with success status and message
     */
    public function test_connection($token, $api_url) {
        $endpoint = $api_url . '/api/ping/' . $token . '?state=success';
        
        $response = wp_remote_get($endpoint, array(
            'timeout' => 10,
            'headers' => array(
                'User-Agent' => 'Saturn-WordPress/' . SATURN_VERSION,
            ),
        ));
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => 'Connection failed: ' . $response->get_error_message(),
            );
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code === 200) {
            return array(
                'success' => true,
                'message' => 'Connection successful! Monitor is receiving pings.',
            );
        } else {
            $body = wp_remote_retrieve_body($response);
            return array(
                'success' => false,
                'message' => 'API returned status ' . $status_code . ': ' . $body,
            );
        }
    }
}




