using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class UserDashboardMenuController : Controller
    {
        public IActionResult UserDashboardMenu()
        {
            return View();
        }
    }
}
