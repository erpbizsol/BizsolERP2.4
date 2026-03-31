using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Masters.Areas.MarketingMasters.Controllers
{
    [Area("MarketingMasters")]
    public class MarketingManMasterController : Controller
    {
        public IActionResult MarketingManMaster()
        {
            return View();
        }
    }
}
