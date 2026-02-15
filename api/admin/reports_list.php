<?php

declare(strict_types=1);

require_once __DIR__ . '/../_bootstrap.php';

require_admin();

$limit = max(1, min(200, (int)($_GET['limit'] ?? 200)));
$offset = max(0, (int)($_GET['offset'] ?? 0));
$status = as_string($_GET['status'] ?? '', 30);
$type = as_string($_GET['category'] ?? '', 80);
$search = as_string($_GET['q'] ?? '', 200);

$where = [];
$params = [];

if ($status !== '') {
    $where[] = 'r.status = ?';
    $params[] = $status;
}
if ($type !== '') {
    $where[] = 'r.category = ?';
    $params[] = $type;
}
if ($search !== '') {
    $where[] = '(r.title LIKE ? OR r.description LIKE ? OR u.full_name LIKE ?)';
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
}

$sql = "SELECT r.id, r.title, r.category, r.status, r.priority, r.privacy, r.assigned_to, r.created_at, r.updated_at,
           r.description, r.admin_notes,
           u.full_name AS user_name
        FROM reports r
        JOIN users u ON u.id = r.user_id";

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
        'title' => $r['title'],
        'user_name' => $r['user_name'],
        'category' => $r['category'],
        'status' => $r['status'],
        'priority' => $r['priority'],
        'privacy' => $r['privacy'],
        'assigned_to' => $r['assigned_to'],
        'date' => substr((string)$r['created_at'], 0, 10),
        'created_at' => (string)$r['created_at'],
        'updated_at' => (string)$r['updated_at'],
        'description' => $r['description'],
        'admin_notes' => $r['admin_notes'] ?? '',
    ];
}, $rows);

json_response(['success' => true, 'reports' => $reports]);
