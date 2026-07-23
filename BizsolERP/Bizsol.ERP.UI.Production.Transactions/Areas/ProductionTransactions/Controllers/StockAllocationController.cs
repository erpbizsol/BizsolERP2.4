using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Transactions.Areas.ProductionTransactions.Controllers
{
    [Area("ProductionTransactions")]
    public class StockAllocationController : Controller
    {
        public IActionResult StockAllocation()
        {
            return View();
        }
    }
}
