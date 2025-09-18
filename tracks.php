<?php
header('Content-Type: application/json; charset=utf-8');

$dir = __DIR__ . '/radio/';
$files = array_diff(scandir($dir), ['.', '..']);

$tracks = [];
foreach ($files as $file) {
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (in_array($ext, ['mp3', 'wav'])) {
        $tracks[] = "radio/" . $file;
    }
}

echo json_encode($tracks, JSON_UNESCAPED_UNICODE);
