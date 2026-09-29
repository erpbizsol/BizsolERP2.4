using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class UserRightDashboardController : Controller
    {
        public IActionResult UserRightDashboard()
        {
            return View();
        }
    }
}
