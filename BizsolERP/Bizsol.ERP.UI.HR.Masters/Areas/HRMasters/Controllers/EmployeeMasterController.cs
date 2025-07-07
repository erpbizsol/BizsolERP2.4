using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.HR.Masters.Areas.HRMasters.Controllers
{
    [Area("HRMasters")]
    public class EmployeeMasterController : Controller
    {
        public IActionResult EmployeeMaster()
        {
            string Encrypt_Emp_Code = HttpContext.Request.Query["Code"].ToString();
            string Emp_Mode = HttpContext.Request.Query["Mode"].ToString();

            byte[] EmpMaster_Codedata = Convert.FromBase64String(Encrypt_Emp_Code);
            string Emp_Code = System.Text.Encoding.UTF8.GetString(EmpMaster_Codedata);

            ViewBag.Emp_Code = Emp_Code == "" ? 0 : Convert.ToInt32(Emp_Code);
            ViewBag.Emp_Mode = Emp_Mode == "" ? "New" : Emp_Mode;

            return View();
        }
        public IActionResult EmployeeConfiguration()
        {
            return View();
        }
        public IActionResult EmployeeList()
        {
            return View();
        }
    }
}
