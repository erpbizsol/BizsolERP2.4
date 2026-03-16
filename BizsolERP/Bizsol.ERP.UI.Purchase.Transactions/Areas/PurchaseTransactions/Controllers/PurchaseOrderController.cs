using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Transactions.Areas.PurchaseTransactions.Controllers
{
    [Area("PurchaseTransactions")]
    [Route("[area]/[controller]/[action]")]
    public class PurchaseOrderController : Controller
    {
        public IActionResult PurchaseOrderStore()
        {
            return View();
        }

        public IActionResult POLevelsApprove()
        {
            return View();
        }
    }
}
