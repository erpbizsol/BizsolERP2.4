using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class CountryMasterController : Controller
    {
        public IActionResult CountryMaster()
        {
            return View();
        }
    }
}
