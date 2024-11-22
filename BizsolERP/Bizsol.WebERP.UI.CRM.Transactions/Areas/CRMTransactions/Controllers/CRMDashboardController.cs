using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class CRMDashboardController : Controller
    {
       
        public IActionResult CRMDashboard()
        {
            return View();
        }
    }

}
