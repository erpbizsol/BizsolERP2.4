using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Masters.Areas.MarketingMasters.Controllers
{
    [Area("MarketingMasters")]
    public class DealerMasterController : Controller
    {
        public IActionResult DealerMaster()
        {
            string Encrypt_Code = HttpContext.Request.Query["Code"].ToString();
            string Encrypt_Mode = HttpContext.Request.Query["Mode"].ToString();
            string Encrypt_Distributor_Name = HttpContext.Request.Query["Distributor_Name"].ToString();
            string Encrypt_Distributor_Code = HttpContext.Request.Query["Distributor_Code"].ToString(); 

            byte[] Codedata = Convert.FromBase64String(Encrypt_Code);
            string Code = System.Text.Encoding.UTF8.GetString(Codedata);

            byte[] Modedata = Convert.FromBase64String(Encrypt_Mode);
            string Mode = System.Text.Encoding.UTF8.GetString(Modedata);

            byte[] Namedata = Convert.FromBase64String(Encrypt_Distributor_Name);
            string Distributor_Name = System.Text.Encoding.UTF8.GetString(Namedata);

            byte[] Distributor_Codedata = Convert.FromBase64String(Encrypt_Distributor_Code);
            string Distributor_Code = System.Text.Encoding.UTF8.GetString(Distributor_Codedata);

            ViewBag.DealerMaster_Code = Code == "" ? 0 : Convert.ToInt32(Code);
            ViewBag.Mode = Mode == "" ? "New" : Mode;
            ViewBag.Distributor_Name = Distributor_Name == "" ? "" : Distributor_Name;
            ViewBag.Distributor_Code = Distributor_Code == "" ? "0" : Distributor_Code;

            return View();
        }
        public IActionResult DealerMasterList()
        {
            return View();
        }
    }
}
