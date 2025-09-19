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

// Recebe dados JSON
$input = json_decode(file_get_contents('php://input'), true);

$nome = $input['nome'] ?? '';
$whatsapp = $input['whatsapp'] ?? '';
$cpf = $input['cpf'] ?? '';
$valor = floatval($input['valor'] ?? 0);

// Validação simples
if (!$nome || !$whatsapp || !$cpf || $valor <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados inválidos']);
    exit;
}

// Monta dados para GhostsPay
$ghostsPayload = [
    "name" => $nome,
    "email" => "cliente@" . uniqid() . ".com", // gera um email fictício
    "cpf" => preg_replace('/\D/', '', $cpf),
    "phone" => preg_replace('/\D/', '', $whatsapp),
    "paymentMethod" => "PIX",
    "amount" => intval($valor), // em centavos
    "items" => [
        [
            "unitPrice" => intval($valor),
            "title" => "Pagamento Pix",
            "quantity" => 1,
            "tangible" => false
        ]
    ]
];

// Envia requisição
$ch = curl_init('https://app.ghostspaysv1.com/api/v1/transaction.purchase');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: a805bed4-6fca-47ff-b495-9928fa1e18c6',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($ghostsPayload));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);

if ($httpCode !== 200 || empty($data['id']) || empty($data['pixCode']) || empty($data['pixQrCode'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao gerar Pix']);
    exit;
}

// Retorna dados relevantes
echo json_encode([
    'id_transaction' => $data['id'],
    'pixcode' => $data['pixCode'],
    'pixqrcode' => $data['pixQrCode']
]);
