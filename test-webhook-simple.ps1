# Test Webhook n8n - Simples
Write-Host "=== TESTE DE WEBHOOK N8N ===" -ForegroundColor Cyan
Write-Host ""

$webhookUrl = "https://n8n.aegmedia.com.br/webhook-test/0021ec91-5f4b-4168-9b68-b6e1cd9caddf"

Write-Host "URL: $webhookUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "Testando conexao..." -ForegroundColor Cyan

$body = @{
    test = $true
    event = "connection_test"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
} | ConvertTo-Json

Write-Host "Payload: $body" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri $webhookUrl `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -Headers @{"User-Agent"="Cabuetia-Test"} `
        -UseBasicParsing `
        -TimeoutSec 10

    Write-Host "STATUS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "RESPOSTA: $($response.Content)" -ForegroundColor Green
    Write-Host ""
    Write-Host "SUCESSO! Webhook esta funcionando!" -ForegroundColor Green

} catch {
    Write-Host "ERRO NA CONEXAO!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "HTTP Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "POSSIVEIS CAUSAS:" -ForegroundColor Yellow
    Write-Host "  1. O workflow do n8n nao esta ativo" -ForegroundColor Gray
    Write-Host "  2. O n8n esta fora do ar" -ForegroundColor Gray
    Write-Host "  3. A URL do webhook mudou" -ForegroundColor Gray
    Write-Host "  4. Problema de rede/firewall" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
