package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// Config holds the sidecar configuration
type Config struct {
	SaturnURL     string
	MonitorToken  string
	JobName       string
	Namespace     string
	CheckInterval time.Duration
	Timeout       time.Duration
}

// JobStatus represents the status of a Kubernetes Job
type JobStatus struct {
	Name      string    `json:"name"`
	Namespace string    `json:"namespace"`
	Status    string    `json:"status"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime,omitempty"`
	Duration  int64     `json:"durationMs"`
	ExitCode  int       `json:"exitCode"`
	Output    string    `json:"output,omitempty"`
}

// SaturnPing represents a ping to Saturn
type SaturnPing struct {
	Token     string `json:"token"`
	Status    string `json:"status"`
	Duration  int64  `json:"durationMs,omitempty"`
	ExitCode  int    `json:"exitCode,omitempty"`
	Output    string `json:"output,omitempty"`
	Timestamp string `json:"timestamp"`
}

// SaturnIncident represents an incident response from Saturn
type SaturnIncident struct {
	ID      string `json:"id"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

func main() {
	config := loadConfig()
	log.Printf("Starting Saturn K8s sidecar for job %s in namespace %s", config.JobName, config.Namespace)

	// Create Kubernetes client
	clientset, err := createKubernetesClient()
	if err != nil {
		log.Fatalf("Failed to create Kubernetes client: %v", err)
	}

	// Set up signal handling
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Received shutdown signal")
		cancel()
	}()

	// Start monitoring
	if err := monitorJob(ctx, clientset, config); err != nil {
		log.Fatalf("Monitoring failed: %v", err)
	}
}

func loadConfig() *Config {
	config := &Config{
		SaturnURL:     getEnv("SATURN_URL", "https://api.saturn.sh"),
		MonitorToken:  getEnv("SATURN_MONITOR_TOKEN", ""),
		JobName:       getEnv("JOB_NAME", ""),
		Namespace:     getEnv("NAMESPACE", "default"),
		CheckInterval: time.Duration(getEnvInt("CHECK_INTERVAL", 30)) * time.Second,
		Timeout:       time.Duration(getEnvInt("TIMEOUT", 300)) * time.Second,
	}

	if config.MonitorToken == "" {
		log.Fatal("SATURN_MONITOR_TOKEN environment variable is required")
	}

	if config.JobName == "" {
		log.Fatal("JOB_NAME environment variable is required")
	}

	return config
}

func createKubernetesClient() (*kubernetes.Clientset, error) {
	var config *rest.Config
	var err error

	// Try in-cluster config first
	config, err = rest.InClusterConfig()
	if err != nil {
		// Fall back to kubeconfig
		kubeconfig := os.Getenv("KUBECONFIG")
		if kubeconfig == "" {
			kubeconfig = os.Getenv("HOME") + "/.kube/config"
		}
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return nil, fmt.Errorf("failed to create Kubernetes config: %v", err)
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kubernetes client: %v", err)
	}

	return clientset, nil
}

func monitorJob(ctx context.Context, clientset *kubernetes.Clientset, config *Config) error {
	ticker := time.NewTicker(config.CheckInterval)
	defer ticker.Stop()

	// Send initial ping
	if err := sendPing(config, "started", 0, 0, ""); err != nil {
		log.Printf("Failed to send initial ping: %v", err)
	}

	for {
		select {
		case <-ctx.Done():
			log.Println("Context cancelled, stopping monitoring")
			return nil
		case <-ticker.C:
			status, err := getJobStatus(clientset, config)
			if err != nil {
				log.Printf("Failed to get job status: %v", err)
				continue
			}

			if err := handleJobStatus(config, status); err != nil {
				log.Printf("Failed to handle job status: %v", err)
			}
		}
	}
}

func getJobStatus(clientset *kubernetes.Clientset, config *Config) (*JobStatus, error) {
	job, err := clientset.BatchV1().Jobs(config.Namespace).Get(context.TODO(), config.JobName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get job: %v", err)
	}

	status := &JobStatus{
		Name:      job.Name,
		Namespace: job.Namespace,
		Status:    "unknown",
	}

	// Determine job status
	if job.Status.Succeeded > 0 {
		status.Status = "success"
		status.ExitCode = 0
	} else if job.Status.Failed > 0 {
		status.Status = "failed"
		status.ExitCode = 1
	} else if job.Status.Active > 0 {
		status.Status = "running"
	} else {
		status.Status = "pending"
	}

	// Set timestamps
	if job.Status.StartTime != nil {
		status.StartTime = job.Status.StartTime.Time
	}

	if job.Status.CompletionTime != nil {
		status.EndTime = job.Status.CompletionTime.Time
		status.Duration = int64(status.EndTime.Sub(status.StartTime).Milliseconds())
	}

	// Get pod logs if available
	if status.Status == "success" || status.Status == "failed" {
		if output, err := getJobOutput(clientset, config); err == nil {
			status.Output = output
		}
	}

	return status, nil
}

func getJobOutput(clientset *kubernetes.Clientset, config *Config) (string, error) {
	// Get pods for this job
	pods, err := clientset.CoreV1().Pods(config.Namespace).List(context.TODO(), metav1.ListOptions{
		LabelSelector: fmt.Sprintf("job-name=%s", config.JobName),
	})
	if err != nil {
		return "", err
	}

	if len(pods.Items) == 0 {
		return "", fmt.Errorf("no pods found for job")
	}

	// Get logs from the first pod
	pod := pods.Items[0]
	req := clientset.CoreV1().Pods(config.Namespace).GetLogs(pod.Name, &corev1.PodLogOptions{
		Container: "main", // Assuming main container
		TailLines: int64Ptr(100),
	})

	logs, err := req.Stream(context.TODO())
	if err != nil {
		return "", err
	}
	defer logs.Close()

	var buf bytes.Buffer
	_, err = io.Copy(&buf, logs)
	if err != nil {
		return "", err
	}

	output := buf.String()
	if len(output) > 1000 {
		output = output[:1000] + "..."
	}

	return output, nil
}

func handleJobStatus(config *Config, status *JobStatus) error {
	switch status.Status {
	case "success":
		return sendPing(config, "success", status.Duration, status.ExitCode, status.Output)
	case "failed":
		return sendPing(config, "failed", status.Duration, status.ExitCode, status.Output)
	case "running":
		// Job is still running, no action needed
		return nil
	case "pending":
		// Job is pending, no action needed
		return nil
	default:
		log.Printf("Unknown job status: %s", status.Status)
		return nil
	}
}

func sendPing(config *Config, status string, duration int64, exitCode int, output string) error {
	ping := SaturnPing{
		Token:     config.MonitorToken,
		Status:    status,
		Duration:  duration,
		ExitCode:  exitCode,
		Output:    output,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, err := json.Marshal(ping)
	if err != nil {
		return fmt.Errorf("failed to marshal ping: %v", err)
	}

	url := fmt.Sprintf("%s/api/ping", config.SaturnURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "saturn-k8s-sidecar/1.0")

	client := &http.Client{
		Timeout: config.Timeout,
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send ping: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("ping failed with status %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("Successfully sent %s ping to Saturn", status)
	return nil
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func int64Ptr(i int64) *int64 {
	return &i
}
