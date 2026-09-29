using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class TaskListMasterController : Controller
    {
        public IActionResult TaskListMaster()
        {
            return View();
        }
    }
}
