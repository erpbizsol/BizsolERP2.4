using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Transactions.Areas.MarketingTransactions.Controllers
{
    [Area("MarketingTransactions")]
    public class BOMController : Controller
    {
        public IActionResult BOM()
        {
            return View();
        }
    }
}
