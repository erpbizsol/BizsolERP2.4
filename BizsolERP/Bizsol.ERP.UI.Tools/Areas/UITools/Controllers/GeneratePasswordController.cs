using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Tools.Areas.UITools.Controllers
{
    [Area("UITools")]
    public class GeneratePasswordController : Controller
    {
        public IActionResult GeneratePassword()
        {
            return View();
        }
    }
}
