using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class CityMasterController : Controller
    {
        public IActionResult CityMaster()
        {
            return View();
        }
    }
}
