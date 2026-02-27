using Microsoft.AspNetCore.Mvc;

namespace Bizsol.ERP.UI.Finance.Reports.Areas.FinanceReports.Controllers
{
    [Area("FinanceReports")]
    public class LedgerController : Controller
    {
        [HttpGet]
        public IActionResult LedgerNew()
        {
            return View();
        }
    }
}
