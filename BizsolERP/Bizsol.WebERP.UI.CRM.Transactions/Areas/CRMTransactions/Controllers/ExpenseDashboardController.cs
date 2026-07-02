using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class ExpenseDashboardController : Controller
    {
        public IActionResult ExpenseDashboard()
        {
            return View();
        }
    }
}
