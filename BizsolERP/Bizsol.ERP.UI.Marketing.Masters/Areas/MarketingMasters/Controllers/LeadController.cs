using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Masters.Areas.MarketingMasters.Controllers
{
    [Area("MarketingMasters")]
    public class LeadController : Controller
    {
        public IActionResult LeadMaster()
        {
            return View();
        }
    }
}
