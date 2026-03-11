# MerchMate v1.0.7 - TNA Calendar, Sample Tracking & Dynamic Dashboard

**Release Date:** March 12, 2026

## What's New

### 1. TNA Calendar (Time & Action Planning)
Full backward-scheduling milestone tracker for order management:
- **10 Default Milestones** - Auto-generated from shipment date (Order Confirmation, Fabric Booking, Trims, PP Sample, Bulk Production, Inspections, Ex-Factory, and more)
- **Auto Status Calculation** - Milestones are color-coded as On-Track, At-Risk (within 3 days), Delayed (overdue), or Completed
- **Push Notifications** - 3-day warning, due-day, and overdue reminders for each milestone
- **Vertical Timeline UI** - Clean timeline view with color-coded dots and status badges
- **Full CRUD** - Create, edit, delete TNA entries and individual milestones
- **Native Calendar Picker** - Date selection via native date picker instead of manual text input

### 2. Sample Tracking
6-stage sample approval workflow from development to shipment:
- **6 Sample Stages** - Development, Proto, PP, Counter, TOP, and Shipment samples
- **Status Flow** - Pending, Submitted, Approved, Rejected, Revision with one-tap status actions
- **Photo Gallery** - Attach photos via camera or gallery to each stage
- **Buyer Comments & Notes** - Per-stage text fields for tracking feedback
- **Horizontal Stepper UI** - Visual progress stepper with numbered stage dots
- **Native Calendar Picker** - Date selection for submitted/approved dates

### 3. Dynamic Dashboard
The landing screen now shows live activity data at a glance:
- **Activity Overview** - 4 tappable stat cards (TNA Orders, TNA Alerts, Active Samples, Awaiting Approval) that navigate directly to the relevant screens
- **TNA Alerts Section** - Top 3 most urgent milestones (delayed/at-risk) with due date, days remaining, and tap-to-open
- **Active Samples Section** - Top 3 in-progress samples showing current stage, status badge, and mini progress bar
- **Auto Refresh** - Data refreshes every time the landing screen comes into focus

### 4. Improved Landing Page
- Redesigned layout with clean section-based organization
- 2x2 grid for Costing Tools (FOB, Fabric Analyzer, Margin Analyzer, History)
- Feature cards for Order Management (TNA Calendar, Sample Tracking) with tag pills
- Sections only appear when relevant data exists

## New Dependencies
- `date-fns@^4.1.0` - Date calculations and formatting
- `expo-image-picker@~17.0.10` - Camera and gallery photo selection
- `expo-notifications@~0.32.16` - Local push notifications for TNA reminders
- `react-native-uuid@^2.0.3` - Unique ID generation
- `@react-native-community/datetimepicker@^8.6.0` - Native calendar date picker

## Technical Details
- AsyncStorage-based CRUD service for both TNA and Sample data
- Backward scheduling algorithm: milestones auto-calculated from shipment date
- Expo Go Android compatibility: lazy-loaded notifications module with runtime environment detection
- Cross-platform date picker: Android uses `display="calendar"`, iOS uses `display="spinner"` in Modal
- Unified calendar state pattern across all date-using screens
- Removed duplicate root-level `package.json` and `node_modules`

## New Files
- `src/utils/storageService.js` - CRUD operations for TNA and Sample data
- `src/utils/tnaNotifications.js` - Push notification scheduling and management
- `src/screens/TNAListScreen.js` - TNA entries list with status filters
- `src/screens/TNACreateScreen.js` - Create TNA with auto-generated milestones
- `src/screens/TNADetailScreen.js` - Timeline view with milestone management
- `src/screens/SampleListScreen.js` - Sample trackers list with filters
- `src/screens/SampleCreateScreen.js` - Create sample tracker with 6 stages
- `src/screens/SampleDetailScreen.js` - Stage detail with status actions and photos

## Bug Fixes
- Fixed Expo Go Android crash when loading expo-notifications
- Fixed date picker compatibility across Android and iOS platforms
- Cleaned up duplicate root-level package.json and node_modules

## Upgrade Instructions

1. Download the latest APK from the link above
2. Install over your existing app (data will be preserved)
3. Or use the in-app update notification to download directly

### For Developers
```bash
cd frontend
npm install
npx expo start
```

---

**Full Changelog:** [v1.0.6...v1.0.7](https://github.com/abdnoman001/Merch-Mate/compare/v1.0.6...v1.0.7)
