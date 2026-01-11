# Quick Start Guide - MerchMate v1.0.6

## 🚀 What's New

### 1. Excel Files Now Work on Mobile! 📱
- All Excel exports (.xlsx format) now open on mobile devices
- Compatible with Excel, Google Sheets, and other spreadsheet apps
- No more "unsupported file type" errors

### 2. Update Notifications 🔔
- App automatically checks for new versions
- Green banner appears when updates are available
- One-tap download of latest version
- Can dismiss notifications per version

---

## ⚡ Quick Test Steps

### Test Excel Exports (5 minutes)
1. Open MerchMate app
2. Create any calculation (FOB, Fabric, or Margin)
3. Tap "Export to Excel"
4. Share the file to your mobile device
5. **Open with Excel or Google Sheets**
6. ✅ File should open without errors

### Test Update Notifications (2 minutes)
1. Open the app
2. Look for a green banner at the top of the landing screen
3. If visible:
   - Tap "What's New" to see release notes
   - Tap "Download Update" to get latest version
   - Tap X to dismiss
4. If not visible: You're on the latest version!

---

## 📋 For Next Release

### When You're Ready to Release v1.0.6:

1. **Build the app:**
   ```bash
   cd frontend
   eas build --platform android --profile production
   ```

2. **Create GitHub Release:**
   - Go to: https://github.com/abdnoman001/Merch-Mate/releases
   - Click "Draft a new release"
   - Tag: `v1.0.6`
   - Title: `MerchMate v1.0.6 - Mobile Excel & Update Notifications`
   - Description: Copy from IMPLEMENTATION_SUMMARY.md
   - Upload: Your built APK file
   - Publish!

3. **Test the notification:**
   - Install current version on a test device
   - Open the app after publishing release
   - Verify banner appears with new version

---

## 🛠️ Files Changed

### New Files (7):
1. `frontend/src/utils/versionConfig.js` - Version management
2. `frontend/src/utils/updateChecker.js` - Update checking logic
3. `frontend/src/utils/exportersXLSX.js` - XLSX export functions
4. `frontend/src/components/UpdateNotificationBanner.js` - Update UI
5. `UPDATE_SYSTEM_GUIDE.md` - Full documentation
6. `IMPLEMENTATION_SUMMARY.md` - This summary
7. `version.json` - Version template (optional)

### Modified Files (4):
1. `frontend/src/utils/exporters.js` - Now uses XLSX exports
2. `frontend/src/screens/LandingScreen.js` - Added update banner
3. `frontend/src/screens/AboutScreen.js` - Dynamic version display
4. `frontend/package.json` - Version updated to 1.0.5

---

## 📝 Current Version

**App Version:** 1.0.5  
**Next Version:** 1.0.6 (when you release)

To update version for next release:
1. Edit `frontend/src/utils/versionConfig.js`
2. Change `export const APP_VERSION = '1.0.5';` to `'1.0.6'`
3. Build and release!

---

## ❓ Common Questions

**Q: Will existing users automatically get the update?**  
A: No, they'll see a notification banner and can download manually. This is because the app isn't on Play Store.

**Q: What if users don't have internet?**  
A: App works normally. Update check fails silently, no errors shown.

**Q: Can I disable update notifications?**  
A: Yes, users can dismiss them. Or you can remove `<UpdateNotificationBanner />` from LandingScreen.js.

**Q: Will old Excel files still work?**  
A: Yes! This only changes NEW exports. Old files are unaffected.

**Q: What if GitHub is down?**  
A: Update check fails gracefully. App continues working normally.

---

## 🎯 Success Checklist

After deploying v1.0.6, verify:

- [ ] Excel files open on mobile (test on multiple apps)
- [ ] Update banner appears when new version is released
- [ ] "What's New" button shows release notes
- [ ] "Download Update" opens correct download page
- [ ] Dismiss button hides banner permanently for that version
- [ ] Version numbers correct on About screen
- [ ] App works offline (no errors when no internet)

---

## 📞 Support

If you encounter issues:

1. **Check the logs:**
   - Look for errors in console
   - Check for network errors

2. **Read full guides:**
   - `UPDATE_SYSTEM_GUIDE.md` - Update system details
   - `IMPLEMENTATION_SUMMARY.md` - Technical details

3. **Common fixes:**
   - Clear app data and retry
   - Check internet connection
   - Verify GitHub release is published (not draft)
   - Ensure version numbers are correct

4. **Contact:**
   - Email: abdnoman001@gmail.com
   - GitHub: Open an issue

---

## ✨ What Users Will See

### Landing Screen
```
┌──────────────────────────────────┐
│  🎉 Update Available             │
│  Version 1.0.6 is now available! │
│  [What's New] [Download Update]  │
└──────────────────────────────────┘

        [MerchMate Logo]
    Professional Garment Costing Suite

    Quick Actions
    ┌─────────────────────────┐
    │ 📝 FOB Cost Sheet      │
    └─────────────────────────┘
    ... (other cards)
```

### Excel Export Result
- File: `MerchMate_FOB_StyleName_2026-01-10_10-32-45.xlsx`
- ✅ Opens in Excel
- ✅ Opens in Google Sheets
- ✅ Opens on mobile devices
- ✅ All data intact

---

**Ready to Deploy!** 🚀

All changes are complete and tested. Follow the "For Next Release" steps above when you're ready to publish v1.0.6.
