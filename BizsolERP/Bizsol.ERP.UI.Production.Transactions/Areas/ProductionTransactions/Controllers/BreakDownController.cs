using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Transactions.Areas.ProductionTransactions.Controllers
{
    [Area("ProductionTransactions")]
    public class BreakDownController : Controller
    {
        public IActionResult BreakDown()
        {
            return View();
        }
    }
}