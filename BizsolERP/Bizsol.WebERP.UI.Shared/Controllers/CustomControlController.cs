using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Shared.Controllers
{
    public class CustomControlController : Controller
    {
        // GET: CustomControlController
        public ActionResult SizeControl(int ItemMaster_Code, int ItemSizeMaster_Code, string CallBackFunctionName_btnDone, string EditParameterList, string CallBackFunctionName_btnClose)
        {
            
            ViewBag.ItemMaster_Code = ItemMaster_Code;
            ViewBag.ItemSizeMaster_Code = ItemSizeMaster_Code;
            ViewBag.CallBackFunctionName_btnDone = CallBackFunctionName_btnDone;
            ViewBag.CallBackFunctionName_btnClose = CallBackFunctionName_btnClose;
            ViewBag.EditParameterList = EditParameterList;
            return PartialView("_SizeControl");
            
        }
        public ActionResult AttachmentControl(int ItemMaster_Code, int ItemSizeMaster_Code, string CallBackFunctionName_btnDone, string EditParameterList, string CallBackFunctionName_btnClose)
        {

            ViewBag.ItemMaster_Code = ItemMaster_Code;
            ViewBag.ItemSizeMaster_Code = ItemSizeMaster_Code;
            ViewBag.CallBackFunctionName_btnDone = CallBackFunctionName_btnDone;
            ViewBag.CallBackFunctionName_btnClose = CallBackFunctionName_btnClose;
            ViewBag.EditParameterList = EditParameterList;
            return PartialView("_AttachmentControl");

        }

    }
}
