using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Transactions.Areas.MarketingTransactions.Controllers
{
    [Area("MarketingTransactions")]
    public class DealerTargetMasterController : Controller
    {
        public IActionResult DealerTargetMaster()
        {
            return View();
        }
    }
}
