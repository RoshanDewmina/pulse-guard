package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client -
type Client struct {
	HTTPClient *http.Client
	Endpoint   string
	APIKey     string
}

// NewClient -
func NewClient(endpoint, apiKey string) *Client {
	return &Client{
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
		Endpoint:   endpoint,
		APIKey:     apiKey,
	}
}

// DoRequest -
func (c *Client) DoRequest(method, path string, body interface{}) ([]byte, error) {
	url := fmt.Sprintf("%s%s", c.Endpoint, path)

	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

// Monitor represents a monitor resource
type Monitor struct {
	ID           string            `json:"id,omitempty"`
	Name         string            `json:"name"`
	ScheduleType string            `json:"scheduleType"`
	IntervalSec  int               `json:"intervalSec,omitempty"`
	CronExpr     string            `json:"cronExpr,omitempty"`
	Timezone     string            `json:"timezone,omitempty"`
	GraceSec     int               `json:"graceSec"`
	Tags         []string          `json:"tags,omitempty"`
	Metadata     map[string]string `json:"metadata,omitempty"`
}

// CreateMonitor creates a new monitor
func (c *Client) CreateMonitor(monitor *Monitor) (*Monitor, error) {
	data, err := c.DoRequest("POST", "/api/monitors", monitor)
	if err != nil {
		return nil, err
	}

	var result Monitor
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// GetMonitor retrieves a monitor by ID
func (c *Client) GetMonitor(id string) (*Monitor, error) {
	data, err := c.DoRequest("GET", fmt.Sprintf("/api/monitors/%s", id), nil)
	if err != nil {
		return nil, err
	}

	var result Monitor
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// UpdateMonitor updates an existing monitor
func (c *Client) UpdateMonitor(id string, monitor *Monitor) (*Monitor, error) {
	data, err := c.DoRequest("PATCH", fmt.Sprintf("/api/monitors/%s", id), monitor)
	if err != nil {
		return nil, err
	}

	var result Monitor
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// DeleteMonitor deletes a monitor
func (c *Client) DeleteMonitor(id string) error {
	_, err := c.DoRequest("DELETE", fmt.Sprintf("/api/monitors/%s", id), nil)
	return err
}

// AlertRule represents an alert rule resource
type AlertRule struct {
	ID            string   `json:"id,omitempty"`
	Name          string   `json:"name"`
	MonitorIDs    []string `json:"monitorIds"`
	ChannelIDs    []string `json:"channelIds"`
	SuppressMin   int      `json:"suppressMinutes,omitempty"`
	OnlyWhenAllFail bool   `json:"onlyWhenAllFail,omitempty"`
}

// CreateAlertRule creates a new alert rule
func (c *Client) CreateAlertRule(rule *AlertRule) (*AlertRule, error) {
	data, err := c.DoRequest("POST", "/api/alert-rules", rule)
	if err != nil {
		return nil, err
	}

	var result AlertRule
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// GetAlertRule retrieves an alert rule by ID
func (c *Client) GetAlertRule(id string) (*AlertRule, error) {
	data, err := c.DoRequest("GET", fmt.Sprintf("/api/alert-rules/%s", id), nil)
	if err != nil {
		return nil, err
	}

	var result AlertRule
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// UpdateAlertRule updates an existing alert rule
func (c *Client) UpdateAlertRule(id string, rule *AlertRule) (*AlertRule, error) {
	data, err := c.DoRequest("PATCH", fmt.Sprintf("/api/alert-rules/%s", id), rule)
	if err != nil {
		return nil, err
	}

	var result AlertRule
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// DeleteAlertRule deletes an alert rule
func (c *Client) DeleteAlertRule(id string) error {
	_, err := c.DoRequest("DELETE", fmt.Sprintf("/api/alert-rules/%s", id), nil)
	return err
}

// Integration represents an integration resource
type Integration struct {
	ID     string                 `json:"id,omitempty"`
	Type   string                 `json:"type"`
	Label  string                 `json:"label"`
	Config map[string]interface{} `json:"configJson"`
}

// CreateIntegration creates a new integration
func (c *Client) CreateIntegration(integration *Integration) (*Integration, error) {
	data, err := c.DoRequest("POST", "/api/integrations", integration)
	if err != nil {
		return nil, err
	}

	var result Integration
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// GetIntegration retrieves an integration by ID
func (c *Client) GetIntegration(id string) (*Integration, error) {
	data, err := c.DoRequest("GET", fmt.Sprintf("/api/integrations/%s", id), nil)
	if err != nil {
		return nil, err
	}

	var result Integration
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// UpdateIntegration updates an existing integration
func (c *Client) UpdateIntegration(id string, integration *Integration) (*Integration, error) {
	data, err := c.DoRequest("PATCH", fmt.Sprintf("/api/integrations/%s", id), integration)
	if err != nil {
		return nil, err
	}

	var result Integration
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// DeleteIntegration deletes an integration
func (c *Client) DeleteIntegration(id string) error {
	_, err := c.DoRequest("DELETE", fmt.Sprintf("/api/integrations/%s", id), nil)
	return err
}

// StatusPage represents a status page resource
type StatusPage struct {
	ID           string                 `json:"id,omitempty"`
	Title        string                 `json:"title"`
	Slug         string                 `json:"slug"`
	IsPublic     bool                   `json:"isPublic"`
	CustomDomain string                 `json:"customDomain,omitempty"`
	Components   []interface{}          `json:"components,omitempty"`
	Theme        map[string]interface{} `json:"theme,omitempty"`
}

// CreateStatusPage creates a new status page
func (c *Client) CreateStatusPage(page *StatusPage) (*StatusPage, error) {
	data, err := c.DoRequest("POST", "/api/status-pages", page)
	if err != nil {
		return nil, err
	}

	var result StatusPage
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// GetStatusPage retrieves a status page by ID
func (c *Client) GetStatusPage(id string) (*StatusPage, error) {
	data, err := c.DoRequest("GET", fmt.Sprintf("/api/status-pages/%s", id), nil)
	if err != nil {
		return nil, err
	}

	var result StatusPage
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// UpdateStatusPage updates an existing status page
func (c *Client) UpdateStatusPage(id string, page *StatusPage) (*StatusPage, error) {
	data, err := c.DoRequest("PATCH", fmt.Sprintf("/api/status-pages/%s", id), page)
	if err != nil {
		return nil, err
	}

	var result StatusPage
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// DeleteStatusPage deletes a status page
func (c *Client) DeleteStatusPage(id string) error {
	_, err := c.DoRequest("DELETE", fmt.Sprintf("/api/status-pages/%s", id), nil)
	return err
}

