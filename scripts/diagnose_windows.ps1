Get-Process | Where-Object { $_.MainWindowTitle } | ForEach-Object {
    [PSCustomObject]@{
        Id = $_.Id
        ProcessName = $_.ProcessName
        Title = $_.MainWindowTitle
    }
} | Format-Table -AutoSize
