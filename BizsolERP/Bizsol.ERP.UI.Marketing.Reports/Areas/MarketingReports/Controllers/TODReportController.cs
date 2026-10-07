using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Reports.Areas.MarketingReports.Controllers
{
    [Area("MarketingReports")]
    public class TODReportController : Controller
    {
        public IActionResult TODReport()
        {
            return View();
        }
    }
}
