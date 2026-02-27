# Debug: Testar Fluxo Completo

Write-Host "=== TESTE DE FLUXO COMPLETO ===" -ForegroundColor Cyan
Write-Host ""

$clientId = "3"
$clientName = "GlobalPay Inc"

# Teste 1: Enviar para receive-response
Write-Host "1. Enviando resposta via receive-response..." -ForegroundColor Yellow

$payload = @{
    clientId = $clientId
    clientName = $clientName
    response = "🔵 TESTE COMPLETO - $(Get-Date -Format 'HH:mm:ss')"
    status = "processed"
    timestamp = (Get-Date).ToString("dd/MM/yyyy HH:mm")
    source = "test_debug"
} | ConvertTo-Json

try {
    $resp = Invoke-WebRequest `
        -Uri "https://churn-dashboard-six.vercel.app/api/webhooks/receive-response" `
        -Method POST `
        -Body $payload `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 15

    Write-Host "   Sucesso! Status: $($resp.StatusCode)" -ForegroundColor Green
    $result = $resp.Content | ConvertFrom-Json
    Write-Host "   Response ID: $($result.responseId)" -ForegroundColor Gray
} catch {
    Write-Host "   ERRO: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# Teste 2: Verificar se foi salvo na conversation
Write-Host "2. Verificando conversation API..." -ForegroundColor Yellow

try {
    $conv = Invoke-WebRequest `
        -Uri "https://churn-dashboard-six.vercel.app/api/webhooks/conversations?clientId=$clientId&limit=10" `
        -Method GET `
        -UseBasicParsing `
        -TimeoutSec 10

    $convData = $conv.Content | ConvertFrom-Json
    
    if ($convData.success -and $convData.data.messages) {
        $msgCount = $convData.data.messages.Count
        Write-Host "   Encontradas $msgCount mensagens" -ForegroundColor Green
        
        $lastMsg = $convData.data.messages[-1]
        Write-Host "   Ultima msg: $($lastMsg.message)" -ForegroundColor Gray
        Write-Host "   Sender: $($lastMsg.senderName)" -ForegroundColor Gray
        Write-Host "   Timestamp: $($lastMsg.timestamp)" -ForegroundColor Gray
    } else {
        Write-Host "   Nenhuma mensagem encontrada!" -ForegroundColor Red
        Write-Host "   Response: $($conv.Content)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERRO ao buscar conversation: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== RESULTADO ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para verificar no browser:" -ForegroundColor Yellow
Write-Host "  1. Abra: https://churn-dashboard-six.vercel.app" -ForegroundColor White
Write-Host "  2. Clique em 'GlobalPay Inc'" -ForegroundColor White
Write-Host "  3. Aguarde ate 3 segundos" -ForegroundColor White
Write-Host "  4. A mensagem deve aparecer!" -ForegroundColor White
Write-Host ""
Write-Host "Logs do Vercel:" -ForegroundColor Yellow
Write-Host "  vercel logs --follow" -ForegroundColor White
Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
