using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Transactions.Areas.PurchaseTransactions.Controllers
{
    [Area("PurchaseTransactions")]
    public class GRNServiceController : Controller
    {
        public IActionResult GRNService()
        {
            return View();
        }
    }
}
