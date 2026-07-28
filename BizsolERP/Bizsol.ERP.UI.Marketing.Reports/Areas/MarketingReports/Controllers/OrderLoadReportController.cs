using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Reports.Areas.MarketingReports.Controllers
{
    [Area("MarketingReports")]
    public class OrderLoadReportController : Controller
    {
        public IActionResult OrderLoadReport()
        {
            return View();
        }
    }
}
