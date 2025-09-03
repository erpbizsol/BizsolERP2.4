using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class ExpenseEntryController : Controller
    {
        public IActionResult ExpenseEntryList()
        {
            return View();
        }

        public IActionResult ExpenseEntryDetail()
        {
            string Encrypt_Code = HttpContext.Request.Query["Code"].ToString();
            string Encrypt_Mode = HttpContext.Request.Query["Mode"].ToString();
            string Encrypt_MarketingMan_Name = HttpContext.Request.Query["MarketingMan_Name"].ToString();

            byte[] Codedata = Convert.FromBase64String(Encrypt_Code);
            string Code = System.Text.Encoding.UTF8.GetString(Codedata);

            byte[] Modedata = Convert.FromBase64String(Encrypt_Mode);
            string Mode = System.Text.Encoding.UTF8.GetString(Modedata);

            byte[] Namedata = Convert.FromBase64String(Encrypt_MarketingMan_Name);
            string MarketingMan_Name = System.Text.Encoding.UTF8.GetString(Namedata);

            ViewBag.ExpenseEntryMaster_Code = Code == "" ? 0 : Convert.ToInt32(Code);
            ViewBag.Mode = Mode == "" ? "New" : Mode;
            ViewBag.MarketingMan_Name = MarketingMan_Name == "" ? "" : MarketingMan_Name;

            return View();
        }
       public IActionResult ExpenseHeadMaster()
        {
            return View();
        }
    }
}
