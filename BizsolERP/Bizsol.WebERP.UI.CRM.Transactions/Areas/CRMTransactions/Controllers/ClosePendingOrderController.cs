using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class ClosePendingOrderController : Controller
    {
        public IActionResult ClosePendingOrder()
        {
            return View();
        }
    }
}
