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

        public IActionResult MRNMasterApproval()
        {
            return View();
        }

        /** Alias for older links / menu URLs using GRNServiceApprovalConfiguration. */
        public IActionResult GRNServiceApprovalConfiguration()
        {
            return View("~/Areas/PurchaseTransactions/Views/GRNService/MRNServiceApprovalConfiguration.cshtml");
        }

        public IActionResult MRNServiceApprovalConfiguration()
        {
            return View("~/Areas/PurchaseTransactions/Views/GRNService/MRNServiceApprovalConfiguration.cshtml");
        }
    }
}
