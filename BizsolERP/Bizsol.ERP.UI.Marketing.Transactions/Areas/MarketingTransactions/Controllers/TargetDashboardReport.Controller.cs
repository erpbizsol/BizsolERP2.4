using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Transactions.Areas.MarketingTransactions.Controllers
{
    [Area("MarketingTransactions")]
    public class TargetDashboardReportController : Controller
    {
        public IActionResult TargetDashboardReport()
        {
            return View();
        }

        public IActionResult Index()
        {
            return View("TargetDashboardReport");
        }
    }
}
