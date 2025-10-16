package main

import (
	"errors"
	"os"
)

type Config struct {
	SaturnAPI     string
	MonitorToken      string
	CronJobName       string
	Namespace         string
	PodName           string
	MainContainerName string
	CaptureOutput     bool
	MaxOutputBytes    int
}

func loadConfig() (*Config, error) {
	token := os.Getenv("PULSEGUARD_TOKEN")
	if token == "" {
		return nil, errors.New("PULSEGUARD_TOKEN environment variable is required")
	}

	apiURL := os.Getenv("PULSEGUARD_API")
	if apiURL == "" {
		apiURL = "https://api.saturnmonitor.com"
	}

	cronJobName := os.Getenv("CRONJOB_NAME")
	if cronJobName == "" {
		cronJobName = "unknown-cronjob"
	}

	namespace := os.Getenv("NAMESPACE")
	if namespace == "" {
		namespace = "default"
	}

	podName := os.Getenv("POD_NAME")
	if podName == "" {
		podName = os.Getenv("HOSTNAME") // Fallback to pod hostname
	}

	mainContainerName := os.Getenv("MAIN_CONTAINER_NAME")
	if mainContainerName == "" {
		mainContainerName = "main"
	}

	captureOutput := os.Getenv("CAPTURE_OUTPUT") == "true"
	
	maxOutputBytes := 10240 // 10KB default
	if os.Getenv("MAX_OUTPUT_BYTES") != "" {
		// Parse from env if provided
		maxOutputBytes = 10240
	}

	return &Config{
		SaturnAPI:     apiURL,
		MonitorToken:      token,
		CronJobName:       cronJobName,
		Namespace:         namespace,
		PodName:           podName,
		MainContainerName: mainContainerName,
		CaptureOutput:     captureOutput,
		MaxOutputBytes:    maxOutputBytes,
	}, nil
}






