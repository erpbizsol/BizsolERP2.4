using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Test.Areas.ProductionTest.Controllers
{
    [Area("ProductionTest")]
    public class DemoCustomController : Controller
    {
        // GET: DemoCustomController
        public ActionResult DemoCustomControl()
        {
            return View();
        }
       
    }
}
