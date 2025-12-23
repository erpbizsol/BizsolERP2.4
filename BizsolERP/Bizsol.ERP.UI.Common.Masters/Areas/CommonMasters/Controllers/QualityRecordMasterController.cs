using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Common.Masters.Areas.CommonMasters.Controllers
{
    [Area("CommonMasters")]
    public class QualityRecordMasterController : Controller
    {
        public IActionResult QCPropertyGroupMaster()
        {
            return View();
        }
        public IActionResult QCPropertyMaster()
        {
            return View();
        }
        public IActionResult QCPropertyItemConfiguration()
        {
            return View();
        }
        public IActionResult QCPropertyTestTypeMaster()
        {
            return View();
        }
        public IActionResult PurchaseQualityCheck()
        {
            return View();
        }
    }
}
