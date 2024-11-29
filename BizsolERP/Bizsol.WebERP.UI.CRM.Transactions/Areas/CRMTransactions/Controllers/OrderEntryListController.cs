using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    public class OrderEntryListController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
