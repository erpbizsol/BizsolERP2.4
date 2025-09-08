using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class CommonSingleEntryController : Controller
    {
        public IActionResult CommonSingleEntryForm()
        {
            return View();
        }
        
    }
}
