using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Masters.Areas.ProductionMasters.Controllers
{
    [Area("ProductionMasters")]
    public class RollingController : Controller
    {
        public IActionResult RollingProductionEntry()
        {
            return View();
        }
        public IActionResult RollingProductionSummary()
        {
            return View();
        }
        public IActionResult CoilProductionPlan()
        {
            return View();
        }
    }
}
