using Microsoft.AspNetCore.Mvc;
using NuGet.Common;
using System.Data;
using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text.Json;

namespace Bizsol.WebERP.UI.Production.Transactions.Areas.ProductionTransactions.Controllers
{
    [Area("ProductionTransactions")]
    public class RollingPlanSheetController : Controller
    {
        public IActionResult RollingPlanSheet()
        {
            return View();
        }
        public IActionResult TestView()
        {
            return View();
        }
        public IActionResult Test()
        {
            return View();
        }
        [HttpGet]
        public IActionResult Verified()
        {
            return View();
        }
        
    }
}
