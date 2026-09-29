using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class CategoryMasterController : Controller
    {
        public IActionResult CategoryMaster()
        {
            return View();
        }
    }
}
