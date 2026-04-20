using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class GroupMasterController : Controller
    {
        public IActionResult GroupMaster()
        {
            return View();
        }
    }
}
