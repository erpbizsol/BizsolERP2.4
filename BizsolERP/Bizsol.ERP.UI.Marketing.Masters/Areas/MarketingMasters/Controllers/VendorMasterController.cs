using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Masters.Areas.MarketingMasters.Controllers
{
    [Area("MarketingMasters")]
    public class VendorMasterController : Controller
    {
        public IActionResult VendorMaster()
        {
            return View();
        }
        public IActionResult TransporterMaster()
        {
            return View();
        }
        public IActionResult Ledger()
        {
            return View();
        }
    }
}
