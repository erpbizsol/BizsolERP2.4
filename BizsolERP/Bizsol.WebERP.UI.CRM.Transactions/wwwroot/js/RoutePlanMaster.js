import { RoutePlanMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/RoutePlanService.js';

const TblIndx = {
    VisitType: 0,
    AccountDesp: 1,
    CityName: 2,
    StateName: 3,
    Description: 4,
    RoutePlanStatus: 5,
    DeleteButton: 6,
    Code: 7
}

$(document).ready(function () {
    //$('#tblRoutePlan').DataTable();
    $("#ERPHeading").text("Route Plan");

    GetNestedDealerList();
    RoutePlanVistTypeDropDownList();
    GetStateList('India');
    GetCityList('India','All');
    GetRoutePlanDates();
    //AddNewRow();
     $('#btnSearch').on('click', function() {
         var dtPlanDate=$('#txtdate').val();
                
                var Valid = true;
                if (typeof $('#txtdate').val() === 'undefined' || $('#txtdate').val() === '' || $('#txtdate').val() === null) {
                    
                    $('#txtdate').focus();
                    Valid = false;
                }else{
                    GetRoutePlanListByPlanDate(dtPlanDate);
                }
     });
    var dtPlanDate = $('#txtdate').val();

   
    if (typeof $('#txtdate').val() === 'undefined' || $('#txtdate').val() === '' || $('#txtdate').val() === null) {

        $('#txtdate').focus();
       
    } else {
        GetRoutePlanListByPlanDate(dtPlanDate);
    }

 });

 document.addEventListener("DOMContentLoaded", function() {
        const today = new Date().toISOString().split("T")[0];
        document.getElementById("txtdate").value = today;
    });

 function GetNestedDealerList() {
    RoutePlanMasterService.GetNestedDealerList().then(function (response) {
      
       if (response.length > 0) {
                    $('#listdealer option').empty();
                        var option = '';
                        for (var i = 0; i < response.length; i++) {
                          
                            option += '<option text="' + response[i].Code + '">' + response[i].AccountDesp + '</option>'
                        }
                        $('#listdealer')[0].innerHTML = option;
                        
                }
                else{
                     $('#ErrorMsg').removeClass('invisible');
                     $('#ErrorMsg').addClass('visible');
                    return false;
                }
      
    });
}

 function GetRoutePlanListByPlanDate(dtPlanDate) {
    RoutePlanMasterService.GetRoutePlanListByPlanDate(dtPlanDate).then(function (response) {
        /*const StringFilterColumn = ["VisitType", "AccountDesp","CityName","StateName","Description"];
        const NumericFilterColumn = [];
        const DateFilterColumn = [];
        const Button = true;
        const showButtons=["E","D","VE"]
        const StringdoubleFilterColumn = [];
        const hiddenColumns = ["Code","IsVerify","Date"];
        BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", response, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns)
        */
        PopulateTable(response);
    });
}

function RoutePlanVistTypeDropDownList(){
    RoutePlanMasterService.RoutePlanVistTypeDropDownList().then(function (response) {
      
            if (response.length > 0) {
                    $('#listVisitType option').empty();
                        var option = '';
                        for (var i = 0; i < response.length; i++) {
                            
                            option += '<option text="' + response[i].Code + '">' + response[i].Desp + '</option>'
                        }
                        $('#listVisitType')[0].innerHTML = option;
                        
                }else if (typeof response.Msg === 'undefined') {
                    $('#listVisitType option').empty();
                 } else {
                    $('#listVisitType option').empty();
                    }
                
      
    });
}
 function GetStateList(CountryName) {
    RoutePlanMasterService.GetStateList(CountryName).then(function (response) {
      
       if (response.length > 0) {
                    $('#listState option').empty();
                        var option = '';
                        for (var i = 0; i < response.length; i++) {
                          
                            option += '<option text="' + response[i].Code + '">' + response[i].StateName + '</option>'
                        }
                        $('#listState')[0].innerHTML = option;
                        
                }
      
    });
}

 function GetCityList(CountryName,StateName) {
    RoutePlanMasterService.GetCityList(CountryName,StateName).then(function (response) {
      
       if (response.length > 0) {
                    $('#listCity option').empty();
                        var option = '';
                        for (var i = 0; i < response.length; i++) {
                          
                            option += '<option text="' + response[i].Code + '">' + response[i].CityName + '</option>'
                        }
                        $('#listCity')[0].innerHTML = option;
                        
                }
      
    });
}

function GetCityDetailsByName(x) {
    var ObjCurrRow = $(x).closest('tr');
    var Mode = 'CityMasterByName';
    var CityName = ObjCurrRow.find('td:eq(' + TblIndx.CityName + ')')[0].getElementsByTagName('input')[0].value;
    RoutePlanMasterService.GetCityDetailsByName(CityName, Mode).then(function (response) {
        
        if (response != null) {
            var StateName = response.StateName;
            ObjCurrRow.find('td:eq(' + TblIndx.StateName + ')')[0].getElementsByTagName('input')[0].value = StateName;

        }

    });
}

function PopulateTable(data) {
  // Select the table body
  var tbody = $('#tblRoutePlan tbody');
  
  // Clear any existing rows
  tbody.empty();

  // Loop through the data and append rows
  data.forEach(function(item, index) {
      const serialNo = index + 1;
      var td_DeleteBtn = '';
      var td_StatusBtn = '';
      if(item.RoutePlanStatus=='Un-Verified' ){
          td_DeleteBtn ='<a id="btnDelete" class=" btn btn-primary btn-sm waves-effect waves-light" title="Delete" onclick="DeleteRoutePlan(this);"><i class="fa fa-times" aria-hidden="true"></i></a>';
        }else{
            td_DeleteBtn='<a id="btnDelete" class=" btn btn-primary btn-sm waves-effect waves-light disabled" title="Delete" "><i class="fa fa-times" aria-hidden="true"></i></a>';
      }

      if (item.RoutePlanStatus == 'Verified') {
          td_StatusBtn = `<button type="button" class="btn btn-success btn-rounded waves-effect waves-light btn-sm " style="cursor: not-allowed">${item.RoutePlanStatus}</button>`; 
      } else if (item.RoutePlanStatus == 'Rejected') {
          td_StatusBtn = `<button type="button" class="btn btn-danger  btn-rounded waves-effect waves-light btn-sm " style="cursor: not-allowed">${item.RoutePlanStatus}</button>`; 
      } else {
          td_StatusBtn = `<button type="button" class="btn btn-secondary  btn-rounded waves-effect waves-light btn-sm " style="cursor: not-allowed">${item.RoutePlanStatus}</button>`; 
      }
        
      
    var row = `
      <tr>
        <td>${item.VisitType}</td>
        <td>${item.AccountDesp}</td>
        <td>${item.CityName}</td>
        <td>${item.StateName}</td>
        <td>${item.Description}</td>
        <td>${td_StatusBtn}</td>
        <td>${td_DeleteBtn}</td>
        <td style="display:none">${item.Code}</td>
      </tr>
    `;
    tbody.append(row);
  });

  
      AddNewRow();
  
  
}

function AddNewRow()
    {
        var today = new Date().toISOString().split("T")[0];
        var dtPlanDate=document.getElementById("txtdate").value ;
  if(today==dtPlanDate){
        var tbItemConsumeRowNo = 1;
        var table = $('#tblRoutePlan');
        var tbody=$('#tblRoutePlan tbody');
        var rowNo = tbody[0].rows.length;
        var row = tbody[0].insertRow(rowNo);
        
            
            var VisitType = row.insertCell(TblIndx.VisitType);
            var DealerName = row.insertCell(TblIndx.DealerName);
            var CityName = row.insertCell(TblIndx.CityName);
            var StateName = row.insertCell(TblIndx.StateName);
            var Description = row.insertCell(TblIndx.Description);
      var Status = row.insertCell(TblIndx.Status);
      var DeleteButton = row.insertCell(TblIndx.DeleteButton);
            var Code = row.insertCell(TblIndx.Code);

               
      VisitType.innerHTML = '<input type="text"  id="ddlVisitType' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="ddlVisitType" placeholder="Visit Type" list="listVisitType" autocomplete="off" onclick="$(this).val(\'\')"  onchange="getVisitType(\'ddlVisitType' + tbItemConsumeRowNo + '\',\'ddldealerName' + tbItemConsumeRowNo + '\',' + tbItemConsumeRowNo + ');" required>';
      DealerName.innerHTML = '<input type="text" id="ddldealerName' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="ddldealerName" placeholder="Dealer Name"  list="listdealer" autocomplete="off" onclick="$(this).val(\'\');"  onfocusout="checkDealerListValid(this.value,\'listdealer\',\'txtCity' + tbItemConsumeRowNo + '\',' + tbItemConsumeRowNo + ');" readonly="readonly" required>';
      CityName.innerHTML = '<input type="text" id="txtCity' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtCity" placeholder="City Name"  list="listCity" onclick="$(this).val(\'\')" onChange="GetCityDetailsByName(this);" autocomplete="off" disabled required>';
      StateName.innerHTML = '<input type="text" id="txtState' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtState" placeholder="State Name" list="listState" onclick="$(this).val(\'\')" autocomplete="off" disabled  required>';
            Description.innerHTML = '<input type="text" class="BizSolFormControl box_border form-control form-control-sm" id="txtdescription"  name="txtdescription" placeholder="Description" autocomplete="off" required="" onfocusout="SaveData(this);">';
      Status.innerHTML = '<input type="hidden" value="0">';
      DeleteButton.innerHTML = '';
            Code.innerHTML = '<input type="hidden" value="0"  id="hdn_Code" name="hdn_Code">';
           } 
    }

    function GetRoutePlanDates() {
    RoutePlanMasterService.GetRoutePlanList().then(function (response) {
      var PlanDates = []
       if (response.length > 0) {
           for (var i = 0; i < response.length; i++) {
                  PlanDates.push(response[i].Date);
                }
          }
          
      //$('#txtdate').datepicker({
      //          dateFormat: 'dd/mm/yy',
      //          beforeShowDay: function (date) {
      //              var Highlight = PlanDates[date];
      //              if (Highlight) {
      //                  return [true, "Highlighted", Highlight];
      //              }
      //              else {
      //                  return [true, '', ''];
      //              }
      //          },
      //});
      
    });
}

$(function () {
    // Array of dates to highlight (format: yyyy-mm-dd)
   RoutePlanMasterService.GetRoutePlanList().then(function (response) {
        var PlanDates = []
        if (response.length > 0) {
            for (var i = 0; i < response.length; i++) {
                PlanDates.push(response[i].Date);
            }
        }
    // Function to check and highlight dates
    function highlightDates(date) {
        const dateString = $.datepicker.formatDate('yy-mm-dd', date);
        if (PlanDates.includes(dateString)) {
            return [true, "Highlighted", "Highlighted date"];
        }
        return [true, "", ""];
    }

    // Initialize datepicker
    $("#datepicker").datepicker({
        beforeShowDay: highlightDates
    });
   });
});

function IsVaildFrm(x) {

    var Valid = true;
    if (typeof $('#txtdate').val() === 'undefined' || $('#txtdate').val() === '' || $('#txtdate').val() === null) {
        toastr.error("Please select date");
        $('#txtdate').focus();
        Valid = false;
        return Valid
    }

    var ObjCurrRow = $(x).closest('tr');
  
    var VisitType = ObjCurrRow.find("input[name='ddlVisitType']").val();
    var DealerName = ObjCurrRow.find("input[name='ddldealerName']").val();
    var CityName = ObjCurrRow.find("input[name='txtCity']").val();
    var StateName = ObjCurrRow.find("input[name='txtState']").val();
    var Description = ObjCurrRow.find("input[name='txtdescription']").val();
    var Code = ObjCurrRow.find("input[name='hdn_Code']").val();

    

    if (typeof VisitType === 'undefined' || VisitType === '' || VisitType === null || VisitType.toLowerCase() === '0') {
        toastr.error("Visit Type is invalid");
        
        Valid = false;
        return Valid
    }
    if (typeof DealerName === 'undefined' || DealerName === '' || DealerName === null || DealerName === '0') {
        toastr.error("Dealer Name is invalid")
        
        Valid = false;
        return Valid
    }

    if (typeof CityName === 'undefined' || CityName === '' || CityName === null || CityName === '0') {
        toastr.error("City Name is invalid")
        
        Valid = false;
        return Valid
    }
    if (typeof StateName === 'undefined' || StateName === '' || StateName === null || StateName === '0') {
        toastr.error("State Name is invalid")
        
        Valid = false;
        return Valid
    }
    if (typeof Description === 'undefined' || Description === '' || Description === null || Description === '0') {
        toastr.error("Description is invalid")
        
        Valid = false;
        return Valid
    }
    if (Code > 0) {

        Valid = false;
        return Valid
    }
   
    return Valid;
}
function SaveData(x) {
    if (IsVaildFrm(x) == false) {
        return;
    }

    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var ObjCurrRow = $(x).closest('tr');
    var Data = [{
        Code: ObjCurrRow.find("input[name='hdn_Code']").val(),
        Date: new Date().toISOString().split("T")[0],
        VisitType: ObjCurrRow.find("input[name='ddlVisitType']").val(),
        accountDesp : ObjCurrRow.find("input[name='ddldealerName']").val(),
        CityName: ObjCurrRow.find("input[name='txtCity']").val(),
        StateName: ObjCurrRow.find("input[name='txtState']").val(),
        Description: ObjCurrRow.find("input[name='txtdescription']").val(),
        dealerName: ObjCurrRow.find("input[name='ddldealerName']").val(),
        userName: authKeyData.userName,
        verifiedRejectedBy: 0,
        verifiedRejectedOn: new Date().toISOString().split("T")[0],
        closed: '',
        closedOn: new Date().toISOString().split("T")[0],
        closedReason: '',
        rejectedReason:''
    }];
    RoutePlanMasterService.SaveRoutePlan(Data).then(function (response) {
        
        if (response != '') {
            if (response.Status == 'N') {
                toastr.warning(response.Msg);
            } else {
                toastr.success(response.Msg);
            }
            
            var dtPlanDate = $('#txtdate').val();


            if (typeof $('#txtdate').val() === 'undefined' || $('#txtdate').val() === '' || $('#txtdate').val() === null) {

                $('#txtdate').focus();

            } else {
                GetRoutePlanListByPlanDate(dtPlanDate);
            }
        }
    });

}


function getVisitType(elementId, txtdealer, rowNo) {

    var val = document.getElementById(elementId).value;



    if (val === "New Acquisition") {
        $('#' + txtdealer).removeAttr("list");
        $('#' + txtdealer).attr("readonly", false);
        $('#' + txtdealer).val('');

        //$("#txtCity" + rowNo).attr("readonly", false);
        $('#txtCity' + rowNo).removeAttr("disabled");
        $('#txtCity' + rowNo).attr("list", "listCity");
        $('#txtCity' + rowNo).val('');
        $('#txtState' + rowNo).val('');

    }
    else {
        $('#' + txtdealer).attr("list", "listdealer");
        $('#' + txtdealer).attr("readonly", false);
        $('#' + txtdealer).val('');

        $('#txtCity' + rowNo).val('');
        $('#txtState' + rowNo).val('');

        var standalone = window.navigator.standalone,
            userAgent = window.navigator.userAgent.toLowerCase(),
            safari = /safari/.test(userAgent),
            ios = /iphone|ipod|ipad/.test(userAgent);

        if (ios) {
            if (!standalone && safari) {
                // Safari
            } else if (!standalone && !safari) {
                // iOS webview
            };
        } else {
            if (userAgent.includes('wv')) {
                $('#' + txtdealer).attr("list", "listdealer");
                $('#' + txtdealer).attr("readonly", false);
                $('#' + txtdealer).val('');

                $('#txtCity' + rowNo).val('');
                $('#txtState' + rowNo).val('');
                checkWebveiw();
                $('#' + txtdealer).attr("list", "listdealer");
                $('#' + txtdealer).attr("readonly", true).style.display = "hidden";
                $('#' + txtdealer).val('');
            }
        }

    }
}


function DeleteRoutePlan(x) {
    var authKeyData = JSON.parse(sessionStorage.getItem('authKey'));
    var ObjCurrRow = $(x).closest('tr');

    var Code = ObjCurrRow.find('td:eq(' + TblIndx.Code + ')')[0].innerHTML.trim();
    var UserMaster_Code = authKeyData.UserMaster_Code;
    var RejectReason = 'Test';
 
    RoutePlanMasterService.DeleteRoutePlan(Code, UserMaster_Code, RejectReason).then(function (response) {

        if (response != '') {
            if (response.Status == 'N') {
                toastr.warning(response.Msg);
            } else {
                toastr.success(response.Msg);
            }
            var dtPlanDate = $('#txtdate').val();


            if (typeof $('#txtdate').val() === 'undefined' || $('#txtdate').val() === '' || $('#txtdate').val() === null) {

                $('#txtdate').focus();

            } else {
                GetRoutePlanListByPlanDate(dtPlanDate);
            }
        }
    });

}

function checkDealerListValid(Text, ListValue, City, rowNo) {
    var list = $('#' + ListValue + ' option');//[0].attributes["text"].value;
    var indexNO = IsValidDealerCode(Text, list);
    if (indexNO == -1) {
        $('#txtCity' + rowNo).val('');
        $('#txtState' + rowNo).val('');
        if ($('#ddlVisitType' + rowNo).val() != 'New Acquisition') {
            
            alert("Dealer Name is invalid");
            $('#ddldealerName' + rowNo).val('');
        }
          return false;
    }
    else {
        $('#' + City).attr("list", "listCity");
        var Code = list[indexNO].attributes["text"].value;
        GetAccountMasterDetails( rowNo);
    }
}

function IsValidDealerCode(codeText, list) {
    var index1 = -1;
    $.each(list, function (index, value) {
        // alert(index + ": " + value);
        var c = value.attributes["text"].value;
        var text = value.value;
        if (codeText === text) {
            index1 = index;
        }
    });
    return index1;
}

function GetAccountMasterDetails(rowNo) {
    

    var AccountDesp = $('#ddldealerName' + rowNo).val();
    RoutePlanMasterService.GetAccountMasterDetails(AccountDesp).then(function (response) {

        if (response != '') {
            
            $('#txtCity' + rowNo).val(response.City);
            $('#txtState' + rowNo).val(response.State);
        }
    });
}

window.SaveData = SaveData;
window.getVisitType = getVisitType;
window.GetCityDetailsByName = GetCityDetailsByName;
window.DeleteRoutePlan = DeleteRoutePlan;
window.checkDealerListValid = checkDealerListValid;