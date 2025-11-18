# Architecture Diagram - Static Files via RCL

## ?? Solution Architecture

```
BizsolERP Solution
?
??? BizsolERPMain (Web Application - Startup Project)
?   ??? Program.cs ?????????????
?   ??? Controllers/           ?  Registers all RCL static files
?   ??? Views/                 ?  via RegisterRazorClassLibraryStaticFiles()
?   ??? wwwroot/               ?
?                              ?
??? Bizsol.WebERP.UI.Shared (RCL) ????
?   ??? Program.cs (marker class)
?   ??? wwwroot/ ??? Embedded into assembly ??? Served at /_content/Bizsol.WebERP.UI.Shared/
?       ??? js/
?       ??? css/
?       ??? images/
?
??? Bizsol.ERP.UI.HR.Masters (RCL)
?   ??? Program.cs (marker class)
?   ??? wwwroot/ ??? Embedded into assembly ??? Served at /_content/Bizsol.WebERP.UI.HR.Masters/
?
??? Bizsol.ERP.UI.HR.Transactions (RCL)
?   ??? Program.cs (marker class)
?   ??? wwwroot/ ??? Embedded into assembly ??? Served at /_content/Bizsol.WebERP.UI.HR.Transactions/
?
??? Bizsol.ERP.UI.Sales.Masters (RCL)
?   ??? Program.cs (marker class)
?   ??? wwwroot/ ??? Embedded into assembly ??? Served at /_content/Bizsol.WebERP.UI.Sales.Masters/
?
??? Bizsol.WebERP.UI.CRM.Transactions (RCL)
?   ??? Program.cs (marker class)
?   ??? wwwroot/ ??? Embedded into assembly ??? Served at /_content/Bizsol.WebERP.UI.CRM.Transactions/
?       ??? js/
?           ??? DirectOrderEntry.js
?
??? [... 32 more RCL projects following same pattern ...]
```

## ?? Request Flow Diagram

```
Browser Request for Static File
        ?
        ??? Request: /_content/Bizsol.WebERP.UI.CRM.Transactions/js/DirectOrderEntry.js
        ?
        ?
BizsolERPMain Application
        ?
        ??? Static File Middleware checks registered paths
        ?
        ??? Finds ManifestEmbeddedFileProvider for Bizsol.WebERP.UI.CRM.Transactions
        ?
        ??? Reads embedded file from assembly
        ?   (wwwroot/js/DirectOrderEntry.js)
        ?
        ?
    File served to browser
```

## ?? Build Process Diagram

```
Development Time:
    
    Developer adds file:
    Bizsol.WebERP.UI.CRM.Transactions/wwwroot/js/DirectOrderEntry.js
        ?
        ?
    Build Process (dotnet build)
        ?
        ??? Project uses Microsoft.NET.Sdk.Razor
        ??? GenerateEmbeddedFilesManifest = true
        ??? Reads all files in wwwroot/
        ?
        ?
    Files embedded into assembly:
    Bizsol.WebERP.UI.CRM.Transactions.dll
        ?
        ??? Contains: DirectOrderEntry.js (embedded resource)
        ??? Contains: Manifest (file path mapping)
        ?
        ?
    Runtime:
    ManifestEmbeddedFileProvider extracts and serves files
```

## ??? Module Organization

```
BizsolERP Modules (37 RCL Projects)

Common Module (4 projects)
??? Bizsol.WebERP.UI.Common.Masters
??? Bizsol.WebERP.UI.Common.Reports
??? Bizsol.WebERP.UI.Common.Test
??? Bizsol.WebERP.UI.Common.Transactions

Finance Module (4 projects)
??? Bizsol.WebERP.UI.Finance.Masters
??? Bizsol.WebERP.UI.Finance.Reports
??? Bizsol.WebERP.UI.Finance.Test
??? Bizsol.WebERP.UI.Finance.Transactions

HR Module (4 projects)
??? Bizsol.WebERP.UI.HR.Masters
??? Bizsol.WebERP.UI.HR.Reports
??? Bizsol.WebERP.UI.HR.Test
??? Bizsol.WebERP.UI.HR.Transactions

Marketing Module (4 projects)
??? Bizsol.WebERP.UI.Marketing.Masters
??? Bizsol.WebERP.UI.Marketing.Reports
??? Bizsol.WebERP.UI.Marketing.Test
??? Bizsol.WebERP.UI.Marketing.Transactions

Production Module (4 projects)
??? Bizsol.WebERP.UI.Production.Masters
??? Bizsol.WebERP.UI.Production.Reports
??? Bizsol.WebERP.UI.Production.Test
??? Bizsol.WebERP.UI.Production.Transactions

Purchase Module (4 projects)
??? Bizsol.WebERP.UI.Purchase.Masters
??? Bizsol.WebERP.UI.Purchase.Reports
??? Bizsol.WebERP.UI.Purchase.Test
??? Bizsol.WebERP.UI.Purchase.Transactions

Sales Module (4 projects)
??? Bizsol.WebERP.UI.Sales.Masters
??? Bizsol.WebERP.UI.Sales.Reports
??? Bizsol.WebERP.UI.Sales.Test
??? Bizsol.WebERP.UI.Sales.Transactions

Taxation Module (4 projects)
??? Bizsol.WebERP.UI.Taxation.Masters
??? Bizsol.WebERP.UI.Taxation.Reports
??? Bizsol.WebERP.UI.Taxation.Test
??? Bizsol.WebERP.UI.Taxation.Transactions

CRM Module (2 projects)
??? Bizsol.WebERP.UI.CRM.Reports
??? Bizsol.WebERP.UI.CRM.Transactions

Other Modules (3 projects)
??? Bizsol.WebERP.UI.MIS.Reports
??? Bizsol.WebERP.UI.Tools
??? Bizsol.WebERP.UI.Shared (Common utilities)
```

