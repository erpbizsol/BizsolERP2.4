using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Sales.Reports.Areas.SalesReports.Controllers
{
    [Area("SalesReports")]
    public class ReportsController : Controller
    {
        public IActionResult BillWiseOutStandingReport()
        {
            return View();
        }
    }
}
