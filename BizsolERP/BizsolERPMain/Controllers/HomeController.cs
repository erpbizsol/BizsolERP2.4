using BizsolERPMain.Models;
using Elfie.Serialization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System.Diagnostics;


namespace BizsolERPMain.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        
        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index(string AuthKey)
        {
            SetAuthKeySessionObjects(AuthKey);
            return View();
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

        private void SetAuthKeySessionObjects(string AuthKey)
        {
            AuthKey = "{\"ERPDBConStr\":\"Data Source=220.158.165.98,65446;Connection Timeout=0;Persist Security Info=true;Initial Catalog=BizSolERPDBBizDev;User ID=sa;pwd=biz1981;Packet Size=32000\",\"ERPMainDBConStr\":\"data source = 220.158.165.98,65446; initial catalog = BizSolERPMainDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000\",\"ERPDMSDBConStr\":\"data source = 220.158.165.98,65446; initial catalog = BizSolERPDMSDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000\",\"ERPDB_Name\":\"BizSolERPDBBizDev\",\"ERPMainDB_Name\":\"BizSolERPMainDB_BizDev\",\"ERPDMSDB_Name\":\"BizSolERPDMSDB_BizDev\",\"AuthToken\":\"xyz\",\"UserMaster_Code\":\"145\",\"CompanyCode\":\"104\",\"CrystalReportBaseUrl\":\"https://web.bizsol.in/CRReports/Reports/Report.aspx?\"}";

            AuthKeySession? AuthData = System.Text.Json.JsonSerializer.Deserialize<AuthKeySession>(AuthKey);

            HttpContext.Session.SetString("ConnString", AuthData.ERPDBConStr.ToString());
            HttpContext.Session.SetString("MainDBConnString", AuthData.ERPMainDBConStr.ToString());
            HttpContext.Session.SetString("DMSDBConnString", AuthData.ERPDMSDBConStr.ToString());
            HttpContext.Session.SetString("ERPDBName", AuthData.ERPDB_Name.ToString());
            HttpContext.Session.SetString("MainDBName", AuthData.ERPMainDB_Name.ToString());
            HttpContext.Session.SetString("DMSDBName", AuthData.ERPDMSDB_Name.ToString());
            HttpContext.Session.SetString("AuthToken", AuthData.AuthToken.ToString());
            HttpContext.Session.SetString("CompanyCode", AuthData.CompanyCode.ToString());
            HttpContext.Session.SetString("UserMaster_Code", AuthData.UserMaster_Code.ToString());
            HttpContext.Session.SetString("CrystalReportBaseUrl", AuthData.CrystalReportBaseUrl.ToString());

        }

    }
}
