using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class CRMSalesReturnController : Controller
    {
        // GET: CRMTransactions/CRMSalesReturn/SalesReturn
        public IActionResult SalesReturn()
        {
            // View-only action that will render the SalesReturn view.
            return View();
        }

        
    }

}
