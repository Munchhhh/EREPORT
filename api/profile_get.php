<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

$u = require_login();
json_response(['success' => true, 'profile' => $u]);
