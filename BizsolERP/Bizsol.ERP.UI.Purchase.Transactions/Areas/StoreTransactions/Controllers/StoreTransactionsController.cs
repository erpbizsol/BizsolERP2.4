using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Transactions.Areas.StoreTransactions.Controllers
{
    [Area("StoreTransactions")]
    [Route("[area]/[controller]/[action]")]
    public class StoreTransactionsController : Controller
    {
        public IActionResult StoreRequisitionSlip()
        {
            return View();
        }
    }
}
