# 📝 User Signup Feature - Documentation

## Overview

The Family Data Platform now includes a **user registration system** that allows new users to create their own accounts!

## Features

### ✅ Self-Service Registration
- Users can create their own accounts
- No admin intervention needed for staff accounts
- Admin accounts require approval

### ✅ Account Types

**1. Data Entry Staff**
- Can add and search family records
- Immediate access after signup
- No approval required

**2. Administrator**
- Full access to all features
- Requires approval from existing admin
- Status: "Pending" until approved

### ✅ Security Features
- Password strength validation (minimum 6 characters)
- Password confirmation
- Username uniqueness check
- Email validation
- SHA-256 password hashing

## How to Use

### For New Users

#### Step 1: Access Signup Page

Go to: http://localhost:8081/signup.html

Or click "Sign up here" link on the login page

#### Step 2: Fill in the Form

Required fields:
- **Full Name**: Your complete name
- **Username**: Unique username (3+ characters, letters/numbers only)
- **Email**: Valid email address
- **Password**: Strong password (6+ characters)
- **Confirm Password**: Re-enter password
- **Account Type**: Choose Staff or Admin

Optional:
- **Organization/Area**: Your organization or area name

#### Step 3: Submit

Click "Create Account" button

#### Step 4: Login

- **Staff accounts**: Can login immediately
- **Admin accounts**: Must wait for approval from existing admin

### For Admins (Approving New Users)

**Note**: User management interface will be added in a future update. For now, admins can approve users by:

1. Accessing the database (Firebase or localStorage)
2. Finding the pending user
3. Changing `status` from `"pending"` to `"active"`
4. Changing `role` from `"pending-admin"` to `"admin"`

## Screenshots

### Signup Page

![Beautiful signup form with all required fields](file:///C:/Users/Hijaz/.gemini/antigravity/brain/3807ab9b-c585-46ef-acee-ef32f3271ad0/signup_page_1766028513278.png)

**Features shown:**
- Clean, modern design matching the platform theme
- Clear field labels and validation hints
- Account type selection
- Link back to login page

## Technical Details

### Files Created

1. **signup.html** - Signup page interface
2. **signup.js** - Registration logic

### Files Modified

1. **index.html** - Added signup link
2. **app.js** - Updated login to check registered users

### Data Storage

**LocalStorage** (default):
- Users stored in: `platformUsers`
- Format: JSON array

**Firebase** (when configured):
- Users stored in: `users` collection
- Automatic synchronization

### User Data Structure

```json
{
  "id": "USER1734489123456",
  "fullName": "John Silva",
  "username": "johnsilva",
  "email": "john@example.com",
  "password": "hashed_password_here",
  "role": "staff",
  "organization": "Colombo District",
  "status": "active",
  "createdAt": 1734489123456,
  "approvedBy": null
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| Full Name | Minimum 2 characters |
| Username | 3+ characters, alphanumeric + underscore only |
| Email | Valid email format |
| Password | Minimum 6 characters |
| Confirm Password | Must match password |
| Account Type | Required selection |

## Workflow

### Staff Account Creation

```
User fills form → Validates → Creates account → Status: "active" → Can login immediately
```

### Admin Account Creation

```
User fills form → Validates → Creates account → Status: "pending" → Waits for approval → Admin approves → Status: "active" → Can login
```

## Future Enhancements

Planned features:
- [ ] User management interface for admins
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Profile editing
- [ ] Admin approval dashboard
- [ ] User activity logs
- [ ] Role permissions customization

## Testing

### Test Signup Flow

1. **Open signup page**: http://localhost:8081/signup.html
2. **Fill in test data**:
   - Full Name: Test User
   - Username: testuser
   - Email: test@example.com
   - Password: test123
   - Confirm Password: test123
   - Account Type: Data Entry Staff
3. **Submit form**
4. **Verify success message**
5. **Go to login page**
6. **Login with new credentials**

### Test Validation

Try these to test validation:
- Leave fields empty
- Use short username (< 3 chars)
- Use invalid email
- Use short password (< 6 chars)
- Mismatched passwords
- Duplicate username

## Troubleshooting

### "Username already taken"

**Solution**: Choose a different username

### "Account pending approval"

**Solution**: 
- For staff: This shouldn't happen, contact admin
- For admin: Wait for existing admin to approve your account

### Cannot login after signup

**Solution**:
1. Check if you're using the correct credentials
2. Verify account status (should be "active" for staff)
3. Clear browser cache and try again

## Security Notes

⚠️ **Important Security Considerations:**

1. **Password Storage**: Passwords are hashed with SHA-256 before storage
2. **Username Uniqueness**: System prevents duplicate usernames
3. **Admin Approval**: Admin accounts require approval to prevent unauthorized access
4. **Input Validation**: All inputs are validated and sanitized

## Summary

✅ **What's New:**
- Self-service user registration
- Two account types (Staff/Admin)
- Admin approval workflow
- Secure password handling
- Beautiful signup interface

✅ **Benefits:**
- No need for admin to manually create accounts
- Users can register themselves
- Maintains security with admin approval for admin accounts
- Consistent with platform design

The signup feature is now live and ready to use! 🎉
