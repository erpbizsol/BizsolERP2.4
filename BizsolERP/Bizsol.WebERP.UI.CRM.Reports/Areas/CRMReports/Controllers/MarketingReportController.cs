using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Reports.Areas.CRMReports.Controllers
{
    [Area("CRMReports")]
    public class MarketingReportController : Controller
    {
        [HttpGet]
        public IActionResult CustomerDashboard()
        {
            return View();
        }
        
    }
}