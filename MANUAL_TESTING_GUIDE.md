# 🧪 Tokiflow - Complete Manual Testing Guide

**Goal**: Verify all features work before launching  
**Time Required**: 30-45 minutes  
**Difficulty**: Easy (just follow steps)

---

## 📋 Pre-Testing Checklist

Before you start testing, ensure all services are running:

### Step 0: Verify Services

```bash
# Check if Docker services are running
docker ps

# You should see:
# - pulseguard-postgres (PostgreSQL)
# - pulseguard-redis (Redis)
# - pulseguard-minio (MinIO)
# - pulseguard-selenium (Selenium - optional)
```

**Expected Output**: All 3-4 containers should be "Up" and healthy.

**If services are DOWN:**
```bash
cd /home/roshan/development/personal/pulse-guard
make docker-up
# or
docker compose up -d
```

---

## 🚀 Step 1: Start the Development Server

### 1.1 Check if server is already running

```bash
# Check if dev server is running
curl -s http://localhost:3001 | grep -o "Tokiflow" | head -1
```

**Expected**: Should print "Tokiflow"

### 1.2 If NOT running, start it

```bash
cd /home/roshan/development/personal/pulse-guard/apps/web
PORT=3001 bun run dev
```

**Expected Output**:
```
▲ Next.js 15.5.4
- Local:        http://localhost:3001
- Environments: .env.local

✓ Ready in 3.2s
```

**Success Criteria**: ✅ Server starts without errors and shows "Ready"

---

## 🌐 Step 2: Test Homepage (Public Page)

### 2.1 Open Browser

```bash
# Open in your browser (or just navigate manually)
xdg-open http://localhost:3001
# OR on Mac: open http://localhost:3001
```

### 2.2 Verify Homepage Elements

**What to check**:
- [ ] ✅ Page title shows "Tokiflow"
- [ ] ✅ Hero heading with "Cron & Job Monitoring"
- [ ] ✅ "Get Started" and "Sign In" buttons visible
- [ ] ✅ Code snippet showing: `curl https://api.tokiflow.co/api/ping/YOUR_TOKEN`
- [ ] ✅ Features section with 4 cards (Smart Alerts, Anomaly Detection, Fast DX, Privacy First)
- [ ] ✅ Pricing section with 3 tiers (Free, Pro, Business)
- [ ] ✅ Footer with copyright "© 2025 Tokiflow"

**Success Criteria**: ✅ All elements visible, no broken layouts, looks professional

### 2.3 Test Responsive Design

**In browser**:
1. Press `F12` to open DevTools
2. Click "Toggle device toolbar" (or `Ctrl+Shift+M`)
3. Test viewports:
   - Mobile (375px) - ✅ Content should stack vertically
   - Tablet (768px) - ✅ Layout should adapt
   - Desktop (1920px) - ✅ Full layout visible

**Success Criteria**: ✅ Page looks good on all screen sizes

---

## 🔐 Step 3: Test Authentication

### 3.1 Navigate to Signin Page

Click "Sign In" button or go to: `http://localhost:3001/auth/signin`

**What to check**:
- [ ] ✅ Email input field
- [ ] ✅ Password input field
- [ ] ✅ "Sign In" button
- [ ] ✅ "Sign in with Google" button
- [ ] ✅ "Don't have an account? Sign up" link

### 3.2 Test Signin with Test User

**Credentials** (from seed data):
- **Email**: `dewminaimalsha2003@gmail.com`
- **Password**: `test123`

**Steps**:
1. Enter email: `dewminaimalsha2003@gmail.com`
2. Enter password: `test123`
3. Click "Sign In"

**Expected**: Redirects to `/app` (dashboard)

**Success Criteria**: ✅ Successfully logged in, see dashboard

### 3.3 Verify Dashboard Loads

After signin, you should see:
- [ ] ✅ Navigation bar with "Tokiflow" logo
- [ ] ✅ Sidebar with links: Dashboard, Monitors, Incidents, Analytics, Settings
- [ ] ✅ Main content area with dashboard widgets
- [ ] ✅ User menu in top right (click to see profile, settings, logout)

**Success Criteria**: ✅ Dashboard loads without errors

---

