using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class OrderEntryListController : Controller
    {
        public IActionResult OrderEntryList()
        {
            return View();
        }
    }
}
