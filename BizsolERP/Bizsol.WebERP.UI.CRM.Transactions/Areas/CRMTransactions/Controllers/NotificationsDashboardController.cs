using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class NotificationsDashboardController : Controller
    {
        public IActionResult NotificationsDashboard()
        {
            return View();
        }
    }
}