## 📊 Step 4: Test Monitor Features

### 4.1 View Existing Monitors

Click "Monitors" in sidebar or go to: `http://localhost:3001/app/monitors`

**Expected**:
- [ ] ✅ List of monitors (should have at least 1 from seed data: "Sample Backup Job")
- [ ] ✅ Monitor shows: Name, Status, Schedule, Last Run, Actions
- [ ] ✅ "Create Monitor" button visible

**Success Criteria**: ✅ Monitors list displays correctly

### 4.2 View Monitor Details

Click on "Sample Backup Job" monitor

**Expected**:
- [ ] ✅ Monitor detail page loads
- [ ] ✅ Shows monitor name, description, status
- [ ] ✅ Shows ping token (starts with `pg_` or `tf_`)
- [ ] ✅ Shows schedule information
- [ ] ✅ Shows recent runs table
- [ ] ✅ Shows statistics (uptime, success rate, etc.)

**Success Criteria**: ✅ Monitor details page loads with all information

### 4.3 Create New Monitor

**Steps**:
1. Click "Create Monitor" button
2. Fill in form:
   - **Name**: `Test Monitor - Manual Testing`
   - **Description**: `Testing monitor creation`
   - **Schedule Type**: Select "Interval"
   - **Interval**: `300` seconds (5 minutes)
   - **Grace Period**: `60` seconds
   - Click "Create Monitor"

**Expected**:
- [ ] ✅ Form submits successfully
- [ ] ✅ Redirects to new monitor details page
- [ ] ✅ Shows success toast notification
- [ ] ✅ Monitor appears in monitors list

**Success Criteria**: ✅ New monitor created successfully

**Copy the monitor token** - you'll need it for API testing! Should look like: `pg_abcd1234efgh5678`

---

## 🔔 Step 5: Test Ping API

### 5.1 Test Heartbeat Ping (Simple)

**In terminal** (new tab/window):

```bash
# Replace TOKEN with your monitor token
TOKEN="pg_automation_test"  # or your newly created monitor token

# Test simple heartbeat
curl -X GET "http://localhost:3001/api/ping/${TOKEN}"
```

**Expected Response**:
```json
{
  "ok": true,
  "message": "Ping received",
  "nextDueAt": "2025-10-13T13:00:00.000Z",
  "monitor": {
    "id": "...",
    "name": "Test Monitor",
    "status": "UP"
  }
}
```

**Success Criteria**: ✅ Returns 200 status, JSON with `"ok": true`

### 5.2 Test Start Ping

```bash
# Test start ping (job beginning)
curl -X GET "http://localhost:3001/api/ping/${TOKEN}?state=start"
```

**Expected**: Same format, confirms start received

### 5.3 Test Success Ping with Duration

```bash
# Test success ping with metrics
curl -X GET "http://localhost:3001/api/ping/${TOKEN}?state=success&durationMs=1234&exitCode=0"
```

**Expected**: Same format, records success with 1234ms duration

### 5.4 Test Fail Ping with Output

```bash
# Test fail ping with output capture
echo "Error: Database connection failed
Connection timeout after 30s
Stack trace:
  at connect.js:45
  at retry.js:12" | curl -X POST \
  -H "Content-Type: text/plain" \
  --data-binary @- \
  "http://localhost:3001/api/ping/${TOKEN}?state=fail&exitCode=1"
```

**Expected**: Same format, records failure with output

**Success Criteria**: ✅ All 4 ping types return 200 and `"ok": true`

### 5.5 Verify Runs in Dashboard

**Go back to browser**:
1. Navigate to your monitor details page
2. Refresh the page

**Expected**:
- [ ] ✅ "Recent Runs" table shows new runs
- [ ] ✅ Runs show correct state (start, success, fail)
- [ ] ✅ Duration appears for success run
- [ ] ✅ Exit code appears
- [ ] ✅ Output capture available for fail run (click to view)

**Success Criteria**: ✅ All test pings appear in dashboard

---

## 🚨 Step 6: Test Incident Management

### 6.1 View Incidents Page

Click "Incidents" in sidebar or go to: `http://localhost:3001/app/incidents`

