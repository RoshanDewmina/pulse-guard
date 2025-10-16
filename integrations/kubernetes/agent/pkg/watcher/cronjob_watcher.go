package watcher

import (
	"context"
	"fmt"
	"time"

	"github.com/saturn/k8s-agent/pkg/monitor"
	batchv1 "k8s.io/api/batch/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes"
	"k8s.io/klog/v2"
)

const (
	// Annotations for Saturn integration
	AnnotationEnabled  = "saturn.co/enabled"
	AnnotationMonitorID = "saturn.co/monitor-id"
	AnnotationGraceSec = "saturn.co/grace-sec"
	AnnotationTags     = "saturn.co/tags"
	
	// Default grace period
	DefaultGraceSec = 300
)

// CronJobWatcher watches CronJobs and syncs them with Saturn
type CronJobWatcher struct {
	clientset      *kubernetes.Clientset
	namespace      string
	syncPeriod     time.Duration
	monitorManager *monitor.Manager
}

// NewCronJobWatcher creates a new CronJob watcher
func NewCronJobWatcher(
	clientset *kubernetes.Clientset,
	namespace string,
	syncPeriod time.Duration,
	monitorManager *monitor.Manager,
) *CronJobWatcher {
	return &CronJobWatcher{
		clientset:      clientset,
		namespace:      namespace,
		syncPeriod:     syncPeriod,
		monitorManager: monitorManager,
	}
}

// Run starts the watcher
func (w *CronJobWatcher) Run(ctx context.Context) {
	klog.Info("Starting CronJob watcher")

	// Initial sync
	if err := w.syncAll(ctx); err != nil {
		klog.Errorf("Initial sync failed: %v", err)
	}

	// Watch for changes
	go w.watchCronJobs(ctx)

	// Periodic full sync
	ticker := time.NewTicker(w.syncPeriod)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			klog.Info("Stopping CronJob watcher")
			return
		case <-ticker.C:
			if err := w.syncAll(ctx); err != nil {
				klog.Errorf("Periodic sync failed: %v", err)
			}
		}
	}
}

// syncAll performs a full sync of all CronJobs
func (w *CronJobWatcher) syncAll(ctx context.Context) error {
	klog.Info("Starting full CronJob sync")

	cronJobs, err := w.clientset.BatchV1().CronJobs(w.namespace).List(ctx, v1.ListOptions{})
	if err != nil {
		return fmt.Errorf("failed to list CronJobs: %w", err)
	}

	synced := 0
	for _, cronJob := range cronJobs.Items {
		if w.shouldSync(&cronJob) {
			if err := w.syncCronJob(ctx, &cronJob); err != nil {
				klog.Errorf("Failed to sync CronJob %s/%s: %v", cronJob.Namespace, cronJob.Name, err)
			} else {
				synced++
			}
		}
	}

	klog.Infof("Full sync completed: %d/%d CronJobs synced", synced, len(cronJobs.Items))
	return nil
}

// watchCronJobs watches for CronJob events
func (w *CronJobWatcher) watchCronJobs(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
			if err := w.watchOnce(ctx); err != nil {
				klog.Errorf("Watch error: %v", err)
				time.Sleep(5 * time.Second)
			}
		}
	}
}

// watchOnce performs a single watch operation
func (w *CronJobWatcher) watchOnce(ctx context.Context) error {
	watcher, err := w.clientset.BatchV1().CronJobs(w.namespace).Watch(ctx, v1.ListOptions{})
	if err != nil {
		return fmt.Errorf("failed to create watcher: %w", err)
	}
	defer watcher.Stop()

	klog.Info("Watching for CronJob events")

	for {
		select {
		case <-ctx.Done():
			return nil
		case event, ok := <-watcher.ResultChan():
			if !ok {
				return fmt.Errorf("watch channel closed")
			}

			w.handleEvent(ctx, event)
		}
	}
}

// handleEvent handles a watch event
func (w *CronJobWatcher) handleEvent(ctx context.Context, event watch.Event) {
	cronJob, ok := event.Object.(*batchv1.CronJob)
	if !ok {
		klog.Warning("Received non-CronJob object in watch event")
		return
	}

	klog.V(4).Infof("CronJob event: %s %s/%s", event.Type, cronJob.Namespace, cronJob.Name)

	switch event.Type {
	case watch.Added, watch.Modified:
		if w.shouldSync(cronJob) {
			if err := w.syncCronJob(ctx, cronJob); err != nil {
				klog.Errorf("Failed to sync CronJob %s/%s: %v", cronJob.Namespace, cronJob.Name, err)
			}
		}
	case watch.Deleted:
		if w.shouldSync(cronJob) {
			if err := w.deleteCronJobMonitor(ctx, cronJob); err != nil {
				klog.Errorf("Failed to delete monitor for CronJob %s/%s: %v", cronJob.Namespace, cronJob.Name, err)
			}
		}
	}
}

