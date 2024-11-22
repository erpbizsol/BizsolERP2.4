using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class RoutePlanController : Controller
    {
        public IActionResult RoutePlanMaster()
        {
            return View();
        }
        public IActionResult RoutePlanVerify()
        {
            return View();
        }
    }
}
