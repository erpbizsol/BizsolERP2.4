using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Transactions.Areas.ProductionTransactions.Controllers
{
    [Area("ProductionTransactions")]
    public class PalletPackingController : Controller
    {
        public IActionResult GetPackedPalletDateAndOrderWise()
        {
            return View();
        }
    }
}
