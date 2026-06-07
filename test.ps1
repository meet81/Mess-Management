try {
    $response = Invoke-RestMethod -Method Post -Uri 'http://localhost:5130/api/auth/login' -ContentType 'application/json' -Body '{"email":"admin@mess.com","password":"Admin@123"}'
    Write-Output "Success"
    Write-Output $response
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Output "Error:"
    Write-Output $reader.ReadToEnd()
}
