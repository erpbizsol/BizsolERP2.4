using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Reports.Areas.MarketingReports.Controllers
{
    [Area("MarketingReports")]
    public class DealerTargetReportController : Controller
    {
        public IActionResult DealerTargetReport()
        {
            return View();
        }
    }
}
