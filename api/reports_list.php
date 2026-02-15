<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

$u = require_login();

$mine = ($_GET['mine'] ?? '1') !== '0';
$limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));
$offset = max(0, (int)($_GET['offset'] ?? 0));
$status = as_string($_GET['status'] ?? '', 30);

$where = [];
$params = [];

if ($mine) {
    $where[] = 'r.user_id = ?';
    $params[] = (int)$u['id'];
}
if ($status !== '') {
    $where[] = 'r.status = ?';
    $params[] = $status;
}

$sql = "SELECT r.id, r.title, r.category, r.created_at, r.incident_date, r.status, r.priority, r.location
        FROM reports r";

if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}

$sql .= ' ORDER BY r.id DESC LIMIT ' . $limit . ' OFFSET ' . $offset;

$stmt = db()->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$reports = array_map(function ($r) {
    return [
        'id' => (int)$r['id'],
        'id_display' => '#' . pad_report_id((int)$r['id']),
        'title' => $r['title'],
        'category' => $r['category'],
        'submitted' => substr((string)$r['created_at'], 0, 10),
        'incident_date' => (string)$r['incident_date'],
        'status' => $r['status'],
        'priority' => $r['priority'],
        'location' => $r['location'],
    ];
}, $rows);

json_response(['success' => true, 'reports' => $reports]);
