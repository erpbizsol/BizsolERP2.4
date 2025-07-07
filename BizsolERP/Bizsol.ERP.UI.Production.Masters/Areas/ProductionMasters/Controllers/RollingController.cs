using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Production.Masters.Areas.ProductionMasters.Controllers
{
    [Area("ProductionMasters")]
    public class RollingController : Controller
    {
        public IActionResult RollingProductionEntry(string IsRunningPlan,int PVCProductionMaster_Code, string PlanDate,string MachineNo)
        {
            ViewBag.IsRunningPlan = IsRunningPlan;
            ViewBag.PVCProductionMaster_Code = PVCProductionMaster_Code;
            ViewBag.PlanDate = PlanDate;
            ViewBag.MachineNo = MachineNo;

            return View();
        }
        public IActionResult RollingProductionSummary()
        {
            return View();
        }
        public IActionResult CoilProductionPlan()
        {
            return View();
        }
    }
}
