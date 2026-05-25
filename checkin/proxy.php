<?php
// proxy.php — server-side proxy from checkin.* to manage.* API
// Bypasses browser CORS restrictions entirely
// Only allows: submitGuestCheckIn, resolveCheckinLink

header('Content-Type: application/json');

$action  = isset($_GET['action']) ? preg_replace('/[^a-zA-Z]/', '', $_GET['action']) : '';
$allowed = ['submitGuestCheckIn', 'resolveCheckinLink'];

if (!in_array($action, $allowed)) {
    echo json_encode(['success'=>false,'error'=>'Invalid action']);
    exit;
}

$body   = file_get_contents('php://input');
$target = 'https://manage.luxuryvillasofguruvayur.com/api/' . $action;

$ch = curl_init($target);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    http_response_code(502);
    echo json_encode(['success'=>false,'error'=>'Proxy error: '.$curlErr]);
    exit;
}

http_response_code($httpCode);
echo $response;
