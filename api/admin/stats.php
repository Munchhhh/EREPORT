<?php

declare(strict_types=1);

require_once __DIR__ . '/../_bootstrap.php';

require_admin();

$stmt = db()->query('SELECT status, COUNT(*) as c FROM reports GROUP BY status');
$rows = $stmt->fetchAll();

$total = 0;
$pending = 0;
$high = 0;
$resolved = 0;

foreach ($rows as $r) {
    $status = (string)$r['status'];
    $c = (int)$r['c'];
    $total += $c;

    if (in_array($status, ['Pending', 'Under Review', 'Draft'], true)) {
        $pending += $c;
    }
    if ($status === 'Resolved') {
        $resolved += $c;
    }
}

$stmt2 = db()->query("SELECT COUNT(*) as c FROM reports WHERE priority='High'");
$high = (int)($stmt2->fetch()['c'] ?? 0);

$rate = $total > 0 ? (int)round(($resolved / $total) * 100) : 0;

json_response([
    'success' => true,
    'stats' => [
        'total' => $total,
        'pending' => $pending,
        'high' => $high,
        'resolution_rate' => $rate,
    ]
]);
