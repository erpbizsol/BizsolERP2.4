using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.HR.Masters.Areas.HRMasters.Controllers
{
    [Area("HRMasters")]
    public class DepartmentController : Controller
    {
        public IActionResult Department()
        {
            return View();
        }
        public IActionResult Sub_Department()
        {
            return View();
        }
    }
}
