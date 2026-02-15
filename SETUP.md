# E-REPORT (XAMPP + PHP + MySQL) Setup

## 1) Start services
- Open **XAMPP Control Panel**
- Start **Apache** and **MySQL**

## 2) Create the database
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Create a database named: `ereport2`
3. Import schema: open the database → **Import** → choose `db/schema.sql` → **Go**

## 3) Configure the app
Edit `api/config.php`:
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`
- Set `DEV_SEED_TOKEN` to something private (example: `my-local-token-123`)

## 4) Seed demo accounts (one-time)
Open in browser:
- `http://localhost/ereport2/api/dev/seed.php?token=YOUR_DEV_SEED_TOKEN`

This creates:
- Admin: `admin@spusm.edu.ph` / `Admin123!`
- Student: `student@spusm.edu.ph` / `Student123!`

## 5) Use the app
- Login page: `http://localhost/ereport2/login.html`
- Student dashboard: after login → `user-dashboard.html`
- Admin dashboard: after login → `admin-dashboard.html`

## API quick checks
- `http://localhost/ereport2/api/health.php`
- `http://localhost/ereport2/api/me.php`

## Notes
- Uploaded images are stored under `uploads/reports/{report_id}/...`
- In production, remove or protect `api/dev/seed.php`.
