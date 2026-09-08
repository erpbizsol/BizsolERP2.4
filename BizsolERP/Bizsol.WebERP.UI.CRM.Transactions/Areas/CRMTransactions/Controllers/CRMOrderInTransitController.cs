using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class CRMOrderInTransitController : Controller
    {
        public IActionResult CRMOrderInTransit()
        {
            return View();
        }
    }
}
