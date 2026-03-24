using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Transactions.Areas.PurchaseTransactions.Controllers
{
    [Area("PurchaseTransactions")]
    public class GRNPaymentController : Controller
    {
        public IActionResult GRNPaymentApprovalConfiguration()
        {
            return View();
        }
    }
}
