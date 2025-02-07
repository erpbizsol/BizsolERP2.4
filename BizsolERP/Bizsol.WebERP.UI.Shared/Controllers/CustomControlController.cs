using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace Bizsol.WebERP.UI.Shared.Controllers
{
    public class CustomControlController : Controller
    {
        // GET: CustomControlController
        public ActionResult SizeControl(int ItemMaster_Code, int ItemSizeMaster_Code, string CallBackFunctionName_btnDone, string EditParameterList, string CallBackFunctionName_btnClose,int RowNo)
        {
            
            ViewBag.ItemMaster_Code = ItemMaster_Code;
            ViewBag.ItemSizeMaster_Code = ItemSizeMaster_Code;
            ViewBag.CallBackFunctionName_btnDone = CallBackFunctionName_btnDone;
            ViewBag.CallBackFunctionName_btnClose = CallBackFunctionName_btnClose;
            ViewBag.EditParameterList = EditParameterList;
            ViewBag.SizeControlRowNo = RowNo;
            return PartialView("_SizeControl");
            
        }
        public ActionResult AttachmentControl(string MasterTableName, int MasterTableCode,string DetailTableName,int DetailTableCode,int EntryNo,string EntryDate, string Mode)
        {

            ViewBag.MasterTableName = MasterTableName;
            ViewBag.MasterTableCode = MasterTableCode;
            ViewBag.DetailTableName = DetailTableName;
            ViewBag.DetailTableCode = DetailTableCode;
            ViewBag.EntryNo = EntryNo;
            ViewBag.EntryDate = EntryDate;
            ViewBag.Mode = Mode;
            return PartialView("_AttachmentControl");

        }

    }
}
