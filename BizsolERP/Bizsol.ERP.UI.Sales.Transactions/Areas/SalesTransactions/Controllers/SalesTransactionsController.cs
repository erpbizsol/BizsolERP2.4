using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Sales.Transactions.Areas.SalesTransactions.Controllers
{
    [Area("SalesTransactions")]
    public class SalesTransactionsController : Controller
    {
        public IActionResult VerifyDispatchPlan()
        {
            return View();
        }
    }
}
