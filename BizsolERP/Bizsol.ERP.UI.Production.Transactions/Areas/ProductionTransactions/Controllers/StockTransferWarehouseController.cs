using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Transactions.Areas.ProductionTransactions.Controllers
{
    [Area("ProductionTransactions")]
    public class StockTransferWarehouseController : Controller
    {
     
        public IActionResult GetWarehouse()
        {
            return View();
        }
        public IActionResult ActualDispatch()
        {
            return View();
        }
        public IActionResult PhysicalStockTaking()
        {
            return View();
        }
    }
}
