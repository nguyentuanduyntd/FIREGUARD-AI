# FireGuard AI - Performance, Tracking & Automation Orchestration

This document details the newly added backend services, background workers, REST controllers, unit tests, and React pages implemented to finalize the FireGuard AI platform features.

---

## 1. Daily Maintenance Scanner

### 📂 Files Created & Modified
- **Domain:** [EquipmentAsset.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.Domain/Entities/Catalog/EquipmentAsset.cs) - Added `LastMaintenanceDate` and `NextMaintenanceDate`.
- **Entity:** [MaintenanceReminder.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.Domain/Entities/Services/MaintenanceReminder.cs) - Tracks reminder level, schedule date, and customer response.
- **Service:** [MaintenanceReminderService.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.Infrastructure/Services/MaintenanceReminderService.cs) - Daily scanner identifying upcoming equipment checks (Overdue, 3Days, 7Days, 30Days).
- **Controller:** [MaintenanceReminderController.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.API/Controllers/MaintenanceReminderController.cs) - Endpoints to fetch active recommendations and accept/postpone schedules.
- **Frontend Page:** [MaintenanceTracking.tsx](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/frontend/src/pages/MaintenanceTracking.tsx) - Interactive admin/client views for response processing.

### ⚙️ Workflow & Idempotency
1. **Hangfire Cron Job:** Runs daily (`Cron.Daily`). It scans deployed customer assets.
2. **Bucket Classification:** Grouping into Overdue, 3Days, 7Days, and 30Days.
3. **Idempotency Guarantee:** Checks the database for existing reminders of the matching type and target cycle date before saving, ensuring customers never get duplicate notifications.
4. **Draft Request Auto-Creation:** If matching, automatically creates a draft `ServiceRequest` in `Created` status.
5. **Customer Responses:**
   - **Accept:** Moves the draft ticket to `AwaitingDispatch` (triggering the AI dispatch workflow).
   - **Decline/Postpone:** Automatically cancels the draft ticket.

---

## 2. Monthly Technician KPI Performance Analyzer

### 📂 Files Created & Modified
- **Entity:** [TechnicianKpi.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.Domain/Entities/Services/TechnicianKpi.cs) - Stores monthly scores, AI summaries, and audit trail attributes.
- **Service:** [TechnicianKpiService.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.Infrastructure/Services/TechnicianKpiService.cs) - Monthly calculations aggregating completed jobs, customer ratings, late arrivals, and check-in times.
- **Controller:** [KpiController.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.API/Controllers/KpiController.cs) - Endpoints for adjusting scores (with reasons), approving bonuses, and checking leaderboards.
- **Frontend Page:** [KpiDashboard.tsx](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/frontend/src/pages/KpiDashboard.tsx) - Performance review interface.

### ⚙️ Core Scoring Rules
- **Weighted Formula:** Raw score (0-100) combining Job Count (25%), Rating (20%), Acceptance Rate (15%), First-Time Fix (15%), On-Time Rate (15%), and Compliance (10%).
- **AI Recommendation:** Auto-generates summary paragraphs suggesting bonuses (e.g. 2,000,000 VND for >= 90 scores) or warning triggers for low performance.
- **Administrative Control:** Admins make final approval decisions and can override scores with mandatory audit notes. AI does not automatically deduct pay or terminate contracts.

---

## 3. Real-Time Google Maps Integration & Dispatching

### 📂 Files Created & Modified
- **Entity:** [TechnicianGpsLog.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.Domain/Entities/Services/TechnicianGpsLog.cs) - Tracks historical GPS location logs.
- **Service:** [GoogleMapsService.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.Infrastructure/Services/GoogleMapsService.cs) - Google Maps Distance Matrix client with offline fallback.
- **Controller:** [MapController.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.API/Controllers/MapController.cs) - Throttled location updates, online technicians queries, and history purging.
- **Frontend Page:** [MapDashboard.tsx](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/frontend/src/pages/MapDashboard.tsx) - Digital maps showing active incidents, online technician pins, routes, and ETA calculations.

