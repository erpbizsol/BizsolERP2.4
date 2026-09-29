using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Transactions.Areas.MarketingTransactions.Controllers
{
    [Area("MarketingTransactions")]
    public class TargetExecutiveWiseController : Controller
    {
        public IActionResult TargetExecutiveWise()
        {
            return View();
        }
    }
}
