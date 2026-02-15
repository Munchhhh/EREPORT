<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

date_default_timezone_set(APP_TIMEZONE);

// Safer session defaults
session_name(APP_SESSION_NAME);
session_start();

require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/_db.php';
require_once __DIR__ . '/_auth.php';
