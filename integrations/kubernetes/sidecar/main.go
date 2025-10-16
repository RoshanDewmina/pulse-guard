package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

const version = "1.0.0"

func main() {
	log.Printf("🚀 Saturn Kubernetes Sidecar v%s starting...", version)

	// Get configuration from environment
	config, err := loadConfig()
	if (err != nil) {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	log.Printf("Monitoring CronJob: %s", config.CronJobName)
	log.Printf("Saturn API: %s", config.SaturnAPI)

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle shutdown signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		sig := <-sigChan
		log.Printf("Received signal %v, shutting down gracefully...", sig)
		cancel()
	}()

	// Send start ping
	if err := sendPing(config, "start", 0, "", nil); err != nil {
		log.Printf("Warning: Failed to send start ping: %v", err)
	} else {
		log.Println("✓ Start ping sent")
	}

	startTime := time.Now()

	// Monitor the main container
	monitor := NewContainerMonitor(config)
	exitCode, output, err := monitor.WatchMainContainer(ctx)

	duration := time.Since(startTime)
	durationMs := int(duration.Milliseconds())

	// Determine state based on exit code
	var state string
	if err != nil {
		log.Printf("Error monitoring container: %v", err)
		state = "fail"
		if exitCode == 0 {
			exitCode = 1 // Force failure if error occurred
		}
	} else if exitCode == 0 {
		state = "success"
		log.Printf("✓ Job completed successfully (exit code: 0, duration: %dms)", durationMs)
	} else {
		state = "fail"
		log.Printf("✗ Job failed (exit code: %d, duration: %dms)", exitCode, durationMs)
	}

	// Send final ping with output
	if err := sendPing(config, state, exitCode, output, &durationMs); err != nil {
		log.Printf("Error sending %s ping: %v", state, err)
		os.Exit(1)
	}

	log.Printf("✓ Final %s ping sent", state)
	log.Println("✨ Sidecar completed successfully")
}






