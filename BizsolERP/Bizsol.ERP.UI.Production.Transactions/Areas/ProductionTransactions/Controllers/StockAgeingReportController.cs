using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Transactions.Areas.ProductionTransactions.Controllers
{
    [Area("ProductionTransactions")]
    public class StockAgeingReportController : Controller
    {
        public IActionResult StockAgeingReport()
        {
            return View();
        }

        public IActionResult YieldConfiguration()
        {
            return View();
        }
    }
}
