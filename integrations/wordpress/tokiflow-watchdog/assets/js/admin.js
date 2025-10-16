/**
 * Saturn Admin JavaScript
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Test connection button
        $('#Saturn-test-connection').on('click', function(e) {
            e.preventDefault();
            
            var $button = $(this);
            var $result = $('#Saturn-test-result');
            
            // Get current values from form
            var token = $('#Saturn_token').val();
            var apiUrl = $('#Saturn_api_url').val();
            
            if (!token) {
                $result.html('<div class="notice notice-error inline"><p>Please enter a monitor token first.</p></div>');
                return;
            }
            
            // Disable button and show loading
            $button.prop('disabled', true).text('Testing...');
            $result.html('<div class="notice notice-info inline"><p>Testing connection to Saturn...</p></div>');
            
            // Send AJAX request
            $.ajax({
                url: pulseGuardAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'Saturn_test_connection',
                    nonce: pulseGuardAdmin.nonce,
                    token: token,
                    api_url: apiUrl
                },
                success: function(response) {
                    if (response.success) {
                        $result.html('<div class="notice notice-success inline"><p>✅ ' + response.data + '</p></div>');
                    } else {
                        $result.html('<div class="notice notice-error inline"><p>❌ ' + response.data + '</p></div>');
                    }
                },
                error: function(xhr, status, error) {
                    $result.html('<div class="notice notice-error inline"><p>❌ Connection failed: ' + error + '</p></div>');
                },
                complete: function() {
                    $button.prop('disabled', false).text('Test Connection');
                }
            });
        });
    });
    
})(jQuery);




