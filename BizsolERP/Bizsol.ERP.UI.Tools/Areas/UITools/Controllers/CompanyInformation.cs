using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Tools.Areas.UITools.Controllers
{
    [Area("UITools")]
    public class CompanyInformationController : Controller
    {
        public IActionResult CompanyInformation()
        {
            return View();
        }
    }
}

