<?php

declare(strict_types=1);

require_once __DIR__ . '/../_bootstrap.php';

$token = (string)($_GET['token'] ?? '');
if ($token === '' || !hash_equals(DEV_SEED_TOKEN, $token)) {
    json_response(['success' => false, 'error' => 'Forbidden'], 403);
}

$pdo = db();

$users = [
    [
        'email' => 'admin@spusm.edu.ph',
        'password' => 'Admin123!',
        'full_name' => 'Dr. Admin',
        'school_id' => null,
        'grade' => null,
        'contact' => null,
        'role' => 'admin',
    ],
    [
        'email' => 'student@spusm.edu.ph',
        'password' => 'Student123!',
        'full_name' => 'Maria Clara Santos',
        'school_id' => '2024-0001234',
        'grade' => 'Grade 11 - STEM A',
        'contact' => '+63 912 345 6789',
        'role' => 'user',
    ],
];

foreach ($users as $u) {
    $email = strtolower($u['email']);
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        continue;
    }

    $hash = password_hash($u['password'], PASSWORD_DEFAULT);
    $ins = $pdo->prepare('INSERT INTO users (email, password_hash, full_name, school_id, grade, contact, role) VALUES (?,?,?,?,?,?,?)');
    $ins->execute([$email, $hash, $u['full_name'], $u['school_id'], $u['grade'], $u['contact'], $u['role']]);
}

json_response([
    'success' => true,
    'message' => 'Seed complete',
    'accounts' => [
        ['email' => 'admin@spusm.edu.ph', 'password' => 'Admin123!'],
        ['email' => 'student@spusm.edu.ph', 'password' => 'Student123!'],
    ],
]);
