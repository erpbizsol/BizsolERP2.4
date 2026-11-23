using Microsoft.AspNetCore.Mvc;

namespace Bizsol.ERP.UI.Finance.Reports.Areas.FinanceReports.Controllers
{
    [Area("FinanceReports")]
    public class DepreciationChartController : Controller
    {
        [HttpGet]
        public IActionResult DepreciationChart()
        {
            return View();
        }
    }
}
