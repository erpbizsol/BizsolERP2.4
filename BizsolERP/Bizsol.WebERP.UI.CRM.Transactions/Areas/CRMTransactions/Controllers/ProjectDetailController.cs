using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class ProjectDetailController : Controller
    {
       
        public IActionResult ProjectDetailDashboard()
        {
            return View();
        }
    }
}
