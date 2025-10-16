package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"os/exec"
	"strings"
	"time"
)

type ContainerMonitor struct {
	config *Config
}

func NewContainerMonitor(config *Config) *ContainerMonitor {
	return &ContainerMonitor{
		config: config,
	}
}

// WatchMainContainer monitors the main container and returns exit code and output
func (m *ContainerMonitor) WatchMainContainer(ctx context.Context) (int, string, error) {
	log.Printf("Waiting for main container '%s' to complete...", m.config.MainContainerName)

	// In a real implementation, we would:
	// 1. Use Kubernetes API to watch the pod
	// 2. Monitor the main container's status
	// 3. Capture logs if output capture is enabled
	//
	// For now, we implement a simple approach:
	// - Wait for the main container to finish
	// - Read its exit code from the pod status
	// - Optionally capture logs

	var exitCode int
	var output string
	var err error

	// Poll for container completion
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	timeout := time.After(24 * time.Hour) // Maximum job duration

	for {
		select {
		case <-ctx.Done():
			return 1, "", fmt.Errorf("context cancelled")

		case <-timeout:
			return 1, "", fmt.Errorf("timeout waiting for container")

		case <-ticker.C:
			// Check if main container has finished
			completed, code, err := m.checkContainerStatus()
			if err != nil {
				log.Printf("Error checking container status: %v", err)
				continue
			}

			if completed {
				exitCode = code
				log.Printf("Main container completed with exit code: %d", exitCode)

				// Capture output if enabled
				if m.config.CaptureOutput {
					output, err = m.captureContainerLogs()
					if err != nil {
						log.Printf("Warning: Failed to capture logs: %v", err)
					} else {
						log.Printf("Captured %d bytes of output", len(output))
					}
				}

				return exitCode, output, nil
			}
		}
	}
}

// checkContainerStatus checks if the main container has completed
// Returns: (completed bool, exitCode int, error)
func (m *ContainerMonitor) checkContainerStatus() (bool, int, error) {
	// Use kubectl to get container status
	// In production, we'd use the Kubernetes Go client
	
	cmd := exec.Command("kubectl", "get", "pod", m.config.PodName,
		"-n", m.config.Namespace,
		"-o", "jsonpath={.status.containerStatuses[?(@.name=='" + m.config.MainContainerName + "')].state}")

	output, err := cmd.CombinedOutput()
	if err != nil {
		return false, 0, fmt.Errorf("kubectl failed: %w", err)
	}

	status := string(output)

	// Check if container is in terminated state
	if strings.Contains(status, "terminated") {
		// Get exit code
		cmd = exec.Command("kubectl", "get", "pod", m.config.PodName,
			"-n", m.config.Namespace,
			"-o", "jsonpath={.status.containerStatuses[?(@.name=='" + m.config.MainContainerName + "')].state.terminated.exitCode}")

		output, err = cmd.CombinedOutput()
		if err != nil {
			return true, 1, fmt.Errorf("failed to get exit code: %w", err)
		}

		var exitCode int
		fmt.Sscanf(string(output), "%d", &exitCode)
		return true, exitCode, nil
	}

	// Container still running
	return false, 0, nil
}

// captureContainerLogs captures logs from the main container
func (m *ContainerMonitor) captureContainerLogs() (string, error) {
	cmd := exec.Command("kubectl", "logs", m.config.PodName,
		"-n", m.config.Namespace,
		"-c", m.config.MainContainerName,
		fmt.Sprintf("--tail=%d", m.config.MaxOutputBytes/100)) // Approximate line count

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to get logs: %w", err)
	}

	logs := string(output)

	// Truncate to max size
	if len(logs) > m.config.MaxOutputBytes {
		logs = logs[len(logs)-m.config.MaxOutputBytes:]
	}

	return logs, nil
}

// Alternative implementation using Kubernetes Go client (more robust)
// This requires importing k8s.io/client-go
/*
func (m *ContainerMonitor) WatchMainContainerWithClient(ctx context.Context) (int, string, error) {
	// Create Kubernetes client
	config, err := rest.InClusterConfig()
	if err != nil {
		return 1, "", fmt.Errorf("failed to get cluster config: %w", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return 1, "", fmt.Errorf("failed to create client: %w", err)
	}

	// Watch pod status
	watcher, err := clientset.CoreV1().Pods(m.config.Namespace).Watch(ctx, metav1.ListOptions{
		FieldSelector: fmt.Sprintf("metadata.name=%s", m.config.PodName),
	})
	if err != nil {
		return 1, "", fmt.Errorf("failed to create watcher: %w", err)
	}
	defer watcher.Stop()

	for event := range watcher.ResultChan() {
		pod, ok := event.Object.(*v1.Pod)
		if !ok {
			continue
		}

		// Find main container status
		for _, containerStatus := range pod.Status.ContainerStatuses {
			if containerStatus.Name == m.config.MainContainerName {
				if containerStatus.State.Terminated != nil {
					terminated := containerStatus.State.Terminated
					
					// Container has finished
					var output string
					if m.config.CaptureOutput {
						output, _ = m.getContainerLogs(clientset)
					}

					return int(terminated.ExitCode), output, nil
				}
			}
		}
	}

	return 1, "", fmt.Errorf("watcher closed unexpectedly")
}
*/






