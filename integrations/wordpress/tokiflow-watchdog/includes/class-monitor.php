<?php
/**
 * Tokiflow Monitor Class
 * 
 * Handles wp-cron monitoring and pinging
 */

class Tokiflow_Monitor {
    
    private $api;
    
    public function __construct($api) {
        $this->api = $api;
    }
    
    /**
     * Send ping when WP-Cron runs
     */
    public function ping_on_cron_run() {
        $token = get_option('tokiflow_token');
        if (empty($token)) {
            return;
        }
        
        // Send success ping
        $result = $this->api->send_ping($token, 'success');
        
        if ($result) {
            update_option('tokiflow_last_ping', time());
            update_option('tokiflow_last_status', 'success');
            update_option('tokiflow_ping_count', get_option('tokiflow_ping_count', 0) + 1);
        } else {
            update_option('tokiflow_last_status', 'failed');
        }
    }
    
    /**
     * Check WP-Cron health
     */
    public function check_cron_health() {
        // Get all scheduled events
        $crons = _get_cron_array();
        
        if (empty($crons)) {
            return array(
                'status' => 'warning',
                'message' => 'No scheduled events found',
                'scheduled_events' => 0,
            );
        }
        
        $event_count = 0;
        foreach ($crons as $timestamp => $cron) {
            $event_count += count($cron);
        }
        
        // Check if cron is running
        $doing_cron = get_transient('doing_cron');
        $is_running = ($doing_cron && (time() - $doing_cron < 60));
        
        // Check last ping
        $last_ping = get_option('tokiflow_last_ping', 0);
        $last_ping_hours = $last_ping > 0 ? (time() - $last_ping) / 3600 : 999;
        
        $status = 'healthy';
        $message = 'WP-Cron is running normally';
        
        if (defined('DISABLE_WP_CRON') && DISABLE_WP_CRON) {
            $status = 'error';
            $message = 'WP-Cron is disabled';
        } elseif ($last_ping_hours > 24) {
            $status = 'warning';
            $message = 'No ping in last 24 hours';
        } elseif ($last_ping_hours > 2 && $event_count > 0) {
            $status = 'warning';
            $message = 'WP-Cron may not be running';
        }
        
        return array(
            'status' => $status,
            'message' => $message,
            'scheduled_events' => $event_count,
            'is_running' => $is_running,
            'last_ping' => $last_ping,
            'last_ping_hours' => round($last_ping_hours, 1),
        );
    }
    
    /**
     * Get scheduled events list
     */
    public function get_scheduled_events() {
        $crons = _get_cron_array();
        $events = array();
        
        if (empty($crons)) {
            return $events;
        }
        
        foreach ($crons as $timestamp => $cron) {
            foreach ($cron as $hook => $data) {
                foreach ($data as $key => $event) {
                    $events[] = array(
                        'hook' => $hook,
                        'timestamp' => $timestamp,
                        'schedule' => isset($event['schedule']) ? $event['schedule'] : 'one-time',
                        'next_run' => human_time_diff($timestamp) . ' ' . (time() > $timestamp ? 'ago (overdue)' : 'from now'),
                    );
                }
            }
        }
        
        return $events;
    }
}




