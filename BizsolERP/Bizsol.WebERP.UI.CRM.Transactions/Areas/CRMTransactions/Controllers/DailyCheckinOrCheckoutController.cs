using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class DailyCheckinOrCheckoutController : Controller
    {
        public IActionResult CheckinOrCheckout()
        {
            return View();
        }
    }
}
