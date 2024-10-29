using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.HR.Masters.Areas.HRMasters.Controllers
{
    [Area("HRMasters")]
    public class EmployeeMasterController : Controller
    {
        public IActionResult EmployeeMaster()
        {
            return View();
        }
        public IActionResult EmployeeConfiguration()
        {
            return View();
        }
    }
}
