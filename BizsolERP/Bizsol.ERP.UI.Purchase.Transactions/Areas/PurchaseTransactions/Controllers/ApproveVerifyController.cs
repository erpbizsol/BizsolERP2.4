using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Transactions.Areas.PurchaseTransactions.Controllers
{
    [Area("PurchaseTransactions")]
    public class ApproveVerifyController : Controller
    {
        public IActionResult POApproval()
        {
            return View();
        }
        public IActionResult ServicePOApproval()
        {
            return View();
        }
        public IActionResult SaleOrderApproval()
        {
            return View();
        }
        public IActionResult QuotationApproval()
        {
            return View();
        }
      
    }
}
