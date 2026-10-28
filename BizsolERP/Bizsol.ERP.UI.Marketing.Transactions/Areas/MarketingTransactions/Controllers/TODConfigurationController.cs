using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Transactions.Areas.MarketingTransactions.Controllers
{
    [Area("MarketingTransactions")]
    public class TODConfigurationController : Controller
    {
        public IActionResult TODConfiguration()
        {
            return View();
        }
    }
}
