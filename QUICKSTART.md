# 🚀 Quick Start Guide - Family Data Platform

## ⚡ Get Started in 5 Minutes

### Step 1: Start the Server (1 minute)

Open PowerShell in the project folder and run:

```powershell
npx -y http-server -p 8081
```

You should see:
```
Available on:
  http://127.0.0.1:8081
```

### Step 2: Open in Browser (30 seconds)

Open your browser and go to:
```
http://localhost:8081
```

### Step 3: Login (30 seconds)

**For Admin Access:**
- Username: `admin`
- Password: `admin123`

**For Staff Access:**
- Username: `staff`
- Password: `staff123`

### Step 4: Start Using! (3 minutes)

#### As Admin:
1. Click "➕ Add Family"
2. Fill in family details
3. Click "Save Family"
4. Family appears in table!

#### As Staff:
1. Fill in the add family form
2. Click "💾 Save Family"
3. Use search to find families

---

## 🔥 Important First Steps

### 1. Change Default Passwords ⚠️

The default passwords are publicly known. Change them immediately!

### 2. Set Up Firebase (Optional but Recommended)

For multi-user access from different locations:

1. Go to https://console.firebase.google.com/
2. Create new project
3. Enable Realtime Database
4. Copy configuration to `firebase-config.js`

See [README.md](file:///C:/Users/Hijaz/.gemini/antigravity/scratch/family-data-platform/README.md) for detailed instructions.

### 3. Set Up Backups

1. Login as Admin
2. Click "💾 Backup"
3. Download JSON/CSV
4. Save to Dialog router USB

---

## 📱 Access from Phone/Tablet

1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. On your phone/tablet, open browser and go to:
   ```
   http://YOUR_IP_ADDRESS:8081
   ```
   Example: `http://192.168.1.100:8081`

---

## 🆘 Quick Troubleshooting

### Login Button Stuck on "Logging in..."

**Solution:** Make sure you're using `http://localhost:8081` not `file:///`

### Data Not Saving

**Solution:** 
1. Check browser console (F12)
2. Verify localStorage is enabled
3. Try different browser

### Cannot Access from Other Devices

**Solution:**
1. Check firewall settings
2. Ensure devices are on same network
3. Use computer's IP address, not "localhost"

---

## 📞 Need Help?

1. Check [README.md](file:///C:/Users/Hijaz/.gemini/antigravity/scratch/family-data-platform/README.md) for detailed documentation
2. Check [walkthrough.md](file:///C:/Users/Hijaz/.gemini/antigravity/brain/3807ab9b-c585-46ef-acee-ef32f3271ad0/walkthrough.md) for complete feature guide
3. Open browser console (F12) to see error messages

---

## ✅ You're All Set!

The platform is ready to use. Start adding family data and enjoy the secure, modern interface!

**Default Features Available:**
- ✅ Add, edit, delete families (Admin)
- ✅ Search and filter
- ✅ Export to JSON/CSV
- ✅ Backup and restore
- ✅ Role-based access
- ✅ Mobile responsive design

**Next Steps:**
1. Add your first family
2. Test the search function
3. Create a backup
4. Set up Firebase for cloud storage
