using BizsolERPMain.Models;
using Elfie.Serialization;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System.Diagnostics;



namespace BizsolERPMain.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IConfiguration _configuration;
        public HomeController(ILogger<HomeController> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public IActionResult Index(string AuthKey)
        {
          // AuthKey = "{\"ERPDBConStr\":\"Data Source=192.168.1.208;Connection Timeout=0;Persist Security Info=true;Initial Catalog=BizSolERPDBPolytex_Temp;User ID=sa;pwd=biz@polytex;Packet Size=32000\",\"ERPMainDBConStr\":\"data source = 192.168.1.208; initial catalog = BizSolERPMainDB_Polytex; uid = sa; PWD = biz@polytex; Max Pool Size = 5000\",\"ERPDMSDBConStr\":\"data source = 192.168.1.208; initial catalog = BizSolERPDMSDB_Polytex; uid = sa; PWD = biz@polytex; Max Pool Size = 5000\",\"ERPDB_Name\":\"BizSolERPDBPolytex_Temp\",\"ERPMainDB_Name\":\"BizSolERPMainDB_Polytex\",\"ERPDMSDB_Name\":\"BizSolERPDMSDB_Polytex\",\"AuthToken\":\"xyz\",\"UserMaster_Code\":\"115\",\"CompanyCode\":\"100\",\"CrystalReportBaseUrl\":\"https://web.bizsol.in/CRReports/Reports/Report.aspx?\"}";
           //AuthKey = "{\"ERPDBConStr\":\"Data Source=220.158.165.98,65446;Connection Timeout=0;Persist Security Info=true;Initial Catalog=BizSolERPDBBizDev;User ID=sa;pwd=biz1981;Packet Size=32000\",\"ERPMainDBConStr\":\"data source = 220.158.165.98,65446; initial catalog = BizSolERPMainDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000\",\"ERPDMSDBConStr\":\"data source = 220.158.165.98,65446; initial catalog = BizSolERPDMSDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000\",\"ERPDB_Name\":\"BizSolERPDBBizDev\",\"ERPMainDB_Name\":\"BizSolERPMainDB_BizDev\",\"ERPDMSDB_Name\":\"BizSolERPDMSDB_BizDev\",\"AuthToken\":\"xyz\",\"UserMaster_Code\":\"145\",\"CompanyCode\":\"104\",\"CrystalReportBaseUrl\":\"https://web.bizsol.in/CRReports/Reports/Report.aspx?\"}";
            //AuthKey = "{\"ERPDBConStr\":\"Data Source=103.47.151.151,65446;Connection Timeout=0;Persist Security Info=true;Initial Catalog=BizSolERPDBHariomMain_Test;User ID=sa;pwd=hariom@biz@1981;Packet Size=32000\",\"ERPMainDBConStr\":\"data source = 103.47.151.151,65446; initial catalog = BizsolERPMainDB_Hariom; uid = sa; PWD = hariom@biz@1981; Max Pool Size = 5000\",\"ERPDMSDBConStr\":\"data source = 103.47.151.151,65446; initial catalog = BizsolERPDMSDB_Hariom; uid = sa; PWD = hariom@biz@1981; Max Pool Size = 5000\",\"ERPDB_Name\":\"BizSolERPDBHariomMain_Test\",\"ERPMainDB_Name\":\"BizsolERPMainDB_Hariom\",\"ERPDMSDB_Name\":\"BizSolERPDMSDB_BizDev\",\"AuthToken\":\"xyz\",\"UserMaster_Code\":\"261\",\"CompanyCode\":\"24\",\"CrystalReportBaseUrl\":\"https://web.bizsol.in/CRReports/Reports/Report.aspx?\"}";
            //AuthKey = "{\"ERPDBConStr\":\"Data Source=220.158.165.98,65446;Connection Timeout=0;Persist Security Info=true;Initial Catalog=BizSolERPDBINFRAMAT_Temp;User ID=sa;pwd=biz1981;Packet Size=32000\",\"ERPMainDBConStr\":\"data source = 220.158.165.98,65446; initial catalog = BizSolERPMainDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000\",\"ERPDMSDBConStr\":\"data source = 220.158.165.98,65446; initial catalog = BizSolERPDMSDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000\",\"ERPDB_Name\":\"BizSolERPDBINFRAMAT_Temp\",\"ERPMainDB_Name\":\"BizSolERPMainDB_BizDev\",\"ERPDMSDB_Name\":\"BizSolERPDMSDB_BizDev\",\"AuthToken\":\"xyz\",\"UserMaster_Code\":\"145\",\"CompanyCode\":\"102\",\"CrystalReportBaseUrl\":\"https://web.bizsol.in/CRReports/Reports/Report.aspx?\"}";
            //AuthKey = "{\"ERPDBConStr\":\"Data Source=103.47.151.151,65446;Connection Timeout=0;Persist Security Info=true;Initial Catalog=BizSolERPDBHariomMain_Temp;User ID=sa;pwd=hariom@biz@1981;Packet Size=32000\",\"ERPMainDBConStr\":\"data source = 103.47.151.151,65446; initial catalog = BizsolERPMainDB_Hariom; uid = sa; PWD = hariom@biz@1981; Max Pool Size = 5000\",\"ERPDMSDBConStr\":\"data source = 103.47.151.151,65446; initial catalog = BizsolERPDMSDB_Hariom; uid = sa; PWD = hariom@biz@1981; Max Pool Size = 5000\",\"ERPDB_Name\":\"BizSolERPDBHariomMain_Temp\",\"ERPMainDB_Name\":\"BizsolERPMainDB_Hariom\",\"ERPDMSDB_Name\":\"BizSolERPDMSDB_BizDev\",\"AuthToken\":\"xyz\",\"UserMaster_Code\":\"261\",\"CompanyCode\":\"24\",\"CrystalReportBaseUrl\":\"https://web.bizsol.in/CRReports/Reports/Report.aspx?\"}";

            ViewBag.AppBaseURL = _configuration["AppBaseURL"];
            ViewBag.AuthKey = AuthKey;
           
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

    }
}
