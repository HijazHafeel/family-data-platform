# 🏠 Family Data Management Platform

A secure online platform for entering and managing family data with two separate portals: Admin Dashboard and Data Entry Portal.

## 🌟 Features

### Two Portal System
- **Admin Dashboard** - Full access to view all data, analytics, user management, and system settings
- **Data Entry Portal** - Limited access for staff to add and search family records only

### Security Features
- ✅ Role-based access control (Admin vs Data Entry Staff)
- ✅ Secure login with password hashing (SHA-256)
- ✅ Session management with timeout
- ✅ Firebase integration for secure cloud storage
- ✅ Automatic backup to Dialog router USB
- ✅ Input sanitization to prevent XSS attacks
- ✅ Form validation

### Data Management
- ✅ Add, edit, delete family records (Admin only)
- ✅ Advanced search and filtering
- ✅ Export data as JSON or CSV
- ✅ Backup and restore functionality
- ✅ Real-time data synchronization with Firebase

### Modern UI
- ✅ Beautiful dark theme with glassmorphism effects
- ✅ Responsive design (works on desktop, tablet, mobile)
- ✅ Smooth animations and transitions
- ✅ Toast notifications for user feedback

## 📋 Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Staff Account:**
- Username: `staff`
- Password: `staff123`

⚠️ **IMPORTANT:** Change these passwords after first login!

## 🚀 Quick Start

### Option 1: Use Without Firebase (LocalStorage)

The platform works out of the box using browser localStorage:

1. Open `index.html` in a web browser
2. Login with default credentials
3. Start adding family data!

**Note:** Data is stored in browser localStorage. Each browser/device has separate data.

### Option 2: Use With Firebase (Recommended)

For multi-user access from different locations with automatic cloud backup:

#### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "family-data-platform")
4. Disable Google Analytics (optional)
5. Click "Create Project"

#### Step 2: Set Up Realtime Database

1. In Firebase Console, go to "Build" → "Realtime Database"
2. Click "Create Database"
3. Choose location closest to Sri Lanka (e.g., "asia-southeast1")
4. Start in **Test Mode** (we'll secure it later)
5. Click "Enable"

#### Step 3: Get Firebase Configuration

1. In Firebase Console, click the gear icon → "Project settings"
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register app with a nickname (e.g., "Family Data Web")
5. Copy the `firebaseConfig` object

#### Step 4: Update firebase-config.js

Open `firebase-config.js` and replace the configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

#### Step 5: Secure Your Database

1. In Firebase Console, go to "Realtime Database" → "Rules"
2. Replace with these rules:

```json
{
  "rules": {
    "families": {
      ".read": true,
      ".write": true
    },
    "users": {
      ".read": true,
      ".write": true
    }
  }
}
```

3. Click "Publish"

**Note:** For production, implement proper authentication rules.

#### Step 6: Initialize Default Users

1. Login to the platform
2. The default users will be automatically created in Firebase on first use

## 💾 Backup to Dialog Router USB

### How to Backup

1. Login as Admin
2. Click "Backup" button in the dashboard
3. Or go to `backup-utility.html`
4. Click "Download as JSON" or "Download as CSV"
5. Files will download to your computer

### How to Save to Dialog Router USB

1. **Access your Dialog router:**
   - Open File Explorer
   - Type in address bar: `\\192.168.1.1\USB` (or your router's IP)
   - Or access via router admin panel at http://192.168.1.1

2. **Create backup folder:**
   - Create a folder called "FamilyDataBackups" on the USB drive

3. **Copy backup files:**
   - Move downloaded backup files from Downloads to the USB folder

4. **Verify:**
   - Open the files to ensure they contain your data

### Backup Schedule Recommendation

- **Daily:** If adding data frequently
- **Weekly:** For regular updates
- **Monthly:** For minimal changes

## 📁 Project Structure

```
family-data-platform/
├── index.html                 # Login page
├── admin-dashboard.html       # Admin portal
├── data-entry.html           # Data entry portal
├── backup-utility.html       # Backup utility
├── styles.css                # All styling
├── app.js                    # Core application logic
├── admin-dashboard.js        # Admin portal logic
├── data-entry.js             # Data entry portal logic
├── backup-utility.js         # Backup utility logic
├── firebase-config.js        # Firebase configuration
└── README.md                 # This file
```

## 🔐 Security Best Practices

1. **Change Default Passwords:**
   - Login as admin
   - Change both admin and staff passwords immediately

2. **Use HTTPS:**
   - For production, host on HTTPS server
   - Firebase automatically uses HTTPS

3. **Regular Backups:**
   - Backup data weekly to Dialog router USB
   - Keep multiple backup copies

4. **Secure Firebase:**
   - Implement proper authentication rules
   - Use Firebase Authentication for production

5. **Access Control:**
   - Only give staff accounts to trusted personnel
   - Regularly review user access

## 📊 Family Data Fields

The platform collects:

- Family ID (auto-generated)
- Family Name / Head of Household
- Contact Number
- Email Address
- Full Address (Street, Area, City, Postal Code)
- Number of Members
- Status (Active/Inactive)
- Notes/Comments
- Registration Date (auto-generated)
- Last Modified By (user tracking)

## 🛠️ Troubleshooting

### Firebase Not Working

1. Check if `firebase-config.js` has correct credentials
2. Verify Firebase Realtime Database is enabled
3. Check database rules allow read/write
4. Open browser console (F12) to see errors

### Data Not Saving

1. Check browser console for errors
2. Verify Firebase configuration
3. Try clearing browser cache
4. Check if localStorage is enabled

### Cannot Access Router USB

1. Verify USB drive is connected to router
2. Check router admin panel for USB settings
3. Try accessing router at http://192.168.1.1
4. Ensure file sharing is enabled on router

### Login Not Working

1. Use default credentials: admin/admin123 or staff/staff123
2. Clear browser cache and cookies
3. Try incognito/private browsing mode
4. Check browser console for errors

## 📱 Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Safari
- ⚠️ Internet Explorer (not supported)

## 🌐 Hosting Options

### Local Network Only
- Open `index.html` directly in browser
- Share files via network drive

### Online Hosting (Free Options)
- **Firebase Hosting** (recommended)
- **Netlify**
- **Vercel**
- **GitHub Pages**

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Firebase documentation: https://firebase.google.com/docs
3. Check browser console for error messages

## 📄 License

This project is created for family data management purposes. Feel free to modify and use as needed.

## 🎯 Future Enhancements

Potential features to add:
- User management interface for admins
- Advanced analytics and reports
- Photo uploads for families
- SMS notifications
- Multi-language support
- Advanced search filters
- Data import from Excel
- Automated backup scheduling

---

**Built with ❤️ for secure family data management**
