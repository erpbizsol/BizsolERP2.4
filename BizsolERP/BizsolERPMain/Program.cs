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
            string Bizsol_WebERP_UI_SharedContentRootPath = Path.Combine(app.Environment.ContentRootPath.Replace("BizsolERPMain", ""), "Bizsol.WebERP.UI.Shared");

            app.UseStaticFiles();
            //app.UseStaticFiles(new StaticFileOptions
            //{
            //    FileProvider = new PhysicalFileProvider(
            //    Path.Combine(Bizsol_WebERP_UI_SharedContentRootPath, "NS")),
            //    RequestPath = "/NR"
            //});

            app.UseSession();
            app.UseRouting();

            app.UseAuthorization();

            //app.MapControllerRoute(
            //   name: "Home",
            //   pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");

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
    }
}