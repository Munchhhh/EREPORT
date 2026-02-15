<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

$u = require_login();
$mine = ($_GET['mine'] ?? '1') !== '0';

$where = [];
$params = [];
if ($mine) {
    $where[] = 'user_id = ?';
    $params[] = (int)$u['id'];
}

$sql = 'SELECT status, COUNT(*) as c FROM reports';
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' GROUP BY status';

$stmt = db()->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$counts = [
    'total' => 0,
    'pending' => 0,
    'in_progress' => 0,
    'resolved' => 0,
];

foreach ($rows as $r) {
    $status = (string)$r['status'];
    $c = (int)$r['c'];
    $counts['total'] += $c;

    if (in_array($status, ['Pending', 'Under Review', 'Draft'], true)) {
        $counts['pending'] += $c;
    } elseif ($status === 'In Progress') {
        $counts['in_progress'] += $c;
    } elseif ($status === 'Resolved') {
        $counts['resolved'] += $c;
    }
}

json_response(['success' => true, 'counts' => $counts]);
