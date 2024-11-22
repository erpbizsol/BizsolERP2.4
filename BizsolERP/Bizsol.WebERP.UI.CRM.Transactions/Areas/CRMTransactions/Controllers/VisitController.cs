using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class VisitController : Controller
    {
        public IActionResult VisitOrderEntry()
        {
            return View();
        }
    }
}
