using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class SubCategoryMasterController : Controller
    {
        public IActionResult SubCategoryMaster()
        {
            return View();
        }
    }
}
