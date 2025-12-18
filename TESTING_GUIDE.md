# Testing Guide - YouTubeAuto.ai

Complete guide to test all features of the application.

## 🧪 Test Scenarios

### 1. Authentication Flow

#### Test Signup
1. Go to `/signup`
2. Fill in:
   - Name: `Test User`
   - Email: `test@example.com`
   - Phone: `+91 9876543210`
   - Password: `testpass123`
   - Confirm Password: `testpass123`
3. Click "Create Account"
4. ✅ Should redirect to `/onboarding`

#### Test Login
1. Go to `/login`
2. Enter:
   - Email: `test@example.com`
   - Password: `testpass123`
3. Click "Sign In"
4. ✅ Should redirect to `/dashboard`

#### Test Admin Login
1. Go to `/signup` (if not exists) or `/login`
2. Use:
   - Email: `admin@youtubeauto.ai`
   - Password: `admin123456`
3. ✅ Should see "Admin" button in navigation
4. ✅ Plan should show "Admin" with unlimited features

### 2. Onboarding Flow

#### Complete Onboarding
1. After signup, you'll be at `/onboarding`

**Step 1: Channel Setup**
- Channel Name: `Tech Hindi Channel`
- Category: `Science & Tech`
- Click "Continue"

**Step 2: Style Preferences**
- Language: `Hindi`
- Voice: `Male Hindi`
- Default Tags: `AI, Tech, Hindi, Tutorial`
- Privacy: `Public`
- Upload Time: `6:00 PM`
- Click "Continue"

**Step 3: Content Strategy**
- Content Strategy: `AI Tools & Technology - covering latest AI updates, tool reviews, and tutorials in Hindi`
- Video Frequency: `Daily`
- Click "Start Auto Schedule"

✅ Should redirect to dashboard with:
- Channel created
- 30 videos generated in calendar
- Day 1 video status: "Generating"
- Days 2-30: "Scheduled"

### 3. Dashboard Features

#### View Stats
1. Go to `/dashboard`
2. ✅ Should see 4 stat cards:
   - Videos This Month
   - Total Views
   - Watch Time
   - Avg. Engagement

#### Content Calendar
1. Scroll to calendar section
2. ✅ Should see 10 videos listed
3. ✅ Each video should have:
   - Title
   - Date
   - Status badge (Generating, Scheduled, Live)

#### Recent Videos
1. Check right sidebar
2. ✅ Should show published videos (if any)
3. ✅ Each with thumbnail, views, likes, comments

#### Quick Actions
1. Check quick action buttons
2. ✅ Should have:
   - New Prompt
   - Regenerate Calendar
   - View Full Calendar
   - Channel Settings

### 4. Channel Management

#### View Channels
1. Go to `/dashboard/channels`
2. ✅ Should see your created channel
3. ✅ Should show plan usage:
   - Channels: 1 / 1 (Free) or 1 / Unlimited (Admin)
   - Videos This Month: count
   - Current Plan badge

#### Edit Channel Settings
1. Click "Settings" on a channel
2. ✅ Dialog opens with settings:
   - Content Mode
   - Master Prompt
   - Video Frequency
   - Posting Time
   - Voice settings
   - Automation toggles
3. Change settings and click "Save Changes"

#### Add New Channel
1. Click "Add Channel" button
2. ✅ Form appears
3. Fill in channel URL
4. ✅ For Free plan: Should show limit reached
5. ✅ For Admin: Can add unlimited channels

### 5. Admin Panel (Admin Only)

#### Access Admin
1. Login as `admin@youtubeauto.ai`
2. Click "Admin" in navigation
3. Go to `/admin`

#### View Business Metrics
✅ Should see:
- Total Users count
- Monthly Recurring Revenue (MRR)
- Videos Generated
- Conversion Rate

#### View Charts
✅ Should see:
- Revenue chart (last 6 months)
- User growth chart (last 6 months)

#### View Recent Users
✅ Should see table with:
- User names
- Email addresses
- Plan types
- Join dates
- Action buttons (View, Edit, Delete)

#### System Health
✅ Should see:
- API Server status
- Database status
- AI Service status
- Video Generator status
- Storage status
- Uptime percentage

### 6. Navigation & Routes

