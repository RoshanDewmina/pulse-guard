package main

import (
	"context"
	"flag"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/saturn/k8s-agent/pkg/config"
	"github.com/saturn/k8s-agent/pkg/monitor"
	"github.com/saturn/k8s-agent/pkg/watcher"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/klog/v2"
)

var (
	kubeconfig = flag.String("kubeconfig", "", "Path to kubeconfig file (optional, uses in-cluster config if not provided)")
	apiKey     = flag.String("api-key", "", "Saturn API key (can also use SATURN_API_KEY env var)")
	endpoint   = flag.String("endpoint", "https://saturn.co", "Saturn API endpoint")
	namespace  = flag.String("namespace", "", "Kubernetes namespace to watch (empty = all namespaces)")
	syncPeriod = flag.Duration("sync-period", 5*time.Minute, "Sync period for full reconciliation")
)

func main() {
	klog.InitFlags(nil)
	flag.Parse()

	// Get API key from flag or environment
	saturnAPIKey := *apiKey
	if saturnAPIKey == "" {
		saturnAPIKey = os.Getenv("SATURN_API_KEY")
	}
	if saturnAPIKey == "" {
		klog.Fatal("Saturn API key required (--api-key or SATURN_API_KEY env var)")
	}

	// Build Kubernetes config
	var k8sConfig *rest.Config
	var err error

	if *kubeconfig != "" {
		// Out-of-cluster config (for development)
		k8sConfig, err = clientcmd.BuildConfigFromFlags("", *kubeconfig)
	} else {
		// In-cluster config (for production)
		k8sConfig, err = rest.InClusterConfig()
	}

	if err != nil {
		klog.Fatalf("Failed to build Kubernetes config: %v", err)
	}

	// Create Kubernetes clientset
	clientset, err := kubernetes.NewForConfig(k8sConfig)
	if err != nil {
		klog.Fatalf("Failed to create Kubernetes client: %v", err)
	}

	// Create Saturn client
	saturnConfig := &config.Config{
		APIKey:   saturnAPIKey,
		Endpoint: *endpoint,
	}

	// Create monitor manager
	monitorManager := monitor.NewManager(saturnConfig)

	// Create CronJob watcher
	cronJobWatcher := watcher.NewCronJobWatcher(
		clientset,
		*namespace,
		*syncPeriod,
		monitorManager,
	)

	// Create context with cancellation
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start the watcher
	klog.Info("Starting Saturn Kubernetes Agent")
	klog.Infof("Watching namespace: %s (empty = all namespaces)", *namespace)
	klog.Infof("Sync period: %s", *syncPeriod)
	klog.Infof("Saturn endpoint: %s", *endpoint)

	go cronJobWatcher.Run(ctx)

	// Wait for interrupt signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	<-sigCh
	klog.Info("Shutting down Saturn Kubernetes Agent...")
	cancel()

	// Give graceful shutdown time
	time.Sleep(2 * time.Second)
	klog.Info("Saturn Kubernetes Agent stopped")
}

