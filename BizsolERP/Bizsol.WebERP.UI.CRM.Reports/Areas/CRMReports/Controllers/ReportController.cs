using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Reports.Areas.CRMReports.Controllers
{
    [Area("CRMReports")]
    public class ReportController : Controller
    {
        public IActionResult GetDailyVisitReport()
        {
            return View();
        }
        public IActionResult StockReport()
        {
            return View();
        }
        public IActionResult ExpenseEntryReport()
        {
            return View();
        }
        public IActionResult CheckInCheckOutReport()
        {
            return View();
        }
       

    }
}
