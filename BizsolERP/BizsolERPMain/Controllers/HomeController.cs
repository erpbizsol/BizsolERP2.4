using BizsolERPMain.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace BizsolERPMain.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;/////asas
        }

        public IActionResult Index()
        {
            return View();/// mamisjsjklaisks sajssisj 
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
