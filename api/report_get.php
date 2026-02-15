<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

$u = require_login();
$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    json_response(['success' => false, 'error' => 'Missing report id'], 400);
}

// Users can only see their own reports unless admin
$isAdmin = strtolower((string)($u['role'] ?? '')) === 'admin';

$sql = "SELECT r.*, u.full_name, u.email
        FROM reports r
        JOIN users u ON u.id = r.user_id
        WHERE r.id = ?";
$params = [$id];
if (!$isAdmin) {
    $sql .= ' AND r.user_id = ?';
    $params[] = (int)$u['id'];
}

$stmt = db()->prepare($sql);
$stmt->execute($params);
$report = $stmt->fetch();

if (!$report) {
    json_response(['success' => false, 'error' => 'Report not found'], 404);
}

$stmt2 = db()->prepare('SELECT path FROM report_attachments WHERE report_id = ? ORDER BY id ASC');
$stmt2->execute([$id]);
$attachments = array_map(fn($r) => (string)$r['path'], $stmt2->fetchAll());

json_response([
    'success' => true,
    'report' => [
        'id' => (int)$report['id'],
        'id_display' => '#' . pad_report_id((int)$report['id']),
        'title' => $report['title'],
        'category' => $report['category'],
        'submitted' => substr((string)$report['created_at'], 0, 10),
        'incident_date' => (string)$report['incident_date'],
        'location' => $report['location'],
        'description' => $report['description'],
        'privacy' => $report['privacy'],
        'status' => $report['status'],
        'priority' => $report['priority'],
        'admin_notes' => $report['admin_notes'],
        'assigned_to' => $report['assigned_to'],
        'user_name' => $report['full_name'],
        'user_email' => $report['email'],
        'attachments' => $attachments,
    ]
]);
