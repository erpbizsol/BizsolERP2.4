using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Transactions.Areas.MarketingTransactions.Controllers
{
    [Area("MarketingTransactions")]
    public class MRNUpdationController : Controller
    {
        public IActionResult MRNUpdation()
        {
            return View();
        }
    }
}
