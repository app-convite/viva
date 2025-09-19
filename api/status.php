<?php
header("Access-Control-Allow-Origin: *"); // ou use um domínio específico
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Responder pré-flight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obtem o ID da URL
$id = $_GET['transaction_id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing id parameter']);
    exit;
}

// Endpoint da API
$url = "https://app.ghostspaysv1.com/api/v1/transaction.getPaymentDetails?id=" . urlencode($id);

// Token de autenticação
$token = "a805bed4-6fca-47ff-b495-9928fa1e18c6";

// Inicializa cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: $token"
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Verifica erro
if ($http_code !== 200 || !$response) {
    http_response_code($http_code);
    echo json_encode(['error' => 'Failed to fetch transaction status']);
    exit;
}

// Decodifica resposta
$data = json_decode($response, true);
$status = strtoupper($data['status'] ?? 'UNKNOWN');

// Lista de status que indicam pagamento não realizado
$cancelados = ['CANCELED', 'EXPIRED', 'FAILED'];

// Se for diferente de "PENDING" e não estiver nos cancelados, considerar "paid"
if ($status !== 'PENDING' && !in_array($status, $cancelados)) {
    echo json_encode(['status' => 'paid']);
} else {
    echo json_encode(['status' => 'pending']);
}