**Expected**:
- [ ] ✅ Incidents list loads
- [ ] ✅ Should show incident from fail ping (if created)
- [ ] ✅ Shows: Severity, Monitor, Summary, Status, Opened At
- [ ] ✅ Can filter by status (All, Open, Acknowledged, Resolved)

### 6.2 View Incident Details

Click on an incident

**Expected**:
- [ ] ✅ Incident detail page loads
- [ ] ✅ Shows incident summary and details
- [ ] ✅ Shows related monitor information
- [ ] ✅ Shows incident timeline
- [ ] ✅ "Acknowledge" button visible (if OPEN)
- [ ] ✅ "Resolve" button visible (if ACKNOWLEDGED or OPEN)

### 6.3 Test Incident Actions

**Try acknowledging**:
1. Click "Acknowledge" button
2. Expected: Status changes to "ACKNOWLEDGED", toast notification

**Try resolving**:
1. Click "Resolve" button
2. Expected: Status changes to "RESOLVED", toast notification

**Success Criteria**: ✅ Can acknowledge and resolve incidents

---

## 📈 Step 7: Test Analytics Dashboard

### 7.1 View Analytics Page

Click "Analytics" in sidebar or go to: `http://localhost:3001/app/analytics`

**Expected**:
- [ ] ✅ Analytics dashboard loads
- [ ] ✅ Shows key metrics cards:
  - Total Monitors
  - Active Monitors
  - Total Runs (last 24h)
  - Success Rate
- [ ] ✅ Shows charts (if data available):
  - Runs over time
  - Success vs Failure
  - Duration distribution
- [ ] ✅ Shows health scores for monitors

**Success Criteria**: ✅ Analytics page loads and displays metrics

### 7.2 Test Monitor-Specific Analytics

**Steps**:
1. Go to a monitor details page
2. Click "Analytics" tab (or similar)

**Expected**:
- [ ] ✅ Shows monitor-specific statistics
- [ ] ✅ Health score (0-100)
- [ ] ✅ Uptime percentage
- [ ] ✅ MTBF (Mean Time Between Failures)
- [ ] ✅ MTTR (Mean Time To Resolution)
- [ ] ✅ Duration chart showing trend

**Success Criteria**: ✅ Monitor analytics display correctly

---

## ⚙️ Step 8: Test Settings Pages

### 8.1 Test Team Settings

Go to: `http://localhost:3001/app/settings/team`

**Expected**:
- [ ] ✅ Shows current team members
- [ ] ✅ Shows "Invite Member" button
- [ ] ✅ Can see member roles (Owner, Member)

**Success Criteria**: ✅ Team page loads

### 8.2 Test Alert Channels

Go to: `http://localhost:3001/app/settings/alerts`

**Expected**:
- [ ] ✅ Shows configured alert channels
- [ ] ✅ Shows "Add Channel" button
- [ ] ✅ Can see channel types (Email, Slack, Discord, Webhook)

**Success Criteria**: ✅ Alerts settings page loads

### 8.3 Test Billing Page (if Stripe configured)

Go to: `http://localhost:3001/app/settings/billing`

**Expected**:
- [ ] ✅ Shows current plan (Free)
- [ ] ✅ Shows upgrade options (Pro, Business)
- [ ] ✅ Shows billing information (if applicable)

**Success Criteria**: ✅ Billing page loads without errors

---

## 🔗 Step 9: Test Alert Channel Creation

### 9.1 Create Email Alert Channel

**Steps**:
1. Go to Settings → Alerts
2. Click "Add Channel" or "Create Channel"
3. Select "Email"
4. Fill in:
   - **Name**: `Test Email Alerts`
   - **Email Address**: `your-email@example.com`
5. Click "Save" or "Create"

**Expected**:
- [ ] ✅ Channel created successfully
- [ ] ✅ Appears in channels list
- [ ] ✅ Shows as "Enabled"

### 9.2 Create Webhook Channel (Optional)

