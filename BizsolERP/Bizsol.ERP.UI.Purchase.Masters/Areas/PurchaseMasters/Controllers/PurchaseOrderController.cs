using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Purchase.Masters.Areas.PurchaseMasters.Controllers
{
    [Area("PurchaseMasters")]
    [Route("[area]/[controller]/[action]")]
    public class PurchaseOrderController : Controller
    {
        public IActionResult POApprovalConfiguration()
        {
            return View();
        }
    }
}
