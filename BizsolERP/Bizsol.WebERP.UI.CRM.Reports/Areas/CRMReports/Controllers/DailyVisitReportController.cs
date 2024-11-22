using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Reports.Areas.CRMReports.Controllers
{
    [Area("CRMReports")]
    public class DailyVisitReportController : Controller
    {
        public IActionResult GetDailyVisitReport()
        {
            return View();
        }
    }
}
