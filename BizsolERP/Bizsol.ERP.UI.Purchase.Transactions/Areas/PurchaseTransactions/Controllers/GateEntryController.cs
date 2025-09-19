using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Transactions.Areas.PurchaseTransactions.Controllers
{
    [Area("PurchaseTransactions")]
    [Route("[area]/[controller]/[action]")]
    public class GateEntryController : Controller
    {
        public IActionResult GateEntryView()
        {
            return View();
        }
        public IActionResult TransitMaterial()
        {
            return View();
        }
        public IActionResult VehicleStatus()
        {
            return View();
        }
        public IActionResult GateToken()
        {
            return View();
        }
    }
}
