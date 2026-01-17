using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class RowMaterialController : Controller
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
    }
}
