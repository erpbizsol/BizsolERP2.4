using Microsoft.AspNetCore.Mvc;

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
                    }))
                // Explicitly register Finance RCL assemblies so their controllers
                // are always discovered even when the RCL was previously an empty stub.
                .AddApplicationPart(
                    typeof(Bizsol.ERP.UI.Finance.Transactions.Program).Assembly)
                .AddApplicationPart(
                    typeof(Bizsol.ERP.UI.Finance.Masters.Program).Assembly)
                .AddApplicationPart(
                    typeof(Bizsol.ERP.UI.MIS.Reports.Program).Assembly)
                .AddApplicationPart(
                    typeof(Bizsol.ERP.UI.Common.Reports.Program).Assembly)
                .AddApplicationPart(
                    typeof(Bizsol.ERP.UI.Marketing.Reports.Program).Assembly);

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();

            // Serve static files from wwwroot and all RCL _content paths
            app.UseStaticFiles();

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
                name: "SalesTestArea",
                pattern: "{area:exists}/{controller=TestTheme}/{action=Index}/{id?}"
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

            app.MapControllerRoute(
               name: "PurchaseReports",
               pattern: "{area:exists}/{controller=Reports}/{action=MaizeReport}/{id?}");

            app.MapControllerRoute(
               name: "SalesReports",
               pattern: "{area:exists}/{controller=Reports}/{action=BillWiseOutStandingReport}/{id?}");

            app.MapControllerRoute(
               name: "PurchaseMasters",
               pattern: "{area:exists}/{controller=PurchaseOrder}/{action=POApprovalConfiguration}/{id?}");

            app.MapAreaControllerRoute(
               name: "MISReports",
               areaName: "MISReports",
               pattern: "MISReports/{controller=Report}/{action=DayWiseMISReport}/{id?}");

            app.MapAreaControllerRoute(
               name: "MarketingReports",
               areaName: "MarketingReports",
               pattern: "MarketingReports/{controller=OrderLoadReport}/{action=OrderLoadReport}/{id?}");

            app.MapAreaControllerRoute(
               name: "FinanceTransactions",
               areaName: "FinanceTransactions",
               pattern: "FinanceTransactions/{controller=BankStatement}/{action=BankStatementList}/{id?}");

            app.MapAreaControllerRoute(
               name: "FinanceMasters",
               areaName: "FinanceMasters",
               pattern: "FinanceMasters/{controller=BankMaster}/{action=BankMaster}/{id?}");

            app.Run();
        }
    }
}