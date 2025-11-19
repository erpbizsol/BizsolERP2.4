# PowerShell script to convert all projects to Razor Class Libraries

$projects = @(
    "Bizsol.ERP.UI.Finance.Masters\Bizsol.WebERP.UI.Finance.Masters.csproj",
    "Bizsol.ERP.UI.Finance.Reports\Bizsol.WebERP.UI.Finance.Reports.csproj",
    "Bizsol.ERP.UI.Finance.Test\Bizsol.WebERP.UI.Finance.Test.csproj",
    "Bizsol.ERP.UI.Finance.Transactions\Bizsol.WebERP.UI.Finance.Transactions.csproj",
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
    "Bizsol.WebERP.UI.CRM.Reports\Bizsol.WebERP.UI.CRM.Reports.csproj"
)

foreach ($project in $projects) {
    Write-Host "Processing: $project"
    
    $content = Get-Content $project -Raw
    
    # Replace SDK
    $content = $content -replace 'Sdk="Microsoft\.NET\.Sdk\.Web"', 'Sdk="Microsoft.NET.Sdk.Razor"'
    
    # Add RCL properties after ImplicitUsings
    if ($content -match '(<ImplicitUsings>.*?</ImplicitUsings>)' -and $content -notmatch 'AddRazorSupportForMvc') {
        $content = $content -replace '(<ImplicitUsings>.*?</ImplicitUsings>)', "`$1`r`n    <AddRazorSupportForMvc>true</AddRazorSupportForMvc>`r`n    <GenerateEmbeddedFilesManifest>true</GenerateEmbeddedFilesManifest>"
    }
    
    # Add EmbeddedResource for wwwroot files after first PropertyGroup
    if ($content -notmatch '<EmbeddedResource Include="wwwroot') {
        $content = $content -replace '(</PropertyGroup>\r?\n)', "`$1`r`n  <ItemGroup>`r`n    <EmbeddedResource Include=`"wwwroot\**\*`" />`r`n  </ItemGroup>`r`n"
    }
    
    # Add Microsoft.Extensions.FileProviders.Embedded package if not present
    if ($content -notmatch 'Microsoft\.Extensions\.FileProviders\.Embedded') {
        if ($content -match '<PackageReference') {
            $content = $content -replace '(<PackageReference[^>]*>)', "`$1`r`n    <PackageReference Include=`"Microsoft.Extensions.FileProviders.Embedded`" Version=`"8.0.0`" />"
        } else {
            # Create ItemGroup for PackageReference if none exists
            $content = $content -replace '(</PropertyGroup>\r?\n  <ItemGroup>\r?\n    <EmbeddedResource[^>]*/>)', "`$1`r`n  </ItemGroup>`r`n`r`n  <ItemGroup>`r`n    <PackageReference Include=`"Microsoft.Extensions.FileProviders.Embedded`" Version=`"8.0.0`" />"
        }
    }
    
    Set-Content $project -Value $content
    Write-Host "Completed: $project" -ForegroundColor Green
}

Write-Host "`nAll projects updated!" -ForegroundColor Cyan
