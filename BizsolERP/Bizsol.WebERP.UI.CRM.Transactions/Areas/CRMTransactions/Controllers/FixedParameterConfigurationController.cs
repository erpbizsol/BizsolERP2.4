using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class FixedParameterConfigurationController : Controller
    {
        public IActionResult FixedParameterConfiguration()
        {
            return View();
        }
    }
}
