using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Tools.Areas.UITools.Controllers
{
    [Area("UITools")]
    public class ImportController : Controller
    {
        public IActionResult Import()
        {
            return View();
        }
    }
}
