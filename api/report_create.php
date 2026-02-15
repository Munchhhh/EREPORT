<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';
require_method('POST');

$u = require_login();

$category = as_string($_POST['category'] ?? '', 80);
$description = as_string($_POST['description'] ?? '', 10000);
$location = as_string($_POST['location'] ?? '', 120);
$incidentDate = as_string($_POST['incidentDate'] ?? '', 20);
$privacy = as_string($_POST['privacy'] ?? 'confidential', 20);

if ($category === '' || $description === '' || $location === '' || $incidentDate === '') {
    json_response(['success' => false, 'error' => 'Missing required fields'], 400);
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $incidentDate)) {
    json_response(['success' => false, 'error' => 'Invalid incident date'], 400);
}

$allowedPrivacy = ['anonymous', 'confidential', 'public'];
if (!in_array($privacy, $allowedPrivacy, true)) {
    $privacy = 'confidential';
}

// Title is not in the form; derive a short one from description.
$title = mb_substr(preg_replace('/\s+/', ' ', $description), 0, 60);
if (mb_strlen($title) < 8) {
    $title = $category . ' Report';
}

$pdo = db();
$pdo->beginTransaction();

try {
    $stmt = $pdo->prepare('INSERT INTO reports (user_id, title, category, description, location, incident_date, privacy, status, priority) VALUES (?,?,?,?,?,?,?,?,?)');
    $stmt->execute([
        (int)$u['id'],
        $title,
        $category,
        $description,
        $location,
        $incidentDate,
        $privacy,
        'Pending',
        'Medium',
    ]);

    $reportId = (int)$pdo->lastInsertId();

    // Handle uploads (optional)
    $saved = [];
    if (!empty($_FILES['attachments']) && is_array($_FILES['attachments']['name'] ?? null)) {
        $count = count($_FILES['attachments']['name']);
        if ($count > UPLOAD_MAX_FILES) {
            throw new RuntimeException('Too many attachments (max ' . UPLOAD_MAX_FILES . ')');
        }

        $targetDir = rtrim(UPLOAD_BASE_DIR, '/\\') . DIRECTORY_SEPARATOR . $reportId;
        if (!is_dir($targetDir) && !mkdir($targetDir, 0775, true)) {
            throw new RuntimeException('Unable to create upload directory');
        }

        for ($i = 0; $i < $count; $i++) {
            $err = (int)($_FILES['attachments']['error'][$i] ?? UPLOAD_ERR_NO_FILE);
            if ($err === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            if ($err !== UPLOAD_ERR_OK) {
                throw new RuntimeException('Upload failed');
            }

            $tmp = (string)($_FILES['attachments']['tmp_name'][$i] ?? '');
            $size = (int)($_FILES['attachments']['size'][$i] ?? 0);
            $origName = as_string($_FILES['attachments']['name'][$i] ?? '', 255);
            $type = as_string($_FILES['attachments']['type'][$i] ?? '', 120);

            if ($size <= 0 || $size > UPLOAD_MAX_FILE_BYTES) {
                throw new RuntimeException('Attachment too large (max 10MB each)');
            }

            $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'], true)) {
                throw new RuntimeException('Only image attachments are allowed');
            }

            $safeName = bin2hex(random_bytes(16)) . '.' . $ext;
            $dest = $targetDir . DIRECTORY_SEPARATOR . $safeName;

            if (!move_uploaded_file($tmp, $dest)) {
                throw new RuntimeException('Failed to store attachment');
            }

            $relPath = 'uploads/reports/' . $reportId . '/' . $safeName;
            $stmtA = $pdo->prepare('INSERT INTO report_attachments (report_id, path, original_name, mime, size_bytes) VALUES (?,?,?,?,?)');
            $stmtA->execute([$reportId, $relPath, $origName, $type, $size]);
            $saved[] = $relPath;
        }
    }

    $pdo->commit();

    json_response([
        'success' => true,
        'report_id' => $reportId,
        'id_display' => '#' . pad_report_id($reportId),
        'attachments' => $saved,
    ]);
} catch (Throwable $e) {
    $pdo->rollBack();
    json_response(['success' => false, 'error' => $e->getMessage()], 400);
}
