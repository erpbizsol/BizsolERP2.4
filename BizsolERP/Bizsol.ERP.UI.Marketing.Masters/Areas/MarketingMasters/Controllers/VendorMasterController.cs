using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace Bizsol.WebERP.UI.Marketing.Masters.Areas.MarketingMasters.Controllers
{
    [Area("MarketingMasters")]
    public class VendorMasterController : Controller
    {
        private static readonly HttpClient GstHttpClient = new();

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
