using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Masters.Areas.MarketingMasters.Controllers
{
    [Area("MarketingMasters")]
    public class ItemMasterController : Controller
    {
        public IActionResult ItemMaster()
        {
            return View();
        }
    }
}
