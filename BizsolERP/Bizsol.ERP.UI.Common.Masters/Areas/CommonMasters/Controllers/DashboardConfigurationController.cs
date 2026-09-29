using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class DashboardConfigurationController : Controller
    {
        public IActionResult DashboardConfiguration()
        {
            return View();
        }
    }
}
