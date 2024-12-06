using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class VisitController : Controller
    {
        public IActionResult VisitOrderEntry()
        {
            string Encrypt_RoutePlanCode = HttpContext.Request.Query["RoutePlanCode"].ToString();
            string Encrypt_VisitMaster_Code = HttpContext.Request.Query["VisitMaster_Code"].ToString();
            string VisitMode = HttpContext.Request.Query["VisitMode"].ToString();

            byte[] RoutePlanCodedata = Convert.FromBase64String(Encrypt_RoutePlanCode);
            string RoutePlanCode = System.Text.Encoding.UTF8.GetString(RoutePlanCodedata);

            byte[] VisitMaster_Codedata = Convert.FromBase64String(Encrypt_VisitMaster_Code);
            string VisitMaster_Code = System.Text.Encoding.UTF8.GetString(VisitMaster_Codedata);

            ViewBag.RoutePlanCode = RoutePlanCode==""?0 : Convert.ToInt32(RoutePlanCode);
            ViewBag.VisitMaster_Code = VisitMaster_Code == "" ? 0 : Convert.ToInt32(VisitMaster_Code);
            ViewBag.VisitMode = VisitMode ==""?  "New":VisitMode;

            return View();
        }
        
        public IActionResult Visit()
        {
            return View();
        }
        public IActionResult VerifyOrder()
        {
            return View();
        }
        //[HttpGet]
        [HttpPost]
        [Route("GetLocation")]
        public async Task<IActionResult> GetLocation([FromQuery] string latlng)
        {
            var googleApiKey = "AIzaSyDFJGPvni-6MUITB8MxeHUMI4JfJjP5VJ4";
            var googleApiUrl = $"https://maps.googleapis.com/maps/api/geocode/json?latlng={latlng}&key={googleApiKey}";
            using var httpClient = new HttpClient();
            var response = await httpClient.GetAsync(googleApiUrl);
            var content = await response.Content.ReadAsStringAsync();
            return Content(content, "application/json");
        }
    }
}
