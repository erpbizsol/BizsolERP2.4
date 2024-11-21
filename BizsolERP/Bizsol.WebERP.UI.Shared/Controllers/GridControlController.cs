using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Shared.Controllers
{
    public class GridControlController : Controller
    {
        public ActionResult GridRowEditControl(int GridRowCode, string GridHeader,string[][] ArrayControls,  string callBackFunctionName)
        {
            ViewBag.RowCode = GridRowCode;
            ViewBag.CallBackFunctionName = callBackFunctionName;
            ViewBag.GridHeader = GridHeader;
            ViewBag.ArrayControls = ArrayControls;

            return PartialView("_GridRowEditControl");
        }
    }
}
