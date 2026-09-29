using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Transactions.Areas.ProductionTransactions.Controllers
{
    [Area("ProductionTransactions")]
    public class ProductionOrderController : Controller
    {
        public IActionResult ProductionOrder()
        {
            return View();
        }
    }
}
