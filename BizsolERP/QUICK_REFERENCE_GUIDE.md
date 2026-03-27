# Quick Reference Guide - Using Static Files from RCL Projects

## ?? Quick Start Examples

### Example 1: Using JavaScript from CRM Transactions
In your view file (e.g., `DirectOrderEntry.cshtml`):

```html
<!-- OLD WAY (if files were in same project) -->
<script src="~/js/DirectOrderEntry.js"></script>

<!-- NEW WAY (files from CRM.Transactions project) -->
<script src="~/_content/Bizsol.WebERP.UI.CRM.Transactions/js/DirectOrderEntry.js"></script>
```

### Example 2: Using Shared Environment Script
```html
<!-- From Shared project -->
<script src="~/_content/Bizsol.WebERP.UI.Shared/js/environment.js"></script>
```

### Example 3: Using CSS from Purchase Module
```html
<link rel="stylesheet" href="~/_content/Bizsol.WebERP.UI.Purchase.Transactions/css/purchase-orders.css" />
```

### Example 4: Using Images from Marketing
```html
<img src="~/_content/Bizsol.WebERP.UI.Marketing.Masters/images/product-banner.jpg" alt="Product" />
```

## ??? Project Name Reference Table

| Module Area | Project Type | Full Path Prefix |
|-------------|-------------|-----------------|
| **Common** | Masters | `/_content/Bizsol.WebERP.UI.Common.Masters/` |
| | Reports | `/_content/Bizsol.WebERP.UI.Common.Reports/` |
| | Test | `/_content/Bizsol.WebERP.UI.Common.Test/` |
| | Transactions | `/_content/Bizsol.WebERP.UI.Common.Transactions/` |
| **Finance** | Masters | `/_content/Bizsol.WebERP.UI.Finance.Masters/` |
| | Reports | `/_content/Bizsol.WebERP.UI.Finance.Reports/` |
| | Test | `/_content/Bizsol.WebERP.UI.Finance.Test/` |
| | Transactions | `/_content/Bizsol.WebERP.UI.Finance.Transactions/` |
| **HR** | Masters | `/_content/Bizsol.WebERP.UI.HR.Masters/` |
| | Reports | `/_content/Bizsol.WebERP.UI.HR.Reports/` |
| | Test | `/_content/Bizsol.WebERP.UI.HR.Test/` |
| | Transactions | `/_content/Bizsol.WebERP.UI.HR.Transactions/` |
| **Marketing** | Masters | `/_content/Bizsol.WebERP.UI.Marketing.Masters/` |
| | Reports | `/_content/Bizsol.WebERP.UI.Marketing.Reports/` |
| | Test | `/_content/Bizsol.WebERP.UI.Marketing.Test/` |
| | Transactions | `/_content/Bizsol.WebERP.UI.Marketing.Transactions/` |
| **Production** | Masters | `/_content/Bizsol.WebERP.UI.Production.Masters/` |
| | Reports | `/_content/Bizsol.WebERP.UI.Production.Reports/` |
| | Test | `/_content/Bizsol.WebERP.UI.Production.Test/` |
| | Transactions | `/_content/Bizsol.WebERP.UI.Production.Transactions/` |
| **Purchase** | Masters | `/_content/Bizsol.WebERP.UI.Purchase.Masters/` |
| | Reports | `/_content/Bizsol.WebERP.UI.Purchase.Reports/` |
| | Test | `/_content/Bizsol.WebERP.UI.Purchase.Test/` |
| | Transactions | `/_content/Bizsol.WebERP.UI.Purchase.Transactions/` |
| **Sales** | Masters | `/_content/Bizsol.WebERP.UI.Sales.Masters/` |
| | Reports | `/_content/Bizsol.WebERP.UI.Sales.Reports/` |
| | Test | `/_content/Bizsol.WebERP.UI.Sales.Test/` |
| | Transactions | `/_content/Bizsol.WebERP.UI.Sales.Transactions/` |
| **Taxation** | Masters | `/_content/Bizsol.WebERP.UI.Taxation.Masters/` |
| | Reports | `/_content/Bizsol.WebERP.UI.Taxation.Reports/` |
| | Test | `/_content/Bizsol.WebERP.UI.Taxation.Test/` |
| | Transactions | `/_content/Bizsol.WebERP.UI.Taxation.Transactions/` |
| **CRM** | Reports | `/_content/Bizsol.WebERP.UI.CRM.Reports/` |
| | Transactions | `/_content/Bizsol.WebERP.UI.CRM.Transactions/` |
| **Other** | MIS Reports | `/_content/Bizsol.WebERP.UI.MIS.Reports/` |
| | Tools | `/_content/Bizsol.WebERP.UI.Tools/` |
| | Shared | `/_content/Bizsol.WebERP.UI.Shared/` |

## ?? Finding the Right Path

