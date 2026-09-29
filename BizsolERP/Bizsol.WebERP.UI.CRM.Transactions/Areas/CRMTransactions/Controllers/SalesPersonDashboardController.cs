using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class SalesPersonDashboardController : Controller
    {
        public IActionResult SalesPersonDashboard()
        {
            return View();
        }
    }
}
