# Teste: Simular resposta do n8n chegando no chat

Write-Host "=== TESTE DE RESPOSTA N8N → CHAT ===" -ForegroundColor Cyan
Write-Host ""

# Dados da resposta simulada
$clientId = "1"
$clientName = "MCI PLUS"

$responsePayload = @{
    clientId = $clientId
    clientName = $clientName
    messageId = "msg_test_$(Get-Date -Format 'yyyyMMddHHmmss')"
    response = "Esta é uma resposta automática do n8n! 🤖 Recebida em $(Get-Date -Format 'HH:mm:ss')"
    status = "processed"
    timestamp = (Get-Date).ToString("dd/MM/yyyy HH:mm")
    source = "n8n_test"
} | ConvertTo-Json

Write-Host "Cliente: $clientName (ID: $clientId)" -ForegroundColor Yellow
Write-Host "Enviando resposta para: http://localhost:3000/api/webhooks/receive-response" -ForegroundColor Yellow
Write-Host ""
Write-Host "Payload:" -ForegroundColor Gray
Write-Host $responsePayload -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/webhooks/receive-response" `
        -Method POST `
        -Body $responsePayload `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 10

    $result = $response.Content | ConvertFrom-Json

    if ($result.success) {
        Write-Host "✅ SUCESSO!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response ID: $($result.responseId)" -ForegroundColor Green
        Write-Host "Status: $($result.data.status)" -ForegroundColor Green
        Write-Host ""
        Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
        Write-Host "  1. Abra o navegador: http://localhost:3000" -ForegroundColor White
        Write-Host "  2. Clique no cliente '$clientName'" -ForegroundColor White
        Write-Host "  3. A mensagem deve aparecer no chat em ate 3 segundos!" -ForegroundColor White
    } else {
        Write-Host "❌ FALHOU!" -ForegroundColor Red
        Write-Host "Erro: $($result.error)" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ ERRO NA CONEXAO!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "VERIFIQUE:" -ForegroundColor Yellow
    Write-Host "  1. O servidor esta rodando? (npm run dev)" -ForegroundColor Gray
    Write-Host "  2. A porta 3000 ou 3001 esta acessivel?" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Execute primeiro:" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor White
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
