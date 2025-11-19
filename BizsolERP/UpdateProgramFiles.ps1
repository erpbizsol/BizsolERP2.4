# PowerShell script to update all Program.cs files to marker classes

$programFiles = @(
    "Bizsol.ERP.UI.Common.Masters\Program.cs",
    "Bizsol.ERP.UI.Common.Reports\Program.cs",
    "Bizsol.ERP.UI.Common.Test\Program.cs",
    "Bizsol.ERP.UI.Common.Transactions\Program.cs",
    "Bizsol.ERP.UI.Finance.Masters\Program.cs",
    "Bizsol.ERP.UI.Finance.Reports\Program.cs",
    "Bizsol.ERP.UI.Finance.Test\Program.cs",
    "Bizsol.ERP.UI.Finance.Transactions\Program.cs",
    "Bizsol.ERP.UI.HR.Masters\Program.cs",
    "Bizsol.ERP.UI.HR.Reports\Program.cs",
    "Bizsol.ERP.UI.HR.Test\Program.cs",
    "Bizsol.ERP.UI.HR.Transactions\Program.cs",
    "Bizsol.ERP.UI.Marketing.Masters\Program.cs",
    "Bizsol.ERP.UI.Marketing.Reports\Program.cs",
    "Bizsol.ERP.UI.Marketing.Test\Program.cs",
    "Bizsol.ERP.UI.Marketing.Transactions\Program.cs",
    "Bizsol.ERP.UI.MIS.Reports\Program.cs",
    "Bizsol.ERP.UI.Production.Masters\Program.cs",
    "Bizsol.ERP.UI.Production.Reports\Program.cs",
    "Bizsol.ERP.UI.Production.Test\Program.cs",
    "Bizsol.ERP.UI.Production.Transactions\Program.cs",
    "Bizsol.ERP.UI.Purchase.Masters\Program.cs",
    "Bizsol.ERP.UI.Purchase.Reports\Program.cs",
    "Bizsol.ERP.UI.Purchase.Test\Program.cs",
    "Bizsol.ERP.UI.Purchase.Transactions\Program.cs",
    "Bizsol.ERP.UI.Sales.Masters\Program.cs",
    "Bizsol.ERP.UI.Sales.Reports\Program.cs",
    "Bizsol.ERP.UI.Sales.Test\Program.cs",
    "Bizsol.ERP.UI.Sales.Transactions\Program.cs",
    "Bizsol.ERP.UI.Taxation.Masters\Program.cs",
    "Bizsol.ERP.UI.Taxation.Reports\Program.cs",
    "Bizsol.ERP.UI.Taxation.Test\Program.cs",
    "Bizsol.ERP.UI.Taxation.Transactions\Program.cs",
    "Bizsol.ERP.UI.Tools\Program.cs",
    "Bizsol.WebERP.UI.CRM.Reports\Program.cs",
    "Bizsol.WebERP.UI.CRM.Transactions\Program.cs"
)

foreach ($file in $programFiles) {
    Write-Host "Processing: $file"
    
    $content = Get-Content $file -Raw
    
    # Extract namespace from the file
    if ($content -match 'namespace\s+([\w\.]+)') {
        $namespace = $Matches[1]
        
        $newContent = @"
namespace $namespace
{
    // This is a marker class for the Razor Class Library
    // It's used to reference the assembly for embedded resources
    public class Program
    {
        // No Main method needed for RCL
    }
}
"@
        
        Set-Content $file -Value $newContent
        Write-Host "Completed: $file" -ForegroundColor Green
    } else {
        Write-Host "Could not find namespace in: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nAll Program.cs files updated!" -ForegroundColor Cyan
