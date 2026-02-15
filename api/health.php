<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

try {
    db()->query('SELECT 1');
    json_response(['success' => true, 'db' => 'ok']);
} catch (Throwable $e) {
    json_response(['success' => false, 'db' => 'error', 'error' => $e->getMessage()], 500);
}
