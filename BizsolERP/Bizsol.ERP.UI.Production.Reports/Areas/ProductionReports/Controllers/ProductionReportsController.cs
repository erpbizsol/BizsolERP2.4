using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Reports.Areas.ProductionReports.Controllers
{
    [Area("ProductionReports")]
    public class ProductionReportsController : Controller
    {
        public IActionResult MillWiseProductionReport()
        {
            return View();
        }
        public IActionResult ProductionReport()
        {
            return View();
        }
    }
}
