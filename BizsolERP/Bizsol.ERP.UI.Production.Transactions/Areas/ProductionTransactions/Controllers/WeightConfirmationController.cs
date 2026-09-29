using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Transactions.Areas.ProductionTransactions.Controllers
{
    [Area("ProductionTransactions")]
    public class WeightConfirmationController : Controller
    {
        public IActionResult WeightConfirmation()
        {
            return View();
        }
    }
}
