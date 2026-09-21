using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Transactions.Areas.PurchaseTransactions.Controllers
{
    [Area("PurchaseTransactions")]
    [Route("[area]/[controller]/[action]")]
    public class IndentMasterController : Controller
    {
        public IActionResult IndentMaster()
        {
            return View();
        }
    }
}
