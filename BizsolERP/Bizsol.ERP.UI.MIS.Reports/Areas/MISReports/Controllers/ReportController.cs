using Microsoft.AspNetCore.Mvc;

namespace Bizsol.ERP.UI.MIS.Reports.Areas.MISReports.Controllers
{
    [Area("MISReports")]
    public class ReportController : Controller
    {
        public IActionResult DayWiseMISReport()
        {
            return View();
        }
    }
}
