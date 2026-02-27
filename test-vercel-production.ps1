# Teste: Verificar se o endpoint está funcionando no Vercel

Write-Host "=== TESTE DE PRODUCAO - VERCEL ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL do site: https://churn-dashboard-six.vercel.app" -ForegroundColor Yellow
Write-Host ""

# Teste 1: Verificar se o site está online
Write-Host "1. Verificando se o site esta online..." -ForegroundColor Cyan
try {
    $siteCheck = Invoke-WebRequest -Uri "https://churn-dashboard-six.vercel.app" -Method GET -UseBasicParsing -TimeoutSec 10
    Write-Host "   Status: OK ($($siteCheck.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: Site nao acessivel!" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Testando endpoint receive-response..." -ForegroundColor Cyan

$payload = @{
    clientId = "1"
    clientName = "MCI PLUS"
    response = "🤖 Teste automatico do n8n - $(Get-Date -Format 'HH:mm:ss')"
    status = "processed"
    timestamp = (Get-Date).ToString("dd/MM/yyyy HH:mm")
    source = "n8n_production_test"
    messageId = "test_$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

Write-Host ""
Write-Host "Payload enviado:" -ForegroundColor Gray
Write-Host $payload -ForegroundColor DarkGray
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "https://churn-dashboard-six.vercel.app/api/webhooks/receive-response" `
        -Method POST `
        -Body $payload `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 15

    $result = $response.Content | ConvertFrom-Json

    Write-Host "   STATUS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resposta da API:" -ForegroundColor Cyan
    Write-Host "   Success: $($result.success)" -ForegroundColor $(if($result.success){'Green'}else{'Red'})
    Write-Host "   Message: $($result.message)" -ForegroundColor Gray
    Write-Host "   Response ID: $($result.responseId)" -ForegroundColor Gray
    
    if ($result.data) {
        Write-Host "   Client ID: $($result.data.clientId)" -ForegroundColor Gray
        Write-Host "   Status: $($result.data.status)" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "=== SUCESSO! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "A mensagem foi enviada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
    Write-Host "  1. Abra: https://churn-dashboard-six.vercel.app" -ForegroundColor White
    Write-Host "  2. Clique no cliente 'MCI PLUS'" -ForegroundColor White
    Write-Host "  3. A mensagem deve aparecer no chat em ate 3 segundos!" -ForegroundColor White
    Write-Host ""
    Write-Host "CONFIGURAR NO N8N:" -ForegroundColor Yellow
    Write-Host "  URL: https://churn-dashboard-six.vercel.app/api/webhooks/receive-response" -ForegroundColor White
    Write-Host "  Method: POST" -ForegroundColor White
    Write-Host "  Body: JSON com clientId obrigatorio" -ForegroundColor White

} catch {
    Write-Host "   STATUS: ERRO" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erro HTTP: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $errorBody = $reader.ReadToEnd()
            Write-Host "Response: $errorBody" -ForegroundColor Yellow
        } catch {
            Write-Host "Nao foi possivel ler a resposta de erro" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "POSSIVEIS CAUSAS:" -ForegroundColor Yellow
    Write-Host "  - API route nao implantada corretamente no Vercel" -ForegroundColor Gray
    Write-Host "  - Timeout (funcao levou mais de 10 segundos)" -ForegroundColor Gray
    Write-Host "  - Erro no codigo do endpoint" -ForegroundColor Gray
    Write-Host ""
    Write-Host "VERIFIQUE:" -ForegroundColor Cyan
    Write-Host "  1. Logs no Vercel: vercel logs --follow" -ForegroundColor White
    Write-Host "  2. Deploy esta completo?" -ForegroundColor White
    Write-Host "  3. URL esta correta?" -ForegroundColor White
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
