using Microsoft.AspNetCore.Mvc;

namespace Bizsol.ERP.UI.Sales.Test.Areas.SalesTest.Controllers
{
    [Area("SalesTest")]
    public class TestThemeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult TestDashboard()
        {
            return View();
        }

        public IActionResult AddNewPo()
        {
            return View();
        }

        public IActionResult ThemeGallery()
        {
            return View();
        }
    }
}
