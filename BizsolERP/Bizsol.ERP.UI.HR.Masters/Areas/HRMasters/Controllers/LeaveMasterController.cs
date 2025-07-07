using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.HR.Masters.Areas.HRMasters.Controllers
{
    [Area("HRMasters")]
    public class LeaveMasterController : Controller
    {
        public IActionResult LeaveMaster()
        {
            return View();
        }
    }
}