// shouldSync checks if a CronJob should be synced with Saturn
func (w *CronJobWatcher) shouldSync(cronJob *batchv1.CronJob) bool {
	// Check if Saturn integration is explicitly enabled
	if enabled, ok := cronJob.Annotations[AnnotationEnabled]; ok && enabled == "true" {
		return true
	}

	// Check if monitor ID annotation exists (already synced)
	if _, ok := cronJob.Annotations[AnnotationMonitorID]; ok {
		return true
	}

	// By default, don't sync unless explicitly enabled
	return false
}

// syncCronJob syncs a CronJob with Saturn
func (w *CronJobWatcher) syncCronJob(ctx context.Context, cronJob *batchv1.CronJob) error {
	monitorName := fmt.Sprintf("%s/%s", cronJob.Namespace, cronJob.Name)
	
	// Get grace period from annotation or use default
	graceSec := DefaultGraceSec
	if graceStr, ok := cronJob.Annotations[AnnotationGraceSec]; ok {
		// Parse grace seconds from annotation
		var g int
		if _, err := fmt.Sscanf(graceStr, "%d", &g); err == nil && g > 0 {
			graceSec = g
		}
	}

	// Get tags from annotation
	tags := []string{
		"kubernetes",
		fmt.Sprintf("namespace:%s", cronJob.Namespace),
	}
	if tagsStr, ok := cronJob.Annotations[AnnotationTags]; ok {
		// Simple comma-separated tags
		// In production, use proper parsing
		tags = append(tags, tagsStr)
	}

	// Check if monitor already exists
	monitorID := cronJob.Annotations[AnnotationMonitorID]
	
	monitorSpec := &monitor.MonitorSpec{
		Name:         monitorName,
		ScheduleType: "CRON",
		CronExpr:     cronJob.Spec.Schedule,
		Timezone:     cronJob.Spec.TimeZone,
		GraceSec:     graceSec,
		Tags:         tags,
	}

	if monitorID != "" {
		// Update existing monitor
		klog.V(2).Infof("Updating monitor %s for CronJob %s/%s", monitorID, cronJob.Namespace, cronJob.Name)
		if err := w.monitorManager.UpdateMonitor(ctx, monitorID, monitorSpec); err != nil {
			return fmt.Errorf("failed to update monitor: %w", err)
		}
	} else {
		// Create new monitor
		klog.Infof("Creating monitor for CronJob %s/%s", cronJob.Namespace, cronJob.Name)
		newMonitorID, err := w.monitorManager.CreateMonitor(ctx, monitorSpec)
		if err != nil {
			return fmt.Errorf("failed to create monitor: %w", err)
		}

		// Update CronJob with monitor ID annotation
		if err := w.addMonitorAnnotation(ctx, cronJob, newMonitorID); err != nil {
			klog.Warningf("Failed to add monitor ID annotation: %v", err)
			// Don't return error, monitor is created successfully
		}
	}

	return nil
}

// deleteCronJobMonitor deletes the monitor for a CronJob
func (w *CronJobWatcher) deleteCronJobMonitor(ctx context.Context, cronJob *batchv1.CronJob) error {
	monitorID := cronJob.Annotations[AnnotationMonitorID]
	if monitorID == "" {
		return nil // No monitor to delete
	}

	klog.Infof("Deleting monitor %s for CronJob %s/%s", monitorID, cronJob.Namespace, cronJob.Name)
	return w.monitorManager.DeleteMonitor(ctx, monitorID)
}

// addMonitorAnnotation adds the monitor ID annotation to a CronJob
func (w *CronJobWatcher) addMonitorAnnotation(ctx context.Context, cronJob *batchv1.CronJob, monitorID string) error {
	// Get fresh copy
	fresh, err := w.clientset.BatchV1().CronJobs(cronJob.Namespace).Get(ctx, cronJob.Name, v1.GetOptions{})
	if err != nil {
		return err
	}

	if fresh.Annotations == nil {
		fresh.Annotations = make(map[string]string)
	}
	fresh.Annotations[AnnotationMonitorID] = monitorID

	_, err = w.clientset.BatchV1().CronJobs(cronJob.Namespace).Update(ctx, fresh, v1.UpdateOptions{})
	return err
}

