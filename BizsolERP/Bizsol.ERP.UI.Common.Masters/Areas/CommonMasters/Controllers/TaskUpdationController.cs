using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class TaskUpdationController : Controller
    {
        public IActionResult TaskUpdation()
        {
            return View();
        }
    }
}
