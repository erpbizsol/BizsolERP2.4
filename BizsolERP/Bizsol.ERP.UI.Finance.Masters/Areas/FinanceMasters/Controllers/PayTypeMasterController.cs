using Microsoft.AspNetCore.Mvc;

namespace Bizsol.ERP.UI.Finance.Masters.Areas.FinanceMasters.Controllers
{
    [Area("FinanceMasters")]
    public class PayTypeMasterController : Controller
    {
        public IActionResult PayTypeMaster()
        {
            return View();
        }
    }
}