### ⚙️ Location Tracking Policies
1. **On-Duty Constraint:** Location collection is strictly disabled if the technician is off-duty.
2. **Log Throttling:** GPS coordinate log writing is limited to a maximum frequency of once every 15 seconds to optimize database space.
3. **Data Purging Policy:** GPS history older than 7 days is automatically purged to protect privacy and optimize storage.
4. **Offline Fallback:** If the Google Maps API Key is not set in environment variables, the system automatically uses the Haversine formula and average driving speed estimates.

---

## 4. Comprehensive Admin Dashboard

### 📂 Files Created & Modified
- **Model:** [AdminDashboardDto.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.Application/Common/Models/AdminDashboardDto.cs) - Data contract wrapping financials, quotations, projects, repairs, and chart lists.
- **Service:** [DashboardService.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.Infrastructure/Services/DashboardService.cs) - Query handler utilizing memory caching to aggregate statistics without N+1 query loops.
- **Controller:** [DashboardController.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.API/Controllers/DashboardController.cs) - Date filter and cache invalidation endpoint.
- **Frontend Page:** [Dashboard.tsx](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/frontend/src/pages/Dashboard.tsx) - Responsive analytics workspace drawing SVG-rendered charts and inventory/maintenance status alerts.

---

## 5. Reports Export Center

### 📂 Files Created & Modified
- **Entity:** [ReportExport.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.Domain/Entities/Services/ReportExport.cs) - Stores report types, download keys, and job statuses.
- **Service:** [ReportService.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.Infrastructure/Services/ReportService.cs) - Asynchronous export worker building CSV files in the background and notifying operators via SignalR notifications.
- **Controller:** [ReportController.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.API/Controllers/ReportController.cs) - REST endpoints managing requests and serving temporary download URLs.
- **Frontend Page:** [ReportManagement.tsx](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/frontend/src/pages/ReportManagement.tsx) - Exposes search queries and lets managers request background exports.

---

## 6. Security Audit Log Engine

### 📂 Files Created & Modified
- **Entity:** [AuditLog.cs](file:///c:/Users/Mr%20VU/Desktop/Ung dung PCCC/fireguard-ai/backend/src/FireGuard.Domain/Entities/Services/AuditLog.cs) - Holds immutable logging entries with Operator, IP Address, Action, Module, and Before/After snapshots.
- **Service:** [AuditService.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.Infrastructure/Services/AuditService.cs) - Interceptor handler recursively masking passwords, API tokens, and stripping binary payloads before database serialization.
- **Controller:** [AuditController.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/src/FireGuard.API/Controllers/AuditController.cs) - Exposes queries and retention purge methods.
- **Frontend Page:** [AuditLogViewer.tsx](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/frontend/src/pages/AuditLogViewer.tsx) - Table listing logs, details modal showing side-by-side JSON diffs.

---

## 7. Test Suite Implementation

Comprehensive unit tests have been written in the test project using an in-memory database to verify correctness:
1. **[DispatchOrchestrationServiceTests.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/tests/FireGuard.Tests/Services/DispatchOrchestrationServiceTests.cs):** Tests automated dispatch workflows, job acceptance, and guarantees that double assignment is impossible.
2. **[MaintenanceReminderServiceTests.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/tests/FireGuard.Tests/Services/MaintenanceReminderServiceTests.cs):** Validates classification logic, checks idempotency controls, and confirms ticket status transitions.
3. **[TechnicianKpiServiceTests.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/tests/FireGuard.Tests/Services/TechnicianKpiServiceTests.cs):** Tests weighted performance calculation, manual overrides, and approval validations.
4. **[MapServiceTests.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/tests/FireGuard.Tests/Services/MapServiceTests.cs):** Assures Google Maps offline fallback calculations, GPS throttles, and GDPR log purging.
5. **[DashboardServiceTests.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/tests/FireGuard.Tests/Services/DashboardServiceTests.cs):** Validates the query aggregation correctness and memory caching hits.
6. **[ReportServiceTests.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/tests/FireGuard.Tests/Services/ReportServiceTests.cs):** Tests enqueuing background tasks and generating files.
7. **[AuditServiceTests.cs](file:///c:/Users/Mr%20VU/Desktop/Ung%20dung%20PCCC/fireguard-ai/backend/tests/FireGuard.Tests/Services/AuditServiceTests.cs):** Checks recursion rules, redaction masking, and log purging.
