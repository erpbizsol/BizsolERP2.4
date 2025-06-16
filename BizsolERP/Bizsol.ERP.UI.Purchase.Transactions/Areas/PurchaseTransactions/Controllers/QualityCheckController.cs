using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Transactions.Areas.PurchaseTransactions.Controllers
{
    [Area("PurchaseTransactions")]
    [Route("[area]/[controller]/[action]")]
    public class QualityCheckController : Controller
    {
        public IActionResult QRQualityCheck()
        {
            return View();
        }
        
    }
}
