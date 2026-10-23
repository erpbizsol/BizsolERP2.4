using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class AssetGroupMasterController : Controller
    {
        public IActionResult AssetGroupMaster()
        {
            return View();
        }
    }
}
