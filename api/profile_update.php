<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';
require_method('POST');

$u = require_login();
$data = read_json_body();

$fullName = as_string($data['full_name'] ?? $u['full_name'] ?? '', 150);
$grade = as_string($data['grade'] ?? $u['grade'] ?? '', 80);
$contact = as_string($data['contact'] ?? $u['contact'] ?? '', 50);

if ($fullName === '') {
    json_response(['success' => false, 'error' => 'Full name is required'], 400);
}

$stmt = db()->prepare('UPDATE users SET full_name = ?, grade = ?, contact = ? WHERE id = ?');
$stmt->execute([$fullName, $grade !== '' ? $grade : null, $contact !== '' ? $contact : null, (int)$u['id']]);

json_response(['success' => true]);
