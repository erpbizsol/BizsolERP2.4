using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Transactions.Areas.ProductionTransactions.Controllers
{
    [Area("ProductionMasters")]
    public class SlittingController : Controller
    {
        public IActionResult SlittingProductionEntry()
        {
            return View();
        }
    }
}
