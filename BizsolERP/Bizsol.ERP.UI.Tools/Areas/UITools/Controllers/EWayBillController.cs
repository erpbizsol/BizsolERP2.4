using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Tools.Areas.UITools.Controllers
{
    [Area("UITools")]
    public class EWayBillController : Controller
    {
        public IActionResult EwayBillClosure()
        {
            return View();
        }
    }
}
