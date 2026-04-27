using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class ReasonMasterController : Controller
    {
        public IActionResult ReasonMaster()
        {
            return View();
        }
    }
}
