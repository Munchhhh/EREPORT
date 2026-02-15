<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';
require_method('POST');

$data = read_json_body();
$email = strtolower(as_string($data['email'] ?? '', 190));
$password = (string)($data['password'] ?? '');

if ($email === '' || $password === '') {
    json_response(['success' => false, 'error' => 'Email and password are required'], 400);
}

$stmt = db()->prepare('SELECT id, password_hash, role FROM users WHERE email = ?');
$stmt->execute([$email]);
$row = $stmt->fetch();

if (!$row || !password_verify($password, (string)$row['password_hash'])) {
    json_response(['success' => false, 'error' => 'Invalid credentials'], 401);
}

$_SESSION['user_id'] = (int)$row['id'];

json_response([
    'success' => true,
    'role' => $row['role'],
]);
