using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Transactions.Areas.PurchaseTransactions.Controllers
{
    [Area("PurchaseTransactions")]
    public class GRNPaymentApprovalController : Controller
    {
        public IActionResult GRNPaymentApproval()
        {
            return View();
        }
    }
}
