using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Transactions.Areas.PurchaseTransactions.Controllers.Project
{
    [Area("PurchaseTransactions")]
    public class ProjectController : Controller
    {
        public IActionResult ProjectMaster()
        {
            return View();
        }
        public IActionResult SubProjectMaster()
        {
            return View();
        }
    }
}
