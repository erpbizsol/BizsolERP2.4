using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;

namespace BizsolERPMain
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddControllersWithViews();
            // builder.Services.AddControllersWithViews().AddRazorRuntimeCompilation();
            builder.Services.AddSession(options =>
            {
                options.IdleTimeout = TimeSpan.FromMinutes(30); // Set session timeout
            });

            builder.Services.AddControllersWithViews().AddMvcOptions(options =>
                options.Filters.Add(
                    new ResponseCacheAttribute
                    {
                        NoStore = true
                    }));

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();

            // Serve static files from wwwroot
            app.UseStaticFiles();
            
            // Serve static files from all Razor Class Libraries under _content path
            RegisterRazorClassLibraryStaticFiles(app);

            app.UseSession();
            app.UseRouting();

            app.UseAuthorization();

            app.MapControllerRoute(
               name: "HRMasters",
               pattern: "{area:exists}/{controller=HRMasters}/{action=EmployeeMaster}/{id?}");

            app.MapControllerRoute(
                name: "CommonMasters",
                pattern: "{area:exists}/{controller=CommonMasters}/{action=StateMaster}/{id?}");

            app.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}/{id?}"
                );
            app.MapControllerRoute(
                name: "ProductionTestArea",
                pattern: "{area:exists}/{controller=DemoCustom}/{action=DemoCustomControl}/{id?}"
                );
            app.MapControllerRoute(
              name: "PurchaseTransactions",
              pattern: "{area:exists}/{controller=ApproveVerify}/{action=POApproval}/{id?}");

            app.MapControllerRoute(
            name: "ProductionTransactions",
            pattern: "{area:exists}/{controller=StockTransferWarehouse}/{action=GetWarehouse}/{id?}");

            app.MapControllerRoute(
                name: "CRMTransactions",
                pattern: "{area:exists}/{controller=Visit}/{action=VisitOrderEntry}/{id?}");

            app.MapControllerRoute(
                name: "ProductionMasters",
                pattern: "{area:exists}/{controller=Slitting}/{action=SlittingProductionEntry}/{id?}");

            app.Run();
        }

        private static void RegisterRazorClassLibraryStaticFiles(WebApplication app)
        {
            // Register static files from all Razor Class Libraries
            var rclAssemblies = new[]
            {
                (typeof(Bizsol.WebERP.UI.Shared.Program).Assembly, "Bizsol.WebERP.UI.Shared"),
                (typeof(Bizsol.ERP.UI.Common.Masters.Program).Assembly, "Bizsol.WebERP.UI.Common.Masters"),
                (typeof(Bizsol.ERP.UI.Common.Reports.Program).Assembly, "Bizsol.WebERP.UI.Common.Reports"),
                (typeof(Bizsol.ERP.UI.Common.Test.Program).Assembly, "Bizsol.WebERP.UI.Common.Test"),
                (typeof(Bizsol.ERP.UI.Common.Transactions.Program).Assembly, "Bizsol.WebERP.UI.Common.Transactions"),
                (typeof(Bizsol.ERP.UI.Finance.Masters.Program).Assembly, "Bizsol.WebERP.UI.Finance.Masters"),
                (typeof(Bizsol.ERP.UI.Finance.Reports.Program).Assembly, "Bizsol.WebERP.UI.Finance.Reports"),
                (typeof(Bizsol.ERP.UI.Finance.Test.Program).Assembly, "Bizsol.WebERP.UI.Finance.Test"),
                (typeof(Bizsol.ERP.UI.Finance.Transactions.Program).Assembly, "Bizsol.WebERP.UI.Finance.Transactions"),
                (typeof(Bizsol.ERP.UI.HR.Masters.Program).Assembly, "Bizsol.WebERP.UI.HR.Masters"),
                (typeof(Bizsol.ERP.UI.HR.Reports.Program).Assembly, "Bizsol.WebERP.UI.HR.Reports"),
                (typeof(Bizsol.ERP.UI.HR.Test.Program).Assembly, "Bizsol.WebERP.UI.HR.Test"),
                (typeof(Bizsol.ERP.UI.HR.Transactions.Program).Assembly, "Bizsol.WebERP.UI.HR.Transactions"),
                (typeof(Bizsol.ERP.UI.Marketing.Masters.Program).Assembly, "Bizsol.WebERP.UI.Marketing.Masters"),
                (typeof(Bizsol.ERP.UI.Marketing.Reports.Program).Assembly, "Bizsol.WebERP.UI.Marketing.Reports"),
                (typeof(Bizsol.ERP.UI.Marketing.Test.Program).Assembly, "Bizsol.WebERP.UI.Marketing.Test"),
                (typeof(Bizsol.ERP.UI.Marketing.Transactions.Program).Assembly, "Bizsol.WebERP.UI.Marketing.Transactions"),
                (typeof(Bizsol.ERP.UI.MIS.Reports.Program).Assembly, "Bizsol.WebERP.UI.MIS.Reports"),
                (typeof(Bizsol.ERP.UI.Production.Masters.Program).Assembly, "Bizsol.WebERP.UI.Production.Masters"),
                (typeof(Bizsol.ERP.UI.Production.Reports.Program).Assembly, "Bizsol.WebERP.UI.Production.Reports"),
                (typeof(Bizsol.ERP.UI.Production.Test.Program).Assembly, "Bizsol.WebERP.UI.Production.Test"),
                (typeof(Bizsol.ERP.UI.Production.Transactions.Program).Assembly, "Bizsol.WebERP.UI.Production.Transactions"),
                (typeof(Bizsol.ERP.UI.Purchase.Masters.Program).Assembly, "Bizsol.WebERP.UI.Purchase.Masters"),
                (typeof(Bizsol.ERP.UI.Purchase.Reports.Program).Assembly, "Bizsol.WebERP.UI.Purchase.Reports"),
                (typeof(Bizsol.ERP.UI.Purchase.Test.Program).Assembly, "Bizsol.WebERP.UI.Purchase.Test"),
                (typeof(Bizsol.ERP.UI.Purchase.Transactions.Program).Assembly, "Bizsol.WebERP.UI.Purchase.Transactions"),
                (typeof(Bizsol.ERP.UI.Sales.Masters.Program).Assembly, "Bizsol.WebERP.UI.Sales.Masters"),
                (typeof(Bizsol.ERP.UI.Sales.Reports.Program).Assembly, "Bizsol.WebERP.UI.Sales.Reports"),
                (typeof(Bizsol.ERP.UI.Sales.Test.Program).Assembly, "Bizsol.WebERP.UI.Sales.Test"),
                (typeof(Bizsol.ERP.UI.Sales.Transactions.Program).Assembly, "Bizsol.WebERP.UI.Sales.Transactions"),
                (typeof(Bizsol.ERP.UI.Taxation.Masters.Program).Assembly, "Bizsol.WebERP.UI.Taxation.Masters"),
                (typeof(Bizsol.ERP.UI.Taxation.Reports.Program).Assembly, "Bizsol.WebERP.UI.Taxation.Reports"),
                (typeof(Bizsol.ERP.UI.Taxation.Test.Program).Assembly, "Bizsol.WebERP.UI.Taxation.Test"),
                (typeof(Bizsol.ERP.UI.Taxation.Transactions.Program).Assembly, "Bizsol.WebERP.UI.Taxation.Transactions"),
                (typeof(Bizsol.ERP.UI.Tools.Program).Assembly, "Bizsol.WebERP.UI.Tools"),
                (typeof(Bizsol.WebERP.UI.CRM.Reports.Program).Assembly, "Bizsol.WebERP.UI.CRM.Reports"),
                (typeof(Bizsol.WebERP.UI.CRM.Transactions.Program).Assembly, "Bizsol.WebERP.UI.CRM.Transactions")
            };

            foreach (var (assembly, name) in rclAssemblies)
            {
                // Skip assemblies that don't have any embedded resources
                if (assembly.GetManifestResourceNames().Length == 0)
                {
                    continue;
                }

                try
                {
                    var fileProvider = new ManifestEmbeddedFileProvider(assembly, "wwwroot");
                    
                    // Verify the provider has accessible content before registering
                    var contents = fileProvider.GetDirectoryContents(string.Empty);
                    if (contents.Exists)
                    {
                        app.UseStaticFiles(new StaticFileOptions
                        {
                            FileProvider = fileProvider,
                            RequestPath = $"/_content/{name}"
                        });
                    }
                }
                catch (InvalidOperationException)
                {
                    // Skip assemblies where the manifest file is missing or invalid
                    // This can happen if the RCL wasn't built with GenerateEmbeddedFilesManifest
                    continue;
                }
            }
        }
    }
}