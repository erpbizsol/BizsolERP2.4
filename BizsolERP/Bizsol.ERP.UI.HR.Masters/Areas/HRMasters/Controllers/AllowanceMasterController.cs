using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.HR.Masters.Areas.HRMasters.Controllers
{
    [Area("HRMasters")]
    public class AllowanceMasterController : Controller
    {
        public IActionResult AllowanceMaster()
        {
            return View();
        }
    }
}