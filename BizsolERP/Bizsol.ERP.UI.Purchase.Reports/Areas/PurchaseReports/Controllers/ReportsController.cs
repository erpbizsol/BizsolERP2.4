using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Reports.Areas.PurchaseReports.Controllers
{
    [Area("PurchaseReports")]
    public class ReportsController : Controller
    {
        public IActionResult MaizeReport()
        {
            return View();
        }
    }
}
