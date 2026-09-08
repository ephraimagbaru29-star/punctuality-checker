# Punctuality Checker

A secure, full-stack clock-in / clock-out system for students with QR-based registration, device locking, location tracking, and an admin management panel.

---

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Svelte, Vite, JavaScript, CSS |
| Backend   | Node.js, Express.js |
| Database  | Supabase (PostgreSQL) |
| Storage   | Supabase Storage (profile pictures) |
| QR Code   | bwip-js |
| Location  | Browser Geolocation API + LocationIQ |
| Email     | Nodemailer (SMTP) |
| Auth      | JWT (jsonwebtoken) |

---

## Features

### Admin
- Register/login as admin
- Generate QR codes students scan to access the registration page
- Approve or reject pending student registrations
- Suspend / unsuspend students
- View all attendance records (filterable by date)
- Handle device reset requests — approve sends a reset link by email
- Dashboard with live stats (present today, absent, pending approvals, etc.)

### Student
- Register via scanned QR code — account starts as **pending**
- After admin approval, log in with unique **Clock-In ID** + password
- Account is locked to the registered device (IP + browser fingerprint)
- Clock in after **9:00 AM** — clocking in after 9:15 AM marks as **Late**
- Clock out at **5:00 PM** or after freely
- Clocking out **before 5:00 PM** requires selecting a reason:
  - Emergency
  - Not Feeling Good
  - Just Being Tired
- At **5:05 PM** — in-app reminder banner + email notification if not clocked out
- At **5:30 PM** — auto clock-out + marked **absent** if still not clocked out
- Full attendance history with stats
- In-app notification bell
- Request device reset if on a new device

---

## Database Setup

1. Go to your [Supabase project](https://supabase.com) → **SQL Editor**
2. Open and run the full contents of:

```
backend/src/config/schema.sql
```

This creates all tables:
- `admins`
- `qr_codes`
- `students`
- `student_devices`
- `device_reset_requests`
- `attendance`
- `notifications`

---

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in .env with your values (see below)
npm run dev
```

### `.env` variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=Punctuality Checker <your-email@gmail.com>

PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

CLOCK_IN_HOUR=9
CLOCK_OUT_HOUR=17
```

> **Tip:** For Gmail, enable 2FA and create an [App Password](https://myaccount.google.com/apppasswords).

---

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env  # (optional, for LocationIQ key)
npm run dev
```

### Optional `.env` (frontend)

```env
VITE_LOCATIONIQ_KEY=your-locationiq-api-key
```

Get a free key at [locationiq.com](https://locationiq.com). Without it, only lat/lng coordinates are stored (no address text).

---

## First-Time Admin Registration

When no admin exists yet, call:

```
POST /api/auth/admin/register
Body: { "name": "...", "email": "...", "password": "..." }
```

After the first admin is created, this endpoint requires an admin JWT token to create additional admins.

---

## API Overview

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/admin/login` | — | Admin login |
| POST | `/api/auth/admin/register` | — / Admin | Create admin |
| POST | `/api/auth/student/register` | — | Register with QR token |
| POST | `/api/auth/student/login` | — | Student login |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/admin/dashboard` | Admin | Stats |
| GET | `/api/admin/students` | Admin | List students |
| PATCH | `/api/admin/students/:id/approve` | Admin | Approve student |
| PATCH | `/api/admin/students/:id/suspend` | Admin | Suspend student |
| GET | `/api/admin/attendance` | Admin | All attendance |
| GET | `/api/admin/device-reset-requests` | Admin | Pending resets |
| POST | `/api/admin/device-reset-requests/:id/approve` | Admin | Approve + email reset link |
| POST | `/api/qr/generate` | Admin | Generate QR |
| GET | `/api/qr/validate/:token` | — | Validate QR token |
| POST | `/api/attendance/clock-in` | Student | Clock in |
| POST | `/api/attendance/clock-out` | Student | Clock out |
| GET | `/api/attendance/today` | Student | Today's record |
| GET | `/api/attendance/history` | Student | Full history |
| POST | `/api/device/reset-request` | Student | Request device reset |
| POST | `/api/device/reset` | — | Execute reset with token |
| GET | `/api/student/notifications` | Student | Get notifications |

---

## Project Structure

```
punctuality-checker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── schema.sql        ← Run this in Supabase SQL Editor
│   │   │   └── supabase.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── adminController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── qrController.js
│   │   │   ├── deviceController.js
│   │   │   └── studentController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── admin.js
│   │   │   ├── student.js
│   │   │   ├── attendance.js
│   │   │   ├── qr.js
│   │   │   └── device.js
│   │   ├── services/
│   │   │   └── cronJobs.js       ← Auto clock-out + reminders
│   │   ├── utils/
│   │   │   ├── helpers.js
│   │   │   └── mailer.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.svelte
    │   │   ├── NotificationBell.svelte
    │   │   └── StatusBadge.svelte
    │   ├── lib/
    │   │   ├── api.js             ← All API calls
    │   │   ├── fingerprint.js     ← Device fingerprinting
    │   │   └── location.js        ← Geolocation + reverse geocoding
    │   ├── pages/
    │   │   ├── Landing.svelte
    │   │   ├── AdminLogin.svelte
    │   │   ├── StudentLogin.svelte
    │   │   ├── Register.svelte    ← QR-gated registration
    │   │   ├── DeviceReset.svelte ← Email reset link handler
    │   │   ├── admin/
    │   │   │   ├── Dashboard.svelte
    │   │   │   ├── Students.svelte
    │   │   │   ├── Attendance.svelte
    │   │   │   ├── QRCodes.svelte
    │   │   │   └── Requests.svelte
    │   │   └── student/
    │   │       ├── Dashboard.svelte  ← Clock-in/out + notifications
    │   │       └── History.svelte
    │   ├── stores/
    │   │   └── auth.js
    │   ├── styles/
    │   │   └── global.css
    │   ├── App.svelte
    │   └── main.js
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Running in Production

1. Build the frontend: `cd frontend && npm run build` → serves from `dist/`
2. Serve backend with `node src/server.js` or use a process manager like PM2
3. Set `FRONTEND_URL` in backend `.env` to your actual domain
4. Ensure your Supabase project is on a paid plan or that the service role key has full access

---

## Clock Rules Summary

| Event | Time | Behaviour |
|-------|------|-----------|
| Clock In opens | 9:00 AM | Cannot clock in before this |
| Late threshold | 9:15 AM | Arriving after this → marked "Late" |
| Normal Clock Out | 5:00 PM+ | No extra steps required |
| Early Clock Out | Before 5:00 PM | Must select a reason first |
| Reminder | 5:05 PM | In-app banner + email sent |
| Auto Clock-Out | 5:30 PM | System clocks out + marks absent |
