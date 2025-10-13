# Tokiflow Integrations

Native integrations for popular platforms and frameworks.

---

## 🎯 Available Integrations

### 1. Kubernetes ✅ **Production Ready**
**Location**: `kubernetes/`

Monitor Kubernetes CronJobs with zero code changes using our sidecar container.

**Features**:
- ✅ Sidecar container (Go)
- ✅ Helm chart for easy deployment
- ✅ Automatic start/success/fail pings
- ✅ Exit code tracking
- ✅ Log capture
- ✅ RBAC templates

**Quick Start**:
```bash
helm repo add pulseguard https://charts.tokiflow.co
helm install my-monitor pulseguard/pulseguard-monitor \
  --set pulseguard.token=tf_your_token \
  --set cronjob.schedule="0 3 * * *"
```

**Documentation**: [kubernetes/README.md](kubernetes/README.md)

---

### 2. WordPress ✅ **Production Ready**
**Location**: `wordpress/pulseguard-watchdog/`

Monitor WordPress wp-cron with a native WordPress plugin.

**Features**:
- ✅ Automatic wp-cron monitoring
- ✅ Admin settings page
- ✅ Health dashboard
- ✅ Connection testing
- ✅ Admin notices and warnings
- ✅ Scheduled events viewer
- ✅ Ready for WordPress.org

**Installation**:
1. Upload `pulseguard-watchdog/` to `wp-content/plugins/`
2. Activate in WordPress admin
3. Configure token in Settings → Tokiflow
4. Done!

**Documentation**: [wordpress/pulseguard-watchdog/readme.txt](wordpress/pulseguard-watchdog/readme.txt)

---

## 📦 Coming Soon

### 3. GitHub Actions
Monitor GitHub Actions workflows.

### 4. GitLab CI
Monitor GitLab CI/CD pipelines.

### 5. Terraform Provider
Define monitors as infrastructure-as-code.

### 6. Docker Compose
Monitor containers in Docker Compose setups.

---

## 🔧 Building Integrations

### Kubernetes Sidecar

```bash
cd kubernetes/sidecar
docker build -t pulseguard/k8s-sidecar:1.0.0 .
docker push pulseguard/k8s-sidecar:1.0.0
```

### WordPress Plugin

```bash
cd wordpress
zip -r pulseguard-watchdog.zip pulseguard-watchdog/
# Upload to WordPress or submit to WordPress.org
```

---

## 🎯 Integration Roadmap

### Phase 1 (Current) ✅
- [x] Kubernetes sidecar
- [x] Kubernetes Helm chart
- [x] WordPress plugin

### Phase 2 (Next)
- [ ] GitHub Actions
- [ ] Terraform provider
- [ ] Kubernetes Operator (CRD)

### Phase 3 (Future)
- [ ] Jenkins plugin
- [ ] GitLab CI integration
- [ ] Azure DevOps extension
- [ ] CircleCI orb

---

## 📚 Documentation

Each integration includes:
- Complete README with quick start
- Configuration examples
- Troubleshooting guide
- Best practices

---

## 🤝 Contributing

Want to build an integration? See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

**Integration requests**: Create an issue on GitHub.

---

## 📄 License

All integrations are licensed under GPL v2 or later, same as the main project.

---

## 🔗 Links

- Main Project: [README.md](../README.md)
- Documentation: https://docs.tokiflow.co
- Support: support@tokiflow.co

**Built with ❤️ for the community**





