package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// Send ping to Saturn API
func sendPing(config *Config, state string, exitCode int, output string, durationMs *int) error {
	// Build URL with query parameters
	pingURL := fmt.Sprintf("%s/api/ping/%s", config.SaturnAPI, config.MonitorToken)
	
	params := url.Values{}
	params.Add("state", state)
	if exitCode != 0 || state == "fail" {
		params.Add("exitCode", fmt.Sprintf("%d", exitCode))
	}
	if durationMs != nil {
		params.Add("durationMs", fmt.Sprintf("%d", *durationMs))
	}

	fullURL := pingURL + "?" + params.Encode()

	var req *http.Request
	var err error

	// If we have output and it's a fail or success with capture enabled, send as POST
	if output != "" && config.CaptureOutput && (state == "fail" || state == "success") {
		// Truncate output to max size
		if len(output) > config.MaxOutputBytes {
			output = output[len(output)-config.MaxOutputBytes:]
		}

		req, err = http.NewRequest("POST", fullURL, bytes.NewBufferString(output))
		if err != nil {
			return fmt.Errorf("failed to create POST request: %w", err)
		}
		req.Header.Set("Content-Type", "text/plain")
	} else {
		// Simple GET request for start or success without output
		req, err = http.NewRequest("GET", fullURL, nil)
		if err != nil {
			return fmt.Errorf("failed to create GET request: %w", err)
		}
	}

	req.Header.Set("User-Agent", "Saturn-K8s-Sidecar/1.0")

	// Send request with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send ping: %w", err)
	}
	defer resp.Body.Close()

	// Check response
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("ping API returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}






