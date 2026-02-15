<?php

declare(strict_types=1);

require_once __DIR__ . '/../_bootstrap.php';
require_method('POST');

require_admin();

$data = read_json_body();
$id = (int)($data['id'] ?? 0);
$status = as_string($data['status'] ?? '', 30);
$priority = as_string($data['priority'] ?? '', 10);
$assignedTo = as_string($data['assigned_to'] ?? '', 100);
$notes = as_string($data['admin_notes'] ?? '', 20000);

if ($id <= 0) {
    json_response(['success' => false, 'error' => 'Missing report id'], 400);
}

$allowed = ['Draft','Pending','Under Review','In Progress','Resolved','Withdrawn'];
if ($status !== '' && !in_array($status, $allowed, true)) {
    json_response(['success' => false, 'error' => 'Invalid status'], 400);
}

$allowedPriority = ['Low', 'Medium', 'High'];
if ($priority !== '' && !in_array($priority, $allowedPriority, true)) {
    json_response(['success' => false, 'error' => 'Invalid priority'], 400);
}

// Build dynamic update
$fields = [];
$params = [];
if ($status !== '') {
    $fields[] = 'status = ?';
    $params[] = $status;
}
$fields[] = 'priority = ?';
$params[] = ($priority !== '' ? $priority : 'Medium');

$fields[] = 'assigned_to = ?';
$params[] = ($assignedTo !== '' ? $assignedTo : null);

$fields[] = 'admin_notes = ?';
$params[] = $notes;
$params[] = $id;

$sql = 'UPDATE reports SET ' . implode(', ', $fields) . ' WHERE id = ?';
$stmt = db()->prepare($sql);
$stmt->execute($params);

json_response(['success' => true]);
