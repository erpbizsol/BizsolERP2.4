using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Transactions.Areas.ProductionTransactions.Controllers
{
    [Area("ProductionTransactions")]
    public class PackingListController : Controller
    {
        public IActionResult PackingListFG()
        {
            return View();
        }
    }
}
