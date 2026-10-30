using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Reports.Areas.CRMReports.Controllers
{
    [Area("CRMReports")]
    public class SalesManagementDashboradController : Controller
    {
        public IActionResult SalesManagementDashborad()
        {
            return View();
        }
    }
}
