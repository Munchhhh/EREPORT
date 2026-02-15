<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';
require_method('POST');

$u = require_login();

$data = read_json_body();
$category = as_string($data['category'] ?? '', 80);
$description = as_string($data['description'] ?? '', 10000);
$location = as_string($data['location'] ?? '', 120);
$incidentDate = as_string($data['incidentDate'] ?? '', 20);
$privacy = as_string($data['privacy'] ?? 'confidential', 20);

if ($category === '' && $description === '' && $location === '' && $incidentDate === '') {
    json_response(['success' => false, 'error' => 'Nothing to save'], 400);
}

if ($incidentDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $incidentDate)) {
    json_response(['success' => false, 'error' => 'Invalid incident date'], 400);
}

$allowedPrivacy = ['anonymous', 'confidential', 'public'];
if (!in_array($privacy, $allowedPrivacy, true)) {
    $privacy = 'confidential';
}

$title = mb_substr(preg_replace('/\s+/', ' ', $description), 0, 60);
if (mb_strlen($title) < 8) {
    $title = ($category !== '' ? $category : 'Draft') . ' Report';
}

$stmt = db()->prepare('INSERT INTO reports (user_id, title, category, description, location, incident_date, privacy, status, priority) VALUES (?,?,?,?,?,?,?,?,?)');
$stmt->execute([
    (int)$u['id'],
    $title,
    $category !== '' ? $category : 'Other',
    $description !== '' ? $description : '—',
    $location !== '' ? $location : '—',
    $incidentDate !== '' ? $incidentDate : date('Y-m-d'),
    $privacy,
    'Draft',
    'Medium',
]);

$id = (int)db()->lastInsertId();

json_response(['success' => true, 'report_id' => $id, 'id_display' => '#' . pad_report_id($id)]);
