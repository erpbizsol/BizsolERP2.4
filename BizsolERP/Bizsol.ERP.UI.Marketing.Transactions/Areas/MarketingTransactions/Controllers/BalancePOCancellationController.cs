using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Transactions.Areas.MarketingTransactions.Controllers
{
    [Area("MarketingTransactions")]
    public class BalancePOCancellationController : Controller
    {
        public IActionResult BalancePOCancellation()
        {
            return View();
        }
    }
}