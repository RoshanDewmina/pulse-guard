package monitor

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/saturn/k8s-agent/pkg/config"
	"k8s.io/klog/v2"
)

// MonitorSpec defines the specification for a monitor
type MonitorSpec struct {
	Name         string
	ScheduleType string
	CronExpr     string
	Timezone     *string
	GraceSec     int
	Tags         []string
}

// Monitor represents a Saturn monitor
type Monitor struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	ScheduleType string   `json:"scheduleType"`
	CronExpr     string   `json:"cronExpr,omitempty"`
	Timezone     string   `json:"timezone,omitempty"`
	GraceSec     int      `json:"graceSec"`
	Tags         []string `json:"tags,omitempty"`
}

// Manager manages monitors in Saturn
type Manager struct {
	config     *config.Config
	httpClient *http.Client
}

// NewManager creates a new monitor manager
func NewManager(cfg *config.Config) *Manager {
	return &Manager{
		config: cfg,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// CreateMonitor creates a new monitor in Saturn
func (m *Manager) CreateMonitor(ctx context.Context, spec *MonitorSpec) (string, error) {
	monitor := &Monitor{
		Name:         spec.Name,
		ScheduleType: spec.ScheduleType,
		CronExpr:     spec.CronExpr,
		GraceSec:     spec.GraceSec,
		Tags:         spec.Tags,
	}

	if spec.Timezone != nil {
		monitor.Timezone = *spec.Timezone
	}

	body, err := json.Marshal(monitor)
	if err != nil {
		return "", fmt.Errorf("failed to marshal monitor: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", m.config.Endpoint+"/api/monitors", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.config.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("API error %d: %s", resp.StatusCode, string(respBody))
	}

	var created Monitor
	if err := json.Unmarshal(respBody, &created); err != nil {
		return "", fmt.Errorf("failed to unmarshal response: %w", err)
	}

	klog.V(2).Infof("Created monitor %s: %s", created.ID, created.Name)
	return created.ID, nil
}

// UpdateMonitor updates an existing monitor
func (m *Manager) UpdateMonitor(ctx context.Context, id string, spec *MonitorSpec) error {
	monitor := &Monitor{
		Name:         spec.Name,
		ScheduleType: spec.ScheduleType,
		CronExpr:     spec.CronExpr,
		GraceSec:     spec.GraceSec,
		Tags:         spec.Tags,
	}

	if spec.Timezone != nil {
		monitor.Timezone = *spec.Timezone
	}

	body, err := json.Marshal(monitor)
	if err != nil {
		return fmt.Errorf("failed to marshal monitor: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "PATCH", m.config.Endpoint+"/api/monitors/"+id, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.config.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API error %d: %s", resp.StatusCode, string(respBody))
	}

	klog.V(2).Infof("Updated monitor %s", id)
	return nil
}

// DeleteMonitor deletes a monitor
func (m *Manager) DeleteMonitor(ctx context.Context, id string) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", m.config.Endpoint+"/api/monitors/"+id, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.config.APIKey)

	resp, err := m.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API error %d: %s", resp.StatusCode, string(respBody))
	}

	klog.V(2).Infof("Deleted monitor %s", id)
	return nil
}

