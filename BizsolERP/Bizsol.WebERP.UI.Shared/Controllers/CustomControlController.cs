using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace Bizsol.WebERP.UI.Shared.Controllers
{
    public class CustomControlController : Controller
    {
        // GET: CustomControlController
        public ActionResult SizeControl(int ItemMaster_Code, int ItemSizeMaster_Code, string CallBackFunctionName_btnDone, string EditParameterList, string CallBackFunctionName_btnClose,int RowNo,int ProcessMaster_Code=0)
        {
            
            ViewBag.ItemMaster_Code = ItemMaster_Code;
            ViewBag.ItemSizeMaster_Code = ItemSizeMaster_Code;
            ViewBag.CallBackFunctionName_btnDone = CallBackFunctionName_btnDone;
            ViewBag.CallBackFunctionName_btnClose = CallBackFunctionName_btnClose;
            ViewBag.EditParameterList = EditParameterList;
            ViewBag.SizeControlRowNo = RowNo;
            ViewBag.ProcessMaster_Code = ProcessMaster_Code;
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
        public ActionResult BreakDownControl(string EntryDate, int ProcessMaster_Code, int MachineMaster_Code, int ShiftMaster_Code, int GodownMaster_Code = 0)
        {

            ViewBag.EntryDate = EntryDate;
            ViewBag.ProcessMaster_Code = ProcessMaster_Code;
            ViewBag.MachineMaster_Code = MachineMaster_Code;
            ViewBag.ShiftMaster_Code = ShiftMaster_Code;
            ViewBag.GodownMaster_Code = GodownMaster_Code;
            return PartialView("_BreakDownControl");

        }

    }
}
