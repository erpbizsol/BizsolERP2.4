using Microsoft.AspNetCore.Mvc;

namespace Bizsol.ERP.UI.Finance.Reports.Areas.FinanceReports.Controllers
{
    [Area("FinanceReports")]
    public class BankBookController : Controller
    {
        [HttpGet]
        public IActionResult BankBookReport()
        {
            return View();
        }
    }
}
