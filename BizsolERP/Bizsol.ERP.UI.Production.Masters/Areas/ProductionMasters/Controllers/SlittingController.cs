using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Masters.Areas.ProductionMasters.Controllers
{
    [Area("ProductionMasters")]
    public class SlittingController : Controller
    {
        public IActionResult SlittingProductionEntry()
        {
            return View();
        }
    }
}
