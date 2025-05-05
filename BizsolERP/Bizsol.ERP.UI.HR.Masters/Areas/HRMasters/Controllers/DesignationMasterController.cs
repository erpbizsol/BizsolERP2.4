using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.HR.Masters.Areas.HRMasters
{
    [Area("HRMasters")]
    public class DesignationMasterController : Controller
    {
        public IActionResult DesignationMaster()
        {
            return View();
        }
    }
}
