using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class RawMaterialController : Controller
    {
        public IActionResult RMOffer()
        {
            return View();
        }
        public IActionResult RMClearanceEntry()
        {
            return View();
        }
        public IActionResult MachineMaintenanceRequest()
        {
            return View();
        }
        public IActionResult FGOffer()
        {
            return View();
        }
        public IActionResult FGInspectedEntry()
        {
            return View();
        }
    }
}
