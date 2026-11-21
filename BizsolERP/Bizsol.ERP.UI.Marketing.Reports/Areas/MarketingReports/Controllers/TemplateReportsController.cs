using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Reports.Areas.MarketingReports.Controllers
{
    [Area("MarketingReports")]
    public class TemplateReportsController : Controller
    {
        public IActionResult TemplateReports()
        {
            return View();
        }
    }
}
