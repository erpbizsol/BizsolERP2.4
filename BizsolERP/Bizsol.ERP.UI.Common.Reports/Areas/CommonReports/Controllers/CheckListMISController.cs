using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Reports.Areas.CommonReports.Controllers
{
    [Area("CommonReports")]
    public class CheckListMISController : Controller
    {
        public IActionResult CheckListMIS()
        {
            return View();
        }
    }
}
