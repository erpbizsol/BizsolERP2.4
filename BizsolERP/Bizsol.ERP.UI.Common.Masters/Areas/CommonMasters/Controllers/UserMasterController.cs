using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class UserMasterController : Controller
    {
        public IActionResult UserMaster()
        {
            return View();
        }
    }
}
