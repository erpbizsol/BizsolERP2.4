using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Reports.Areas.PurchaseReports.Controllers
{
    [Area("PurchaseReports")]
    public class POGRNBillingReportController : Controller
    {
        public IActionResult POGRNBillingReport()
        {
            return View();
        }
    }
}
