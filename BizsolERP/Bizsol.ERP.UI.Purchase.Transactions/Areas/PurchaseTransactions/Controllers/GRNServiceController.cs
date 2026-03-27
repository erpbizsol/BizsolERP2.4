using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Transactions.Areas.PurchaseTransactions.Controllers
{
    [Area("PurchaseTransactions")]
    [Route("[area]/[controller]/[action]")]
    public class GRNServiceController : Controller
    {
        public IActionResult GRNService()
        {
            return View();
        }

        public IActionResult GRNPaymentApproval()
        {
            return View();
        }
    }
}
