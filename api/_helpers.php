<?php

declare(strict_types=1);

function json_response(array $payload, int $statusCode = 200): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function require_method(string $method): void
{
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== strtoupper($method)) {
        json_response(['success' => false, 'error' => 'Method not allowed'], 405);
    }
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_response(['success' => false, 'error' => 'Invalid JSON body'], 400);
    }

    return $data;
}

function as_string(mixed $v, int $maxLen = 10000): string
{
    $s = trim((string)($v ?? ''));
    if (mb_strlen($s) > $maxLen) {
        $s = mb_substr($s, 0, $maxLen);
    }
    return $s;
}

function as_int(mixed $v): int
{
    return (int)($v ?? 0);
}

function pad_report_id(int $id): string
{
    return str_pad((string)$id, 6, '0', STR_PAD_LEFT);
}
