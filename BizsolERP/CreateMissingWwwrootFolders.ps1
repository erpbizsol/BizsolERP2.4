# PowerShell script to fix projects with missing wwwroot folders

$projects = @(
    "Bizsol.ERP.UI.Common.Masters\Bizsol.WebERP.UI.Common.Masters.csproj",
    "Bizsol.ERP.UI.Common.Reports\Bizsol.WebERP.UI.Common.Reports.csproj",
    "Bizsol.ERP.UI.Common.Test\Bizsol.WebERP.UI.Common.Test.csproj",
    "Bizsol.ERP.UI.Common.Transactions\Bizsol.WebERP.UI.Common.Transactions.csproj",
    "Bizsol.ERP.UI.Finance.Masters\Bizsol.WebERP.UI.Finance.Masters.csproj",
    "Bizsol.ERP.UI.Finance.Reports\Bizsol.WebERP.UI.Finance.Reports.csproj",
    "Bizsol.ERP.UI.Finance.Test\Bizsol.WebERP.UI.Finance.Test.csproj",
    "Bizsol.ERP.UI.Finance.Transactions\Bizsol.WebERP.UI.Finance.Transactions.csproj",
    "Bizsol.ERP.UI.HR.Masters\Bizsol.WebERP.UI.HR.Masters.csproj",
    "Bizsol.ERP.UI.HR.Reports\Bizsol.WebERP.UI.HR.Reports.csproj",
    "Bizsol.ERP.UI.HR.Test\Bizsol.WebERP.UI.HR.Test.csproj",
    "Bizsol.ERP.UI.HR.Transactions\Bizsol.WebERP.UI.HR.Transactions.csproj",
    "Bizsol.ERP.UI.Marketing.Masters\Bizsol.WebERP.UI.Marketing.Masters.csproj",
    "Bizsol.ERP.UI.Marketing.Reports\Bizsol.WebERP.UI.Marketing.Reports.csproj",
    "Bizsol.ERP.UI.Marketing.Test\Bizsol.WebERP.UI.Marketing.Test.csproj",
    "Bizsol.ERP.UI.Marketing.Transactions\Bizsol.WebERP.UI.Marketing.Transactions.csproj",
    "Bizsol.ERP.UI.MIS.Reports\Bizsol.WebERP.UI.MIS.Reports.csproj",
    "Bizsol.ERP.UI.Production.Masters\Bizsol.WebERP.UI.Production.Masters.csproj",
    "Bizsol.ERP.UI.Production.Reports\Bizsol.WebERP.UI.Production.Reports.csproj",
    "Bizsol.ERP.UI.Production.Test\Bizsol.WebERP.UI.Production.Test.csproj",
    "Bizsol.ERP.UI.Production.Transactions\Bizsol.WebERP.UI.Production.Transactions.csproj",
    "Bizsol.ERP.UI.Purchase.Masters\Bizsol.WebERP.UI.Purchase.Masters.csproj",
    "Bizsol.ERP.UI.Purchase.Reports\Bizsol.WebERP.UI.Purchase.Reports.csproj",
    "Bizsol.ERP.UI.Purchase.Test\Bizsol.WebERP.UI.Purchase.Test.csproj",
    "Bizsol.ERP.UI.Purchase.Transactions\Bizsol.WebERP.UI.Purchase.Transactions.csproj",
    "Bizsol.ERP.UI.Sales.Masters\Bizsol.WebERP.UI.Sales.Masters.csproj",
    "Bizsol.ERP.UI.Sales.Reports\Bizsol.WebERP.UI.Sales.Reports.csproj",
    "Bizsol.ERP.UI.Sales.Test\Bizsol.WebERP.UI.Sales.Test.csproj",
    "Bizsol.ERP.UI.Sales.Transactions\Bizsol.WebERP.UI.Sales.Transactions.csproj",
    "Bizsol.ERP.UI.Taxation.Masters\Bizsol.WebERP.UI.Taxation.Masters.csproj",
    "Bizsol.ERP.UI.Taxation.Reports\Bizsol.WebERP.UI.Taxation.Reports.csproj",
    "Bizsol.ERP.UI.Taxation.Test\Bizsol.WebERP.UI.Taxation.Test.csproj",
    "Bizsol.ERP.UI.Taxation.Transactions\Bizsol.WebERP.UI.Taxation.Transactions.csproj",
    "Bizsol.ERP.UI.Tools\Bizsol.WebERP.UI.Tools.csproj",
    "Bizsol.WebERP.UI.CRM.Reports\Bizsol.WebERP.UI.CRM.Reports.csproj",
    "Bizsol.WebERP.UI.CRM.Transactions\Bizsol.WebERP.UI.CRM.Transactions.csproj",
    "Bizsol.WebERP.UI.Shared\Bizsol.WebERP.UI.Shared.csproj"
)

$created = 0
$skipped = 0

foreach ($project in $projects) {
    $projectDir = Split-Path $project -Parent
    $wwwrootPath = Join-Path $projectDir "wwwroot"
    
    if (-not (Test-Path $wwwrootPath)) {
        Write-Host "Creating wwwroot folder: $wwwrootPath" -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $wwwrootPath -Force | Out-Null
        
        # Create a placeholder .gitkeep file
        $gitkeepPath = Join-Path $wwwrootPath ".gitkeep"
        Set-Content -Path $gitkeepPath -Value "# This folder is for static files (js, css, images, etc.)"
        
        $created++
    } else {
        Write-Host "Already exists: $wwwrootPath" -ForegroundColor Green
        $skipped++
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "  Created: $created folders" -ForegroundColor Yellow
Write-Host "  Skipped: $skipped folders (already exist)" -ForegroundColor Green
Write-Host "`nNow run 'dotnet clean' and 'dotnet build' to regenerate manifests." -ForegroundColor Cyan
