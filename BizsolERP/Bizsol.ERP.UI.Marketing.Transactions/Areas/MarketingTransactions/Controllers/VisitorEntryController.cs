using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Transactions.Areas.MarketingTransactions.Controllers
{
    [Area("MarketingTransactions")]
    public class VisitorEntryController : Controller
    {
        public IActionResult VisitorEntry()
        {
            return View();
        }
    }
}
