using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class MaintenanceTypeMasterController : Controller
    {
        public IActionResult MaintenanceTypeMaster()
        {
            return View();
        }
    }
}
