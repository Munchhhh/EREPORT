<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

$u = current_user();
if (!$u) {
    json_response(['success' => true, 'authenticated' => false]);
}

json_response([
    'success' => true,
    'authenticated' => true,
    'user' => $u,
]);
