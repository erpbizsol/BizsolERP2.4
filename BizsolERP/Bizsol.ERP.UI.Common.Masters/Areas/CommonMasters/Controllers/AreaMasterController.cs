using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class AreaMasterController : Controller
    {
        public IActionResult AreaMaster()
        {
            return View();
        }
    }
}
