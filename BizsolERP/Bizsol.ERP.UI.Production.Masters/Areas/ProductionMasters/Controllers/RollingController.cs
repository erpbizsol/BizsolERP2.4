using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Transactions.Areas.ProductionTransactions.Controllers
{
    [Area("ProductionMasters")]
    public class RollingController : Controller
    {
        public IActionResult RollingProductionEntry()
        {
            return View();
        }
        public IActionResult RollingProductionSummary()
        {
            return View();
        }
    }
}