### Method 1: By Project Folder
1. Look at your project folder name (e.g., `Bizsol.ERP.UI.HR.Masters`)
2. Convert to path: `/_content/Bizsol.WebERP.UI.HR.Masters/`
3. Add your file path: `/_content/Bizsol.WebERP.UI.HR.Masters/js/employee.js`

### Method 2: By Module Area
If you're working in:
- **HR area** ? Use `/_content/Bizsol.WebERP.UI.HR.[Type]/`
- **Sales area** ? Use `/_content/Bizsol.WebERP.UI.Sales.[Type]/`
- **CRM area** ? Use `/_content/Bizsol.WebERP.UI.CRM.[Type]/`
- etc.

## ?? Common Scenarios

### Scenario 1: Layout File with Shared Scripts
```html
<!-- _Layout.cshtml -->
<!DOCTYPE html>
<html>
<head>
    <title>@ViewData["Title"] - BizsolERP</title>
    
    <!-- Shared CSS -->
    <link rel="stylesheet" href="~/_content/Bizsol.WebERP.UI.Shared/css/site.css" />
    
    <!-- Module-specific CSS -->
    @RenderSection("Styles", required: false)
</head>
<body>
    @RenderBody()
    
    <!-- Shared JavaScript -->
    <script src="~/_content/Bizsol.WebERP.UI.Shared/js/environment.js"></script>
    <script src="~/_content/Bizsol.WebERP.UI.Shared/js/common.js"></script>
    
    <!-- Page-specific JavaScript -->
    @RenderSection("Scripts", required: false)
</body>
</html>
```

### Scenario 2: Page with Module-Specific Resources
```html
<!-- DirectOrderEntry.cshtml -->
@{
    ViewData["Title"] = "Direct Order Entry";
}

@section Styles {
    <link rel="stylesheet" href="~/_content/Bizsol.WebERP.UI.CRM.Transactions/css/order-entry.css" />
}

<div class="order-entry-container">
    <!-- Your content -->
</div>

@section Scripts {
    <script src="~/_content/Bizsol.WebERP.UI.CRM.Transactions/js/DirectOrderEntry.js"></script>
}
```

### Scenario 3: Using Multiple Module Resources
```html
<!-- Complex page using resources from multiple modules -->
@section Scripts {
    <!-- Shared utilities -->
    <script src="~/_content/Bizsol.WebERP.UI.Shared/js/utilities.js"></script>
    
    <!-- Finance calculations -->
    <script src="~/_content/Bizsol.WebERP.UI.Finance.Transactions/js/calculations.js"></script>
    
    <!-- Sales specific -->
    <script src="~/_content/Bizsol.WebERP.UI.Sales.Transactions/js/sales-order.js"></script>
    
    <!-- Current page -->
    <script src="~/_content/Bizsol.WebERP.UI.CRM.Transactions/js/DirectOrderEntry.js"></script>
}
```

## ?? Important Notes

### Do's ?
- Always use `~/_content/` prefix (tilde is important)
- Use the exact project display name (case-sensitive on Linux)
- Keep your wwwroot folder structure organized
- Use this pattern for all static files (JS, CSS, images, fonts, etc.)

### Don'ts ?
- Don't use `~/js/file.js` for files in other projects
- Don't manually copy files between projects
- Don't use absolute paths
- Don't forget to rebuild after adding new static files

## ?? Troubleshooting

### Problem: File Not Found (404)
**Causes:**
1. File doesn't exist in the project's wwwroot folder
2. Wrong project name in path
3. Typo in filename
4. Project not built/referenced

**Solution:**
1. Verify file exists: `[ProjectFolder]/wwwroot/[path]`
2. Check project name matches exactly
3. Rebuild the solution
4. Check browser dev tools network tab for exact 404 path

### Problem: Old Files Being Served
**Cause:** Browser cache or assembly not rebuilt

**Solution:**
```bash
# Clean and rebuild
dotnet clean
dotnet build
# Hard refresh browser (Ctrl+Shift+R or Ctrl+F5)
```

### Problem: Can't Access File from New Project
**Cause:** Project not registered in Program.cs

**Solution:** Add to `RegisterRazorClassLibraryStaticFiles` method in `BizsolERPMain/Program.cs`

## ?? Tips & Best Practices

1. **Organize by Feature**: Keep related JS, CSS, and images together in each module
2. **Use Shared for Common**: Put truly common resources in `Bizsol.WebERP.UI.Shared`
3. **Module Independence**: Each module should have its own resources when possible
4. **Clear Naming**: Use descriptive filenames that match the page/feature
5. **Version Control**: Commit static files with your code changes

## ?? Need Help?

If you're unsure which project a file should be in:
- **Shared across all modules?** ? `Bizsol.WebERP.UI.Shared`
- **Specific to HR features?** ? `Bizsol.WebERP.UI.HR.[Masters/Reports/Test/Transactions]`
- **Used in multiple HR screens?** ? `Bizsol.WebERP.UI.HR.Masters`
- **Specific to one transaction?** ? `Bizsol.WebERP.UI.HR.Transactions`