#### Test Protected Routes
1. Logout from account
2. Try accessing:
   - `/dashboard` → ✅ Redirects to `/login`
   - `/dashboard/channels` → ✅ Redirects to `/login`
   - `/admin` → ✅ Redirects to `/login`

#### Test Admin Routes
1. Login as regular user
2. Try accessing `/admin` → ✅ Redirects to `/dashboard`
3. Login as admin
4. Access `/admin` → ✅ Shows admin panel

### 7. Logout

1. Click user icon in header
2. Click "Log out"
3. ✅ Should redirect to `/login`
4. ✅ Session should be cleared
5. ✅ Accessing `/dashboard` redirects to login

## 🔍 Data Verification

### Check localStorage
Open browser console and run:

```javascript
// View all users
console.log(JSON.parse(localStorage.getItem('users')))

// View current user
console.log(JSON.parse(localStorage.getItem('currentUser')))

// View all channels
console.log(JSON.parse(localStorage.getItem('channels')))

// View all videos
console.log(JSON.parse(localStorage.getItem('videos')))

// View passwords (for testing only)
console.log(JSON.parse(localStorage.getItem('passwords')))
```

### Expected Data Structure

**Users:**
```json
[
  {
    "id": "user-123456789",
    "email": "test@example.com",
    "name": "Test User",
    "phone": "+91 9876543210",
    "role": "user",
    "plan": "free",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "hasCompletedSetup": true
  }
]
```

**Channels:**
```json
[
  {
    "id": "channel-123456789",
    "userId": "user-123456789",
    "name": "Tech Hindi Channel",
    "subscribers": 0,
    "category": "Science & Tech",
    "language": "hindi",
    "voice": "male-hindi",
    "defaultTags": "AI, Tech, Hindi, Tutorial",
    "privacy": "public",
    "uploadTime": "18:00",
    "contentStrategy": "AI Tools & Technology",
    "isActive": true
  }
]
```

**Videos:**
```json
[
  {
    "id": "video-123456789-0",
    "channelId": "channel-123456789",
    "title": "Top 5 AI Tools 2026 Hindi | AI Tools & Technology",
    "status": "generating",
    "scheduledDate": "2024-01-15T10:00:00.000Z",
    "views": 0,
    "likes": 0,
    "comments": 0,
    "thumbnail": "/ai-tools-thumbnail.png",
    "topic": "Top 5 AI Tools 2026 Hindi"
  }
]
```

## 🐛 Common Issues

### Issue: No videos showing in dashboard
**Solution**: Complete onboarding flow to generate 30-day schedule

### Issue: Admin panel not accessible
**Solution**: Use email `admin@youtubeauto.ai` when signing up or logging in

### Issue: Data disappeared after refresh
**Solution**: Check if browser cleared localStorage. Data persists per browser/domain.

### Issue: Can't add more channels
**Solution**: Free plan limits to 1 channel. Upgrade plan or use admin account.

## ✅ Test Checklist

Copy this checklist to track your testing:

- [ ] Signup works
- [ ] Login works
- [ ] Admin login works
- [ ] Onboarding step 1 complete
- [ ] Onboarding step 2 complete
- [ ] Onboarding step 3 complete
- [ ] Dashboard loads with data
- [ ] Stats show correct numbers
- [ ] Calendar shows 30 videos
- [ ] Recent videos display
- [ ] Channel management page works
- [ ] Channel settings can be edited
- [ ] Admin panel accessible (admin only)
- [ ] Admin stats display correctly
- [ ] Charts render properly
- [ ] User table shows data
- [ ] System health indicators work
- [ ] Logout works
- [ ] Protected routes redirect
- [ ] Admin routes restrict access
- [ ] localStorage data persists
- [ ] Responsive design works on mobile

## 📊 Performance Testing

Test app performance:
1. Open DevTools
2. Go to Lighthouse tab
3. Run audit
4. ✅ Should score:
   - Performance: 90+
   - Accessibility: 90+
   - Best Practices: 90+
   - SEO: 90+

## 🎯 User Acceptance Testing

Share with beta users:
1. Sign up flow - Is it clear?
2. Onboarding - Is it intuitive?
3. Dashboard - Is information useful?
4. Navigation - Is it easy to find things?
5. Design - Does it look professional?

---

**Happy Testing! 🚀**
