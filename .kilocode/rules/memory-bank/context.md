# Active Context: Engineering Training Automated Marking System

## Current State

**Status**: ✅ Phase 2 Complete - Referral & Rewards System Implemented

The Engineering Training Automated Marking System now includes a complete referral and rewards system.

## Recently Completed

- [x] Database setup with Drizzle ORM + SQLite (local.db)
- [x] User authentication with role-based access (trainee, trainer, admin)
- [x] Database schema with relations (users, units, submissions, results, marking schemes, notifications, audit logs)
- [x] Trainee portal (dashboard, upload, submissions, progress tracking)
- [x] Trainer portal (dashboard, units, marking schemes, submissions, marking, reports)
- [x] Admin portal (user management, system settings)
- [x] Marking system with visual indicators (✓ tick, ✗ cross, ╱ diagonal)
- [x] Reports and analytics with CSV export
- [x] Demo user seeding script (now working with local SQLite)
- [x] Sign up page for new users (auto-assigns trainee role)
- [x] Profile management page (update name, department, change password)
- [x] Login page with sign up link
- [x] Referral system with unique referral codes
- [x] Points system (signup bonus: 50pts, referral bonus: 100pts)
- [x] Rewards redemption page for users
- [x] Admin redemption management (approve/reject/fulfill)
- [x] Redemption options (airtime, data bundles, gift cards, vouchers, premium features)

## Current Structure

| Directory | Purpose |
|-----------|---------|
| `src/app/actions/` | Server actions for auth, marking, schemes, submissions, units, users, points |
| `src/app/dashboard/` | Dashboard pages for all user roles |
| `src/app/login/` | Login page |
| `src/app/signup/` | Sign up page for new users with referral code support |
| `src/app/dashboard/profile/` | Profile management page |
| `src/app/dashboard/rewards/` | Rewards and points management page |
| `src/app/dashboard/redemptions/` | Admin redemption management page |
| `src/components/` | Shared UI components |
| `src/db/` | Database schema, migrations, and seed |
| `src/lib/` | Authentication utilities |

## Demo Accounts

| Role | Email | Password | Points |
|------|-------|----------|--------|
| Admin | admin@demo.com | admin123 | 500 |
| Trainer | trainer@demo.com | trainer123 | 300 |
| Trainee | trainee@demo.com | trainee123 | 100 |

## Key Features

1. **Authentication**: Session-based auth with cookies, role-based access control
2. **Sign Up**: New users can create accounts (default: trainee role) with referral code support
3. **Referral System**: Users get unique referral codes, earn 100pts for each successful referral
4. **Points System**: Signup bonus (50pts), referral bonus (100pts for both parties)
5. **Rewards Redemption**: Users can redeem points for airtime, data bundles, gift cards, vouchers, premium features
6. **Admin Redemption Management**: Approve/reject/fulfill redemption requests
7. **Profile Management**: Users can update name, department, and password
8. **Document Upload**: Support for Word, PowerPoint, PDF files
9. **Marking System**: Manual marking with visual indicators, competency tracking
10. **Reports**: Analytics dashboard with CSV export
11. **User Management**: Full CRUD for users by admin

## Redemption Options Available

| Name | Type | Points Cost |
|------|------|-------------|
| Ksh 100 Airtime | airtime | 100 |
| Ksh 200 Airtime | airtime | 190 |
| 500MB Data Bundle | data_bundle | 150 |
| 1GB Data Bundle | data_bundle | 250 |
| Ksh 500 Gift Card | gift_card | 500 |
| Ksh 1000 Gift Card | gift_card | 950 |
| Premium Feature Unlock | premium_feature | 300 |
| Ksh 200 Voucher | voucher | 200 |

## Pending Improvements

- [ ] OCR integration for scanned documents
- [ ] AI-assisted marking
- [ ] Email notification system
- [ ] PDF report generation
- [ ] Mobile responsiveness improvements

## Session History

| Date | Changes |
|------|---------|
| 2026-02-23 | Initial implementation - complete marking system |
| 2026-02-23 | Added sign up, profile management, fixed demo users with local SQLite |
| 2026-02-23 | Added referral system, points, rewards redemption, admin redemption management |
