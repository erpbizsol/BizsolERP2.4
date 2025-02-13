using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Configuration.Areas.Configuration.Controllers
{
    [Area("Configuration")]
    public class FixedParameterQtyConfigController : Controller
    {
        public IActionResult FixedParameterQtyConfig()
        {
            return View();
        }
    }
}
