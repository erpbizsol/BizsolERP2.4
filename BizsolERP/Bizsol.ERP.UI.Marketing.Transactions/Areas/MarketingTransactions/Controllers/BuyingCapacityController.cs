using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Transactions.Areas.MarketingTransactions.Controllers
{
    [Area("MarketingTransactions")]
    public class BuyingCapacityController : Controller
    {
        public IActionResult BuyingCapacity()
        {
            return View();
        }
        public IActionResult ProspectiveCustomer()
        {
            return View();
        }
    }
}