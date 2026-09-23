using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Masters.Areas.MarketingMasters.Controllers
{
    [Area("MarketingMasters")]
    public class DealerTargetMasterController : Controller
    {
        public IActionResult DealerTargetMaster()
        {
            return View();
        }
    }
}
