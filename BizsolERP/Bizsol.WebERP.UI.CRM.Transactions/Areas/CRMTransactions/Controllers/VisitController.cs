using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class VisitController : Controller
    {
        public IActionResult VisitOrderEntry()
        {
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
        [HttpGet]
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
