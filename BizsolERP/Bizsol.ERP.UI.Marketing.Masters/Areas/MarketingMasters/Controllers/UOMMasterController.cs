using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Masters.Areas.MarketingMasters.Controllers
{
    [Area("MarketingMasters")]
    public class UOMMasterController : Controller
    {
        public IActionResult UOMMaster()
        {
            return View();
        }
    }
}
