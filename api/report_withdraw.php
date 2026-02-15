<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';
require_method('POST');

$u = require_login();
$data = read_json_body();
$id = (int)($data['id'] ?? 0);

if ($id <= 0) {
    json_response(['success' => false, 'error' => 'Missing report id'], 400);
}

// Only owner can withdraw (admin can also withdraw if needed)
$isAdmin = strtolower((string)($u['role'] ?? '')) === 'admin';

$stmt = db()->prepare('SELECT user_id, status FROM reports WHERE id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch();
if (!$row) {
    json_response(['success' => false, 'error' => 'Report not found'], 404);
}

if (!$isAdmin && (int)$row['user_id'] !== (int)$u['id']) {
    json_response(['success' => false, 'error' => 'Forbidden'], 403);
}

$status = (string)$row['status'];
if ($status === 'Resolved') {
    json_response(['success' => false, 'error' => 'Resolved reports cannot be withdrawn'], 400);
}

$upd = db()->prepare("UPDATE reports SET status='Withdrawn', withdrawn_at=NOW() WHERE id = ?");
$upd->execute([$id]);

json_response(['success' => true]);
