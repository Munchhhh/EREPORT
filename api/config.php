<?php
// Basic configuration for XAMPP + MySQL.
// Update these if your MySQL credentials differ.

declare(strict_types=1);

// Database
const DB_HOST = '127.0.0.1';
const DB_NAME = 'ereport2';
const DB_USER = 'root';
const DB_PASS = '';
const DB_CHARSET = 'utf8mb4';

// Security
// Change this to a long random string in production.
const APP_SESSION_NAME = 'ereport2_sess';

// Used only by api/dev/seed.php (dev convenience). Change before use.
const DEV_SEED_TOKEN = 'change-me-seed-token';

// Uploads
const UPLOAD_BASE_DIR = __DIR__ . '/../uploads/reports';
const UPLOAD_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const UPLOAD_MAX_FILES = 8;

// App
const APP_TIMEZONE = 'Asia/Manila';
