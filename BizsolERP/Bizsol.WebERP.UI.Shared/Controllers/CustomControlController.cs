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
        public ActionResult AttachmentControl(string MasterTableName, int MasterTableCode,string DetailTableName,int DetailTableCode,int EntryNo,string EntryDate, string Mode,string SourceDownloadFileName="")
        {

            ViewBag.MasterTableName = MasterTableName;
            ViewBag.MasterTableCode = MasterTableCode;
            ViewBag.DetailTableName = DetailTableName;
            ViewBag.DetailTableCode = DetailTableCode;
            ViewBag.EntryNo = EntryNo;
            ViewBag.EntryDate = EntryDate;
            ViewBag.Mode = Mode;
            ViewBag.SourceDownloadFileName = SourceDownloadFileName;
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
        public ActionResult CheckCreditLimits(int AccountMaster_Code
                                                           , float Amount
                                                           , float PreviousAmount
                                                           , string Source
                                                           , int PasswordsCodeRs
                                                           , int PasswordsCodeDays
                                                           , string ShowFormDialog
                                                           , float LedgerClosing
                                                           , float OverDueAmount
                                                           , string ShowOnlyOutstandingInfo
                                                           , int Log_OnLineVerification_Code
                                                           , string OnlyCheckCreditLimit
                                                           , string CheckBillingWithoutAdvance
                                                           , float AdvancePayPercentage
                                                           , string EntryDesp
                                                           , int MasterTableCode
                                                           , int BuyerPOMaster_Code
                                                           , string CallBackFunctionName_btnDone
                                                           , int Code
                                                           , string Mode)
        {

             ViewBag.AccountMaster_Code         =AccountMaster_Code;
             ViewBag.Amount                     =Amount;
             ViewBag.PreviousAmount             =PreviousAmount;
             ViewBag.Source                     =Source;
             ViewBag.PasswordsCodeRs            =PasswordsCodeRs;
             ViewBag.PasswordsCodeDays          =PasswordsCodeDays;
             ViewBag.ShowFormDialog             =ShowFormDialog;
             ViewBag.LedgerClosing              =LedgerClosing;
             ViewBag.OverDueAmount              =OverDueAmount;
             ViewBag.ShowOnlyOutstandingInfo    =ShowOnlyOutstandingInfo;
             ViewBag.Log_OnLineVerification_Code=Log_OnLineVerification_Code;
             ViewBag.OnlyCheckCreditLimit       =OnlyCheckCreditLimit;
             ViewBag.CheckBillingWithoutAdvance =CheckBillingWithoutAdvance;
             ViewBag.AdvancePayPercentage       =AdvancePayPercentage;
             ViewBag.EntryDesp                  =EntryDesp;
             ViewBag.MasterTableCode            =MasterTableCode;
             ViewBag.BuyerPOMaster_Code          = BuyerPOMaster_Code;
             ViewBag.CallBackFunctionName_btnDone = CallBackFunctionName_btnDone;
             ViewBag.Code = Code;
            ViewBag.Mode = Mode;
            return PartialView("_CheckCreditLimits");

        }

    }
}
