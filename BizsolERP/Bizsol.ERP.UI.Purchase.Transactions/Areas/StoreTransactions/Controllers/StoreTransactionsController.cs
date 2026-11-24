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

        public IActionResult AssetsMaster()
        {
            return View();
        }

        public IActionResult AssetValidation()
        {
            return View();
        }

        public IActionResult VoucherDepriciationConfiguration()
        {
            return View();
        }
    }
}
