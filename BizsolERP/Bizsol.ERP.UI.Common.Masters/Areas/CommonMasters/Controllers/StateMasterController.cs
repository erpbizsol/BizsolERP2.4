using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class StateMasterController : Controller
    {
        public IActionResult StateMaster()
        {
            return View();
        }
        public IActionResult StateList()
        {
            return View();
        }
    }
}
