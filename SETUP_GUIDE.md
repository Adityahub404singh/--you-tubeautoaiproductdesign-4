# YouTubeAuto.ai - Complete Setup Guide

This guide will help you set up and use the YouTubeAuto.ai platform.

## Quick Start

### 1. Installation

```bash
# Clone or download the project
npm install
npm run dev
```

Visit `http://localhost:3000` to see the landing page.

### 2. Create Your Account

**Regular User:**
1. Click "Get Started" on homepage
2. Enter your details
3. Use any email and password (minimum 8 characters)
4. Complete the onboarding flow

**Admin User:**
1. Click "Get Started" on homepage
2. Use email: `admin@youtubeauto.ai`
3. Use any password (minimum 8 characters)
4. You automatically get admin privileges and unlimited access

## User Flows

### For Content Creators

1. **Sign Up** → Complete onboarding → Access dashboard
2. **Connect Channel** → Set up automation → Review calendar
3. **Monitor Performance** → Adjust settings → Scale up

### For Admins

1. **Sign Up with admin email** → Skip onboarding or complete it
2. **Access Admin Panel** → Click "Admin" in navigation
3. **Monitor Platform** → View metrics, users, system health
4. **Manage Users** → View recent signups and activity

## Pages Overview

### Public Pages
- `/` - Landing page with features and pricing
- `/login` - Login to existing account
- `/signup` - Create new account

### Protected Pages (Requires Login)
- `/dashboard` - Main user dashboard with stats and calendar
- `/dashboard/channels` - Manage multiple YouTube channels
- `/onboarding` - 5-step setup wizard (for new users)

### Admin Pages (Requires Admin Role)
- `/admin` - Admin dashboard with business metrics
  - Total users, MRR, videos generated
  - Revenue and growth charts
  - Recent users table
  - System health monitoring

## Testing the Application

### Test Accounts

**Regular User:**
- Create any account during signup
- Gets Free plan (30 videos/month, 1 channel)

**Admin User:**
- Email: `admin@youtubeauto.ai`
- Password: (any password 8+ chars)
- Gets unlimited everything + admin panel access

### Test Scenarios

1. **Sign Up Flow**
   - Go to `/signup`
   - Fill form and submit
   - Get redirected to `/onboarding`
   - Complete 5 steps
   - Land on `/dashboard`

2. **Login Flow**
   - Go to `/login`
   - Enter credentials
   - Get redirected to `/dashboard`

3. **Admin Flow**
   - Sign up with admin email
   - Complete onboarding or skip
   - Click "Admin" in navigation
   - View admin dashboard

4. **Channel Management**
   - From dashboard, click "Channels"
   - View connected channels
   - Click "Add Channel" to connect new
   - Click "Settings" to configure automation

## Features Explained

### Dashboard
- **Stats Cards**: Views, subscribers, videos, engagement
- **Content Calendar**: 30-day view of scheduled videos
- **Recent Videos**: Latest uploaded content
- **Quick Actions**: New video, edit prompt, view analytics

### Channel Management
- **Multi-channel**: Connect up to plan limit
- **Per-channel Settings**: Each channel has own voice, schedule, prompt
- **Usage Tracking**: Monitor videos generated vs plan limit

### Onboarding Steps
1. **Channel Connection**: Enter YouTube channel URL
2. **Content Mode**: Master prompt (30-day) or daily prompt
3. **Schedule**: Frequency and posting time
4. **Voice Settings**: Language, gender, accent
5. **Automation**: Subtitles, auto-upload, approval workflow

### Admin Panel
- **KPI Cards**: Users, revenue, videos, conversion rate
- **Charts**: Revenue trends, user growth over time
- **User Table**: Recent signups with plan and status
- **System Health**: Monitor services, API status, uptime

## Data Storage

Currently using **localStorage** for demo purposes:
- User accounts stored in browser
- No backend/database required
- Data persists across sessions
- Clears on browser data clear

**For Production:**
- Replace with real database (Supabase/Neon)
- Add proper password hashing
- Implement session management
- Add API routes for CRUD operations

## Customization

### Change Pricing
Edit `components/landing/pricing.tsx`:
```tsx
const plans = [
  { name: "Free", price: "₹0", ... },
  { name: "Pro", price: "₹1,999", ... },
  { name: "Agency", price: "₹7,999", ... },
]
```

### Change Plan Limits
Edit `app/dashboard/channels/page.tsx`:
```tsx
const planLimits = {
  free: { channels: 1, videos: 30 },
  pro: { channels: 5, videos: 300 },
  agency: { channels: "Unlimited", videos: "Unlimited" },
}
```

### Update Theme Colors
Edit `app/globals.css`:
```css
:root {
  --accent: oklch(0.55 0.15 270); /* Change accent color */
  --primary: oklch(0.98 0 0);     /* Change primary color */
}
```

## Download Options

### Option 1: From v0 Interface
1. Click three dots (...) in version box
2. Select "Download ZIP"
3. Extract and run `npm install`

### Option 2: From Code Block
1. Click three dots in code block header
2. Select "Download ZIP"

### Option 3: Clone Repository
```bash
git clone [your-repo-url]
cd v0-you-tube-auto-ai-product-design
npm install
npm run dev
```

## Troubleshooting

**Login not working:**
- Clear localStorage: `localStorage.clear()`
- Create new account

**Can't access admin panel:**
- Make sure you signed up with `admin@youtubeauto.ai`
- Check user object in localStorage has `isAdmin: true`

**Routing issues:**
- Make sure you're on `http://localhost:3000`
- Clear browser cache
- Restart dev server

**Components not loading:**
- Run `npm install` again
- Check console for errors
- Verify all files are present

## Next Steps

1. **Add Real Database**: Replace localStorage with Supabase/Neon
2. **YouTube API**: Integrate actual YouTube API for channel management
3. **Payment Integration**: Add Stripe for subscriptions
4. **Email Service**: Add transactional emails
5. **Video Generation**: Implement actual AI video pipeline
6. **Deploy**: Push to Vercel for production

## Support

Need help? 
- Check the main README.md
- Visit the v0 chat: https://v0.app/chat/jCHeKGlpOsP
- Review the code comments in components

---

Happy building! 🚀
