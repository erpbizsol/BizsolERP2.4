using Microsoft.AspNetCore.Mvc;

namespace Bizsol.ERP.UI.Finance.Transactions.Areas.FinanceTransactions.Controllers
{
    [Area("FinanceTransactions")]
    public class BankStatementController : Controller
    {
        public IActionResult BankStatementList() => View();

        public IActionResult BankStatementImport() => View("BankStatementList");

        public IActionResult BankStatementUpload() => View("BankStatementImport");
    }
}