**Steps**:
1. Click "Add Channel"
2. Select "Webhook"
3. Fill in:
   - **Name**: `Test Webhook`
   - **URL**: `https://webhook.site/unique-url` (get from https://webhook.site)
   - **Events**: Select events to subscribe to
4. Click "Test" to verify webhook
5. Click "Save"

**Expected**:
- [ ] ✅ Webhook test successful
- [ ] ✅ Channel created

**Success Criteria**: ✅ Alert channels can be created

---

## 🧮 Step 10: Test Anomaly Detection

### 10.1 Send Multiple Pings with Varying Durations

**Create baseline** (normal runs):
```bash
TOKEN="pg_automation_test"

# Send 10 normal pings (1000-1200ms)
for i in {1..10}; do
  DURATION=$((1000 + RANDOM % 200))
  curl -s "http://localhost:3001/api/ping/${TOKEN}?state=success&durationMs=${DURATION}&exitCode=0"
  echo "Sent ping $i with duration ${DURATION}ms"
  sleep 2
done
```

### 10.2 Send Anomalous Ping

**Send very slow run** (should trigger anomaly):
```bash
# Send abnormally slow ping (5000ms = 5 seconds)
curl -s "http://localhost:3001/api/ping/${TOKEN}?state=success&durationMs=5000&exitCode=0"
```

### 10.3 Verify Anomaly Detection

**In browser**:
1. Go to monitor details page
2. Look for anomaly indicator (⚠️ or similar)
3. Check incidents page for anomaly incident

**Expected**:
- [ ] ✅ System detects anomaly (duration > 3 standard deviations from mean)
- [ ] ✅ Creates incident with type "ANOMALY" (if configured)
- [ ] ✅ Shows warning in monitor dashboard

**Success Criteria**: ✅ Anomaly detection works

---

## 🗄️ Step 11: Test Output Capture

### 11.1 Send Ping with Large Output

```bash
TOKEN="pg_automation_test"

# Create large output file
cat > /tmp/test-output.log << 'EOF'
[2025-10-13 12:00:00] Starting database backup...
[2025-10-13 12:00:01] Connecting to PostgreSQL...
[2025-10-13 12:00:02] Connected successfully
[2025-10-13 12:00:03] Backing up table: users (1.2GB)
[2025-10-13 12:00:45] Backing up table: monitors (450MB)
[2025-10-13 12:01:12] Backing up table: runs (3.4GB)
[2025-10-13 12:03:34] Backing up table: incidents (890MB)
[2025-10-13 12:04:56] Backup completed successfully
[2025-10-13 12:04:57] Total size: 5.94GB
[2025-10-13 12:04:58] Uploading to S3...
[2025-10-13 12:07:23] Upload completed
[2025-10-13 12:07:24] Verifying backup integrity...
[2025-10-13 12:07:45] Verification successful
[2025-10-13 12:07:46] Backup process completed
EOF

# Send with output
curl -X POST \
  -H "Content-Type: text/plain" \
  --data-binary @/tmp/test-output.log \
  "http://localhost:3001/api/ping/${TOKEN}?state=success&durationMs=1234&exitCode=0"
```

### 11.2 View Output in Dashboard

**In browser**:
1. Go to monitor runs page
2. Find the run with output
3. Click "View Output" or output icon

**Expected**:
- [ ] ✅ Output viewer modal opens
- [ ] ✅ Shows full output text
- [ ] ✅ Output is readable and properly formatted
- [ ] ✅ Can scroll through output
- [ ] ✅ Shows "Download" option

**Success Criteria**: ✅ Output capture and viewing works

---

## 🔍 Step 12: Test Search and Filtering

### 12.1 Test Monitor Search

**On monitors page**:
1. Look for search box
2. Type monitor name
3. Verify results filter

**Expected**:
- [ ] ✅ Search filters monitors in real-time
- [ ] ✅ Shows matching monitors only

### 12.2 Test Incident Filtering

**On incidents page**:
1. Use status filter (All, Open, Acknowledged, Resolved)
2. Verify filtering works

**Expected**:
- [ ] ✅ Filter shows only incidents of selected status
- [ ] ✅ Count updates correctly

**Success Criteria**: ✅ Search and filtering work

---

## 📱 Step 13: Test Mobile Responsiveness

### 13.1 Test on Mobile Device (or Browser DevTools)

**In browser DevTools**:
1. Press `F12`
2. Toggle device toolbar (`Ctrl+Shift+M`)
3. Select "iPhone 12 Pro" or similar

### 13.2 Test All Pages on Mobile

Visit each page and verify:
- [ ] ✅ Homepage - readable, buttons accessible
- [ ] ✅ Signin page - form usable
- [ ] ✅ Dashboard - sidebar collapses to hamburger menu
- [ ] ✅ Monitors list - scrollable, clickable
- [ ] ✅ Monitor details - all info visible
- [ ] ✅ Incidents - list readable
- [ ] ✅ Settings - accessible

**Success Criteria**: ✅ All pages usable on mobile

---

## 🔐 Step 14: Test Authentication Edge Cases

### 14.1 Test Logout

**Steps**:
1. Click user menu (top right)
2. Click "Logout"

**Expected**:
- [ ] ✅ Logs out successfully
- [ ] ✅ Redirects to signin page
- [ ] ✅ Cannot access `/app/*` pages without login

### 14.2 Test Protected Routes

**After logout**:
1. Try to visit: `http://localhost:3001/app/monitors`

**Expected**:
- [ ] ✅ Redirects to signin page
- [ ] ✅ Shows "You must be signed in" or similar message

### 14.3 Test Invalid Credentials

**On signin page**:
1. Enter email: `fake@example.com`
2. Enter password: `wrongpassword`
3. Click "Sign In"

**Expected**:
- [ ] ✅ Shows error message: "Invalid credentials" or similar
- [ ] ✅ Does NOT log in
- [ ] ✅ Stays on signin page

**Success Criteria**: ✅ Authentication security works

---

## 🎨 Step 15: Test UI/UX Details

### 15.1 Test Loading States

**On any page**:
- [ ] ✅ Shows loading spinner or skeleton while loading
- [ ] ✅ Content appears smoothly after load
- [ ] ✅ No flash of unstyled content

### 15.2 Test Toast Notifications

**Perform actions and watch for toasts**:
- [ ] ✅ Create monitor → Success toast
- [ ] ✅ Update setting → Success toast
- [ ] ✅ Error occurs → Error toast
- [ ] ✅ Toasts auto-dismiss after 3-5 seconds

### 15.3 Test Buttons and Links

**Verify all interactive elements**:
- [ ] ✅ Buttons show hover state
- [ ] ✅ Buttons show pressed state
- [ ] ✅ Disabled buttons look disabled
- [ ] ✅ Links underline or change color on hover

**Success Criteria**: ✅ UI polish is good

---

## 🗄️ Step 16: Verify Database State

### 16.1 Check Database Directly

```bash
# Connect to PostgreSQL
docker exec -it pulseguard-postgres psql -U postgres -d pulseguard_e2e

# Run queries to verify data
```

**SQL Queries to run**:

```sql
-- Check monitors
SELECT id, name, status, "scheduleType" FROM "Monitor";

-- Check recent runs
SELECT id, state, "durationMs", "exitCode", "createdAt" 
FROM "Run" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Check incidents
SELECT id, kind, status, summary 
FROM "Incident" 
ORDER BY "openedAt" DESC 
LIMIT 5;

-- Check users
SELECT id, email, name FROM "User";

-- Exit
\q
```

**Expected**:
- [ ] ✅ All tables have data
- [ ] ✅ Data matches what you see in UI
- [ ] ✅ No NULL values where they shouldn't be

**Success Criteria**: ✅ Database state is correct

---

## 🧹 Step 17: Test Error Handling

### 17.1 Test Invalid API Requests

```bash
# Test with invalid token
curl -i "http://localhost:3001/api/ping/invalid_token_xyz"

# Expected: 404 Not Found
```

```bash
# Test with invalid state
curl -i "http://localhost:3001/api/ping/pg_automation_test?state=invalid"

# Expected: 400 Bad Request or ignores invalid state
```

### 17.2 Test Network Errors (in UI)

**In browser DevTools**:
1. Open Network tab
2. Click "Offline" to simulate no internet
3. Try to load a page or submit a form

**Expected**:
- [ ] ✅ Shows error message
- [ ] ✅ Doesn't crash
- [ ] ✅ Allows retry

**Success Criteria**: ✅ Graceful error handling

---

## 📊 Step 18: Performance Check

### 18.1 Check Page Load Times

**In browser DevTools**:
1. Open Network tab
2. Reload pages
3. Check "Load" time at bottom

**Expected**:
- [ ] ✅ Homepage: < 2 seconds
- [ ] ✅ Dashboard: < 3 seconds
- [ ] ✅ Monitor details: < 2 seconds

### 18.2 Test with Multiple Monitors

**If you have time, create 10+ monitors and verify**:
- [ ] ✅ Monitors list loads quickly
- [ ] ✅ Filtering/search is fast
- [ ] ✅ No lag in UI

**Success Criteria**: ✅ Performance is acceptable

---

## ✅ Final Verification Checklist

Before considering testing complete:

### Core Features
- [ ] ✅ Homepage loads and looks good
- [ ] ✅ Signin/Signup works
- [ ] ✅ Can create monitors
- [ ] ✅ Can view monitor details
- [ ] ✅ Ping API works (all 4 states)
- [ ] ✅ Runs appear in dashboard
- [ ] ✅ Incidents are created and manageable
- [ ] ✅ Analytics display correctly
- [ ] ✅ Settings pages load
- [ ] ✅ Alert channels can be created

### Data Integrity
- [ ] ✅ Database stores all data correctly
- [ ] ✅ Runs recorded with correct timestamps
- [ ] ✅ Statistics calculated correctly
- [ ] ✅ Output capture stored and retrievable

### Security
- [ ] ✅ Cannot access protected routes without login
- [ ] ✅ Invalid credentials rejected
- [ ] ✅ Logout works properly
- [ ] ✅ Sessions persist across page reloads

### UX/Polish
- [ ] ✅ Responsive on mobile/tablet/desktop
- [ ] ✅ Loading states present
- [ ] ✅ Toast notifications work
- [ ] ✅ Error messages clear and helpful
- [ ] ✅ No broken layouts
- [ ] ✅ Professional appearance

### API
- [ ] ✅ Ping API returns correct responses
- [ ] ✅ Invalid tokens return 404
- [ ] ✅ Output capture works
- [ ] ✅ Rate limiting doesn't block normal use

---

## 🎉 Success! What You've Verified

If all above tests pass, you've verified:

✅ **Authentication system** works perfectly  
✅ **Monitor management** is fully functional  
✅ **Ping API** handles all states correctly  
✅ **Incident management** creates and tracks incidents  
✅ **Analytics** calculate and display metrics  
✅ **Output capture** stores and displays job output  
✅ **Alert channels** can be configured  
✅ **UI/UX** is polished and responsive  
✅ **Database** stores all data correctly  
✅ **Security** protects routes and validates inputs  
✅ **Performance** is acceptable  
✅ **Error handling** is graceful  

---

## 🚀 You're Ready to Launch!

Your application is **thoroughly tested and working**. Next steps:

1. ✅ Review `REQUIREMENTS_FROM_USER.md` for deployment needs
2. ✅ Decide on hosting platform and services
3. ✅ Provide configuration details
4. ✅ Deploy to production!

---

## 🐛 If Something Doesn't Work

### Common Issues:

**Issue**: Server won't start
- **Fix**: Check if port 3001 is in use: `lsof -i :3001`
- **Fix**: Kill process and restart

**Issue**: Database connection error
- **Fix**: Ensure PostgreSQL container is running: `docker ps`
- **Fix**: Check `.env.local` has correct DATABASE_URL

**Issue**: Signin doesn't work
- **Fix**: Check if test user exists: Run seed script again
- **Fix**: `cd packages/db && DATABASE_URL=... bun run seed`

**Issue**: Ping API returns 404
- **Fix**: Token might not exist, use `pg_automation_test` or create new monitor

**Issue**: UI looks broken
- **Fix**: Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
- **Fix**: Clear browser cache

**Issue**: Images/assets not loading
- **Fix**: Check console for 404 errors
- **Fix**: Ensure MinIO is running for S3 storage

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors (F12 → Console tab)
2. Check terminal for server errors
3. Check Docker logs: `docker logs pulseguard-postgres`
4. Come back and ask me - I'll help debug!

---

**Testing Time**: 30-45 minutes if following all steps  
**Result Expected**: ✅ All features working, ready for production

**Happy Testing!** 🎉

