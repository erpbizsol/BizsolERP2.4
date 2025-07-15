using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Transactions.Areas.MarketingTransactions.Controllers
{
    [Area("MarketingTransactions")]
    public class CollectionCommitmentController : Controller
    {
        public IActionResult CollectionCommitment()
        {
            return View();
        }
    }
}