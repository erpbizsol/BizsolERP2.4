using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class AssetTypeMasterController : Controller
    {
        public IActionResult AssetTypeMaster()
        {
            return View();
        }

        public IActionResult AssetTypeMasterEntry()
        {
            return View();
        }
    }
}
