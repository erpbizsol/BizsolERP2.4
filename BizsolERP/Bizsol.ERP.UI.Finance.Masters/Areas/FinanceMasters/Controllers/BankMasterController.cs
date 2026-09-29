using Microsoft.AspNetCore.Mvc;

namespace Bizsol.ERP.UI.Finance.Masters.Areas.FinanceMasters.Controllers
{
    [Area("FinanceMasters")]
    public class BankMasterController : Controller
    {
        public IActionResult BankMaster()
        {
            return View();
        }
    }
}
