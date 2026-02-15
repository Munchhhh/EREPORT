<?php

declare(strict_types=1);

require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/_db.php';

function current_user(): ?array
{
    $userId = (int)($_SESSION['user_id'] ?? 0);
    if ($userId <= 0) {
        return null;
    }

    $stmt = db()->prepare('SELECT id, email, full_name, school_id, grade, contact, role FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $u = $stmt->fetch();

    return $u ?: null;
}

function require_login(): array
{
    $u = current_user();
    if (!$u) {
        json_response(['success' => false, 'error' => 'Not authenticated'], 401);
    }
    return $u;
}

function require_admin(): array
{
    $u = require_login();
    if (strtolower((string)($u['role'] ?? '')) !== 'admin') {
        json_response(['success' => false, 'error' => 'Forbidden'], 403);
    }
    return $u;
}
