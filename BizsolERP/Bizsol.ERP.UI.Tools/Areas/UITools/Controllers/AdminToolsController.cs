using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Tools.Areas.UITools.Controllers
{
    [Area("UITools")]
    public class AdminToolsController : Controller
    {
        public IActionResult AdminTools()
        {
            return View();
        }
    }
}