## ?? URL Path Mapping

```
Project File Location                           Browser URL
?????????????????????????????????????????????????????????????????????????????
Bizsol.WebERP.UI.Shared/                    ?   /_content/Bizsol.WebERP.UI.Shared/
  wwwroot/js/environment.js                     /_content/Bizsol.WebERP.UI.Shared/js/environment.js

Bizsol.ERP.UI.HR.Masters/                   ?   /_content/Bizsol.WebERP.UI.HR.Masters/
  wwwroot/js/employee.js                        /_content/Bizsol.WebERP.UI.HR.Masters/js/employee.js

Bizsol.WebERP.UI.CRM.Transactions/          ?   /_content/Bizsol.WebERP.UI.CRM.Transactions/
  wwwroot/js/DirectOrderEntry.js                /_content/Bizsol.WebERP.UI.CRM.Transactions/js/DirectOrderEntry.js

Bizsol.ERP.UI.Sales.Transactions/           ?   /_content/Bizsol.WebERP.UI.Sales.Transactions/
  wwwroot/css/sales-order.css                   /_content/Bizsol.WebERP.UI.Sales.Transactions/css/sales-order.css
```

## ?? Dependency Flow

```
BizsolERPMain (Main Web App)
    ?
    ???? References All Module Projects ?????
    ?                                        ?
    ?                                        ?
Module Projects (37 RCLs)              Static File Serving
    ?                                        ?
    ???? All Reference                       ???? ManifestEmbeddedFileProvider
    ?    Bizsol.WebERP.UI.Shared            ?    extracts files from assemblies
    ?                                        ?
    ?                                        ?
Common Utilities                       Files served to browser
(Shared Project)                       via /_content/ paths
```

## ?? File Embedding Process

```
Source File (Development)
    ?
    ?   Bizsol.WebERP.UI.CRM.Transactions/wwwroot/js/DirectOrderEntry.js
    ?
    ?
Build Time
    ?
    ??? SDK: Microsoft.NET.Sdk.Razor
    ??? Property: GenerateEmbeddedFilesManifest = true
    ??? ItemGroup: <EmbeddedResource Include="wwwroot\**\*" />
    ?
    ?
Compiled Assembly
    ?
    ?   Bizsol.WebERP.UI.CRM.Transactions.dll
    ?   ???? Code
    ?   ???? Metadata
    ?   ???? Embedded Resources
    ?        ???? wwwroot/js/DirectOrderEntry.js (binary data)
    ?
    ?
Runtime
    ?
    ??? ManifestEmbeddedFileProvider reads manifest
    ??? Extracts file from assembly when requested
    ??? Serves to browser with proper content-type
```

## ?? View Reference Pattern

```razor
@* Any View File (e.g., DirectOrderEntry.cshtml) *@

<!DOCTYPE html>
<html>
<head>
    @* Shared resources (used everywhere) *@
    <script src="~/_content/Bizsol.WebERP.UI.Shared/js/environment.js"></script>
    <link rel="stylesheet" href="~/_content/Bizsol.WebERP.UI.Shared/css/common.css" />
    
    @* Module-specific resources *@
    <script src="~/_content/Bizsol.WebERP.UI.CRM.Transactions/js/DirectOrderEntry.js"></script>
    <link rel="stylesheet" href="~/_content/Bizsol.WebERP.UI.CRM.Transactions/css/orders.css" />
</head>
<body>
    <div>Your content here</div>
</body>
</html>
```

## ?? Path Resolution

```
View Reference:
~/_content/Bizsol.WebERP.UI.CRM.Transactions/js/DirectOrderEntry.js
    ?
    ??? ~ resolves to application root
    ??? /_content/ is RCL static file convention
    ??? Bizsol.WebERP.UI.CRM.Transactions is the project name
    ??? /js/DirectOrderEntry.js is path within wwwroot
    ?
    ?
Final URL:
https://your-domain.com/_content/Bizsol.WebERP.UI.CRM.Transactions/js/DirectOrderEntry.js
```

## ?? Benefits Visualization

```
Before RCL:                     After RCL:

File Duplication               Single Source of Truth
    ?                               ?
    ?? Project A: file.js          ?? Module Project: file.js
    ?? Project B: file.js          ?   (embedded in assembly)
    ?? Project C: file.js          ?
                                   ??? Project A references
Manual Copying                   ??? Project B references
    ?                            ??? Project C references
    ?? Copy & Paste                  ?
    ?? Out of sync                   ??? Always in sync

Hard to Maintain                Easy to Maintain
    ?                               ?
    ?? Update 3+ places            ?? Update once
    ?? Easy to miss

No Version Control              Version Control
    ?                               ?
    ?? Files scattered             ?? Files with module code
```

---

## ?? Quick Reference

| Item | Value |
|------|-------|
| **Total Projects** | 37 RCL + 1 Main App |
| **Path Pattern** | `~/_content/[ProjectName]/[path]` |
| **File Location** | `[ProjectFolder]/wwwroot/` |
| **Serves From** | Embedded assembly resources |
| **Build SDK** | Microsoft.NET.Sdk.Razor |
| **Provider** | ManifestEmbeddedFileProvider |

---

This architecture provides a clean, maintainable, and scalable approach to managing static files across your entire BizsolERP solution! ??
