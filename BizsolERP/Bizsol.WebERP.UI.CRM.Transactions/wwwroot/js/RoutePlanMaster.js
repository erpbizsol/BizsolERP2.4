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
let selectedDates = [];

let arrayList_VisitType = [];
let arrayList_NestedDealer = [];
let arrayList_City = [];
$(document).ready(function () {
    
    $("#ERPHeading").text("Route Plan");
  
    RoutePlanVistTypeDropDownList();
  
    $('#btnSearch').on('click', function () {
        var dtPlanDate = $('#txtdate').val();

        var Valid = true;
        if (typeof $('#txtdate').val() === 'undefined' || $('#txtdate').val() === '' || $('#txtdate').val() === null) {

            $('#txtdate').focus();
            Valid = false;
        } else {
            GetRoutePlanListByPlanDate(dtPlanDate);
        }
    });
    

});

function RoutePlanVistTypeDropDownList() {
    RoutePlanMasterService.RoutePlanVistTypeDropDownList().then(function (response) {

        if (response.length > 0) {
            arrayList_VisitType = [];

            response = response.map((item) => ({
                key: item.Code, value: item.Desp
            }));
            arrayList_VisitType = response;
            //$.each(response, function (index, item) {
            //    arrayList_VisitType.push({ key: item.Code, value: item.Desp }); // For example, id as key and name as value
            //});

            GetNestedDealerList();
        }

    });
}

function GetNestedDealerList() {
    RoutePlanMasterService.GetNestedDealerList().then(function (response) {

        if (response.length > 0) {
            arrayList_NestedDealer = [];
            response = response.map((item) => ({
                key: item.Code, value: item.AccountDesp 
            }));
            arrayList_NestedDealer = response;
            //$.each(response, function (index, dealer) {
            //    arrayList_NestedDealer.push({ key: dealer.Code, value: dealer.AccountDesp }); // For example, id as key and name as value
            //});
            //GetStateList('India');
            GetCityList('India', 'All');
        }
        else {
            $('#ErrorMsg').removeClass('invisible');
            $('#ErrorMsg').addClass('visible');
            return false;
        }

    });
}

function GetCityList(CountryName, StateName) {
    RoutePlanMasterService.GetCityList(CountryName, StateName).then(function (response) {

        if (response.length > 0) {
            arrayList_City = [];
            response = response.map((item) => ({
                key: item.Code, value: item.CityName
            }));
            arrayList_City = response;
            //$.each(response, function (index, item) {
            //    arrayList_City.push({ key: item.Code, value: item.CityName }); // For example, id as key and name as value
            //});

            GetRoutePlanDates();

        }

    });
}




function BindSelect2FromDataList(element, arrayList, FirstItem) {
    element.empty();

    if (FirstItem == 'FirstItemAll') {
       
        element.append(new Option("All", "All"));
    } else if (FirstItem == 'FirstItemZero') {
        
        element.append(new Option("", "0"));
    } else {
       
    }


    // Get the options from the datalist and append them to Select2
    $.each(arrayList, function (index, item) {
        // Append new option elements (key as value and value as text)
        element.append(new Option(item.value, item.key));
    });

    // Trigger a change event to update Select2 UI
    element.trigger('change');

    element.select2({
        allowClear: true,
        width: '200px',
        matcher: function (params, data) {
            // If there's no search term, return all data
            if ($.trim(params.term) === '') {
                return data;
            }

            // Match items that start with the search term
            if (data.text.toLowerCase().startsWith(params.term.toLowerCase())) {
                return data;
            }

            // Return null if no match
            return null;
        }
    });
}



//$(document).ready(function () {
//    //$('#tblRoutePlan').DataTable();
//    $("#ERPHeading").text("Route Plan");

//    GetNestedDealerList();
//    RoutePlanVistTypeDropDownList();
//    GetStateList('India');
//    GetCityList('India','All');
//    GetRoutePlanDates();
//    //AddNewRow();
//     $('#btnSearch').on('click', function() {
//         var dtPlanDate=$('#txtdate').val();
                
//                var Valid = true;
//                if (typeof $('#txtdate').val() === 'undefined' || $('#txtdate').val() === '' || $('#txtdate').val() === null) {
                    
//                    $('#txtdate').focus();
//                    Valid = false;
//                }else{
//                    GetRoutePlanListByPlanDate(dtPlanDate);
//                }
//     });
//    //var dtPlanDate = $('#txtdate').val();

   
//    //if (typeof $('#txtdate').val() === 'undefined' || $('#txtdate').val() === '' || $('#txtdate').val() === null) {

//    //    $('#txtdate').focus();
       
//    //} else {
//    //    GetRoutePlanListByPlanDate(dtPlanDate);
//    //}

// });

 document.addEventListener("DOMContentLoaded", function() {
     const today = new Date().toISOString().split("T")[0];
     document.getElementById("txtdate").value = today;

     const inputs = document.querySelectorAll(".BizSolFormControl");

     inputs.forEach((input, index) => {
         input.addEventListener("keydown", function (e) {
             if (e.key === "Enter") {
                 e.preventDefault(); // Prevent form submission
                 const nextInput = inputs[index + 1]; // Get the next input
                 if (nextInput) {
                     nextInput.focus(); // Move focus to the next input
                 }
             }
         });
     });

    });





// function GetNestedDealerList() {
//    RoutePlanMasterService.GetNestedDealerList().then(function (response) {
      
//       if (response.length > 0) {
//                    $('#listdealer option').empty();
//                        var option = '';
//                        for (var i = 0; i < response.length; i++) {
                          
//                            option += '<option text="' + response[i].Code + '">' + response[i].AccountDesp + '</option>'
//                        }
//                        $('#listdealer')[0].innerHTML = option;
                        
//                }
//                else{
//                     $('#ErrorMsg').removeClass('invisible');
//                     $('#ErrorMsg').addClass('visible');
//                    return false;
//                }
      
//    });
//}

 function GetRoutePlanListByPlanDate(dtPlanDate) {
     RoutePlanMasterService.GetRoutePlanListByPlanDate(convertDateFormat(dtPlanDate)).then(function (response) {
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


//function RoutePlanVistTypeDropDownList(){
//    RoutePlanMasterService.RoutePlanVistTypeDropDownList().then(function (response) {
      
//            if (response.length > 0) {
//                    $('#listVisitType option').empty();
//                        var option = '';
//                        for (var i = 0; i < response.length; i++) {
                            
//                            option += '<option text="' + response[i].Code + '">' + response[i].Desp + '</option>'
//                        }
//                        $('#listVisitType')[0].innerHTML = option;
                        
//                }else if (typeof response.Msg === 'undefined') {
//                    $('#listVisitType option').empty();
//                 } else {
//                    $('#listVisitType option').empty();
//                    }
                
      
//    });
//}
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

// function GetCityList(CountryName,StateName) {
//    RoutePlanMasterService.GetCityList(CountryName,StateName).then(function (response) {
      
//       if (response.length > 0) {
//                    $('#listCity option').empty();
//                        var option = '';
//                        for (var i = 0; i < response.length; i++) {
                          
//                            option += '<option text="' + response[i].Code + '">' + response[i].CityName + '</option>'
//                        }
//                        $('#listCity')[0].innerHTML = option;
                        
//                }
      
//    });
//}

function GetCityDetailsByName(x) {
    var ObjCurrRow = $(x).closest('tr');
    var Mode = 'CityMasterByName';
    var DealerName = '';
    //var CityName = ObjCurrRow.find('td:eq(' + TblIndx.CityName + ')')[0].getElementsByTagName('input')[0].value;

    var VisitType = ObjCurrRow.find('td:eq(' + TblIndx.VisitType + ') select option:selected').text();
    var CityName = ObjCurrRow.find('td:eq(' + TblIndx.CityName + ') select option:selected').text();
    if (VisitType === "New Acquisition") {
        DealerName = ObjCurrRow.find("input[name='txtdealer']").val();
    } else {
        DealerName = ObjCurrRow.find('td:eq(' + TblIndx.AccountDesp + ') select option:selected').text();
    }


    if (CityName !== '' && DealerName !== '') {
    RoutePlanMasterService.GetCityDetailsByName(CityName, Mode).then(function (response) {
        
        if (response != null) {
            var StateName = response.StateName;
            ObjCurrRow.find('td:eq(' + TblIndx.StateName + ')')[0].getElementsByTagName('input')[0].value = StateName;

        }

    });

    } else {
        var StateName = '';
        ObjCurrRow.find('td:eq(' + TblIndx.StateName + ')')[0].getElementsByTagName('input')[0].value = StateName;
    }
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
          td_DeleteBtn ='<a id="btnDelete" class="btn btn-danger icon-height mb-1" title="Delete" onclick="DeleteRoutePlan(this);"><i class="fa fa-times" aria-hidden="true"></i></a>';
        }else{
          td_DeleteBtn ='<a id="btnDelete" class="btn btn-danger icon-height mb-1 disabled" title="Delete" ><i class="fa fa-times" aria-hidden="true"></i></a>';
      }

      if (item.RoutePlanStatus == 'Verified') {
          td_StatusBtn = `<button type="button" class="btn btn-success btn-rounded waves-effect waves-light btn-sm btn-width" style="cursor: not-allowed">${item.RoutePlanStatus}</button>`; 
      } else if (item.RoutePlanStatus == 'Rejected') {
          td_StatusBtn = `<button type="button" class="btn btn-danger  btn-rounded waves-effect waves-light btn-sm btn-width" style="cursor: not-allowed">${item.RoutePlanStatus}</button>`; 
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

function AddNewRow() {
    //var today = new Date().toISOString().split("T")[0];
    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();
    var TodayDate = `${day}/${month}/${year}`;
    var dtPlanDate = document.getElementById("txtdate").value;
    if (convertDateFormat(TodayDate) == convertDateFormat(dtPlanDate)) {
        var tbItemConsumeRowNo = 1;
        var table = $('#tblRoutePlan');
        var tbody = $('#tblRoutePlan tbody');
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
        Code.style["display"] = "none";

        VisitType.innerHTML = '<select id="ddlVisitType' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlVisitType"  autocomplete="off" onchange="getVisitType(this,' + tbItemConsumeRowNo + ');"></select>';
        DealerName.innerHTML = '<select id="ddldealerName' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddldealerName"  autocomplete="off" onchange="GetAccountMasterDetails(this,' + tbItemConsumeRowNo + ');"></select><input type="text" value="" autocomplete="off"  id="txtdealer' + tbItemConsumeRowNo + '" name="txtdealer" hidden  class="BizSolFormControl box_border form-control form-control-sm">';
        CityName.innerHTML = '<select id="ddlCity' + tbItemConsumeRowNo + '" class="form-control form-control-sm box_border" name="ddlCity"  autocomplete="off" onChange="GetCityDetailsByName(this);""></select>';
        StateName.innerHTML = '<input type="text" id="txtState' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtState" placeholder="State Name" list="listState" onclick="$(this).val(\'\')" autocomplete="off" disabled  required>';
        Description.innerHTML = '<input type="text" class="BizSolFormControl box_border form-control form-control-sm" id="txtdescription" onkeypress="BizSolhandleEnterKey(event);"  name="txtdescription" placeholder="Description" autocomplete="off" required="">';
        Status.innerHTML = '<input type="hidden" value="0">';
        DeleteButton.innerHTML = '<a id="btnSave" class="btn btn-success icon-height mb-1" title="Save" onclick="SaveData(this);"><i class="fa fa-save" aria-hidden="true"></i></a>';
        Code.innerHTML = '<input type="hidden" value="0"  id="hdn_Code" name="hdn_Code">';

        BindSelect2FromDataList($('#ddlVisitType' + tbItemConsumeRowNo), arrayList_VisitType,"");
        BindSelect2FromDataList($('#ddldealerName' + tbItemConsumeRowNo), arrayList_NestedDealer,"FirstItemZero");
        BindSelect2FromDataList($('#ddlCity' + tbItemConsumeRowNo), arrayList_City,"FirstItemZero");
        getVisitType('#ddlVisitType' + tbItemConsumeRowNo, tbItemConsumeRowNo);
    }
}

//function AddNewRow()
//    {
//    //var today = new Date().toISOString().split("T")[0];
//    var today = new Date();
//    var day = ('0' + today.getDate()).slice(-2);
//    var month = ('0' + (today.getMonth() + 1)).slice(-2);
//    var year = today.getFullYear();
//    var TodayDate=`${day}/${month}/${year}`;
//    var dtPlanDate = document.getElementById("txtdate").value;
//    if (convertDateFormat(TodayDate) ==convertDateFormat(dtPlanDate)){
//        var tbItemConsumeRowNo = 1;
//        var table = $('#tblRoutePlan');
//        var tbody=$('#tblRoutePlan tbody');
//        var rowNo = tbody[0].rows.length;
//        var row = tbody[0].insertRow(rowNo);
        
            
//            var VisitType = row.insertCell(TblIndx.VisitType);
//            var DealerName = row.insertCell(TblIndx.DealerName);
//            var CityName = row.insertCell(TblIndx.CityName);
//            var StateName = row.insertCell(TblIndx.StateName);
//            var Description = row.insertCell(TblIndx.Description);
//      var Status = row.insertCell(TblIndx.Status);
//      var DeleteButton = row.insertCell(TblIndx.DeleteButton);
//            var Code = row.insertCell(TblIndx.Code);
//        Code.style["display"] = "none";
               
//      VisitType.innerHTML = '<input type="text"  id="ddlVisitType' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="ddlVisitType" placeholder="Visit Type" list="listVisitType" autocomplete="off" onclick="$(this).val(\'\')"  onchange="getVisitType(\'ddlVisitType' + tbItemConsumeRowNo + '\',\'ddldealerName' + tbItemConsumeRowNo + '\',' + tbItemConsumeRowNo + ');" required>';
//      DealerName.innerHTML = '<input type="text" id="ddldealerName' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);"  class="BizSolFormControl box_border form-control form-control-sm" name="ddldealerName" placeholder="Dealer Name"  list="listdealer" autocomplete="off" onclick="$(this).val(\'\');"  onfocusout="checkDealerListValid(this.value,\'listdealer\',\'txtCity' + tbItemConsumeRowNo + '\',' + tbItemConsumeRowNo + ');" readonly="readonly" required>';
//      CityName.innerHTML = '<input type="text" id="txtCity' + tbItemConsumeRowNo + '" onkeypress="BizSolhandleEnterKey(event);" class="BizSolFormControl box_border form-control form-control-sm" name="txtCity" placeholder="City Name"  list="listCity" onclick="$(this).val(\'\')" onChange="GetCityDetailsByName(this);" autocomplete="off" disabled required>';
//      StateName.innerHTML = '<input type="text" id="txtState' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtState" placeholder="State Name" list="listState" onclick="$(this).val(\'\')" autocomplete="off" disabled  required>';
//      Description.innerHTML = '<input type="text" class="BizSolFormControl box_border form-control form-control-sm" id="txtdescription" onkeypress="BizSolhandleEnterKey(event);"  name="txtdescription" placeholder="Description" autocomplete="off" required="">';
//      Status.innerHTML = '<input type="hidden" value="0">';
//        DeleteButton.innerHTML = '<a id="btnSave" class="btn btn-success icon-height mb-1" title="Save" onclick="SaveData(this);"><i class="fa fa-save" aria-hidden="true"></i></a>';
//            Code.innerHTML = '<input type="hidden" value="0"  id="hdn_Code" name="hdn_Code">';
//           } 
//    }

////    function GetRoutePlanDates() {
////    RoutePlanMasterService.GetRoutePlanList().then(function (response) {
////      var PlanDates = []
////       if (response.length > 0) {
////           for (var i = 0; i < response.length; i++) {
////                  PlanDates.push(response[i].Date);
////                }
////          }

////      //$('#txtdate').datepicker({
////      //          dateFormat: 'dd/mm/yy',
////      //          beforeShowDay: function (date) {
////      //              var Highlight = PlanDates[date];
////      //              if (Highlight) {
////      //                  return [true, "Highlighted", Highlight];
////      //              }
////      //              else {
////      //                  return [true, '', ''];
////      //              }
////      //          },
////      //});

////    });
////}

////$(function () {
////    // Array of dates to highlight (format: yyyy-mm-dd)
////   RoutePlanMasterService.GetRoutePlanList().then(function (response) {
////        var PlanDates = []
////        if (response.length > 0) {
////            for (var i = 0; i < response.length; i++) {
////                PlanDates.push(response[i].Date);
////            }
////        }
////    // Function to check and highlight dates
////    function highlightDates(date) {
////        const dateString = $.datepicker.formatDate('yy-mm-dd', date);
////        if (PlanDates.includes(dateString)) {
////            return [true, "Highlighted", "Highlighted date"];
////        }
////        return [true, "", ""];
////    }

////    // Initialize datepicker
////    $("#datepicker").datepicker({
////        beforeShowDay: highlightDates
////    });
////   });
////});

function ValidateVisitType(VisitType) {

    var list = $('#listVisitType option');
    var indexNO = IsValidList(VisitType, list);
    if (indexNO == -1) {
        return false;
    } else {
        return true;
    }
}

function ValidateCity(CityName) {

    var list = $('#listCity option');
    var indexNO = IsValidList(CityName, list);
    if (indexNO == -1) {
        return false;
    } else {
        return true;
    }
}
//function IsVaildFrm(x) {

//    var Valid = true;
//    if (typeof $('#txtdate').val() === 'undefined' || $('#txtdate').val() === '' || $('#txtdate').val() === null) {
//        toastr.error("Please select date");
//        $('#txtdate').focus();
//        Valid = false;
//        return Valid
//    }

//    var ObjCurrRow = $(x).closest('tr');
  
//    var VisitType = ObjCurrRow.find("input[name='ddlVisitType']").val();
//    var DealerName = ObjCurrRow.find("input[name='ddldealerName']").val();
//    var CityName = ObjCurrRow.find("input[name='txtCity']").val();
//    var StateName = ObjCurrRow.find("input[name='txtState']").val();
//    var Description = ObjCurrRow.find("input[name='txtdescription']").val();
//    var Code = ObjCurrRow.find("input[name='hdn_Code']").val();
        

//    if (typeof VisitType === 'undefined' || VisitType === '' || VisitType === null || VisitType.toLowerCase() === '0') {
//        toastr.error("Visit Type is invalid");
        
//        Valid = false;
//        return Valid;
//    } else if (ValidateVisitType( VisitType) == false) {
//        toastr.error("Visit Type doesn't match from list.");
//        Valid = false;
//        return false;

//    }

//    if (typeof DealerName === 'undefined' || DealerName === '' || DealerName === null || DealerName === '0') {
//        toastr.error("Dealer Name is invalid")
        
//        Valid = false;
//        return Valid
//    }

//    if (typeof CityName === 'undefined' || CityName === '' || CityName === null || CityName === '0') {
//        toastr.error("City Name is invalid")
        
//        Valid = false;
//        return Valid
//    } else if (ValidateCity(CityName) == false) {
//        toastr.error("City Name doesn't match from list.");
//        Valid = false;
//        return false;

//    }
//    if (typeof StateName === 'undefined' || StateName === '' || StateName === null || StateName === '0') {
//        toastr.error("State Name is invalid")
        
//        Valid = false;
//        return Valid
//    }
//    if (typeof Description === 'undefined' || Description === '' || Description === null || Description === '0') {
//        toastr.error("Description is invalid")
        
//        Valid = false;
//        return Valid
//    }
//    if (Code > 0) {

//        Valid = false;
//        return Valid
//    }
   
//    return Valid;
//}

function IsVaildFrm(x) {

    var Valid = true;
    if (typeof $('#txtdate').val() === 'undefined' || $('#txtdate').val() === '' || $('#txtdate').val() === null) {
        toastr.error("Please select date");
        $('#txtdate').focus();
        Valid = false;
        return Valid
    }

    var ObjCurrRow = $(x).closest('tr');

    
    var CityName = ObjCurrRow.find('td:eq(' + TblIndx.CityName + ') select option:selected').text();
    var StateName = ObjCurrRow.find("input[name='txtState']").val();
    var Description = ObjCurrRow.find("input[name='txtdescription']").val();
    var Code = ObjCurrRow.find("input[name='hdn_Code']").val();
    var VisitType = ObjCurrRow.find('td:eq(' + TblIndx.VisitType + ') select option:selected').text();

    var DealerName = '';

    if (typeof VisitType === 'undefined' || VisitType === '' || VisitType === null || VisitType.toLowerCase() === '0') {
        toastr.error("Visit Type is invalid");

        Valid = false;
        return Valid;
    }

    if (VisitType === "New Acquisition") {
        DealerName = ObjCurrRow.find("input[name='txtdealer']").val();
    } else {
        DealerName = ObjCurrRow.find('td:eq(' + TblIndx.AccountDesp + ') select option:selected').text();
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
    //var Data = [{
    //    Code: ObjCurrRow.find("input[name='hdn_Code']").val(),
    //    Date: new Date().toISOString().split("T")[0],
    //    VisitType: ObjCurrRow.find("input[name='ddlVisitType']").val(),
    //    accountDesp : ObjCurrRow.find("input[name='ddldealerName']").val(),
    //    CityName: ObjCurrRow.find("input[name='txtCity']").val(),
    //    StateName: ObjCurrRow.find("input[name='txtState']").val(),
    //    Description: ObjCurrRow.find("input[name='txtdescription']").val(),
    //    dealerName: ObjCurrRow.find("input[name='ddldealerName']").val(),
    //    userName: authKeyData.userName,
    //    verifiedRejectedBy: 0,
    //    verifiedRejectedOn: new Date().toISOString().split("T")[0],
    //    closed: '',
    //    closedOn: new Date().toISOString().split("T")[0],
    //    closedReason: '',
    //    rejectedReason:''
    //}];

    var val = ObjCurrRow.find('td:eq(' + TblIndx.VisitType + ') select option:selected').text();
    var AccountDesp = '';

    if (val === "New Acquisition") {
        AccountDesp = ObjCurrRow.find("input[name='txtdealer']").val();
    } else {
        AccountDesp = ObjCurrRow.find('td:eq(' + TblIndx.AccountDesp + ') select option:selected').text();
    }

    var Data = [{
        Code: ObjCurrRow.find("input[name='hdn_Code']").val(),
        Date: new Date().toISOString().split("T")[0],
        VisitType: ObjCurrRow.find('td:eq(' + TblIndx.VisitType + ') select option:selected').text(),
        accountDesp: AccountDesp,
        CityName: ObjCurrRow.find('td:eq(' + TblIndx.CityName + ') select option:selected').text(),
        StateName: ObjCurrRow.find("input[name='txtState']").val(),
        Description: ObjCurrRow.find("input[name='txtdescription']").val(),
        dealerName: AccountDesp,
        userName: authKeyData.userName,
        verifiedRejectedBy: 0,
        verifiedRejectedOn: new Date().toISOString().split("T")[0],
        closed: '',
        closedOn: new Date().toISOString().split("T")[0],
        closedReason: '',
        rejectedReason: ''
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


//function getVisitType(elementId, txtdealer, rowNo) {

//    var val = document.getElementById(elementId).value;



//    if (val === "New Acquisition") {
//        $('#' + txtdealer).removeAttr("list");
//        $('#' + txtdealer).attr("readonly", false);
//        $('#' + txtdealer).val('');

//        //$("#txtCity" + rowNo).attr("readonly", false);
//        $('#txtCity' + rowNo).removeAttr("disabled");
//        $('#txtCity' + rowNo).attr("list", "listCity");
//        $('#txtCity' + rowNo).val('');
//        $('#txtState' + rowNo).val('');

//    }
//    else {
//        $('#' + txtdealer).attr("list", "listdealer");
//        $('#' + txtdealer).attr("readonly", false);
//        $('#' + txtdealer).val('');

//        $('#txtCity' + rowNo).attr("disabled", "disabled");
//        $('#txtCity' + rowNo).val('');
//        $('#txtState' + rowNo).val('');

//        var standalone = window.navigator.standalone,
//            userAgent = window.navigator.userAgent.toLowerCase(),
//            safari = /safari/.test(userAgent),
//            ios = /iphone|ipod|ipad/.test(userAgent);

//        if (ios) {
//            if (!standalone && safari) {
//                // Safari
//            } else if (!standalone && !safari) {
//                // iOS webview
//            };
//        } else {
//            if (userAgent.includes('wv')) {
//                $('#' + txtdealer).attr("list", "listdealer");
//                $('#' + txtdealer).attr("readonly", false);
//                $('#' + txtdealer).val('');

//                $('#txtCity' + rowNo).val('');
//                $('#txtState' + rowNo).val('');
//                checkWebveiw();
//                $('#' + txtdealer).attr("list", "listdealer");
//                $('#' + txtdealer).attr("readonly", true).style.display = "hidden";
//                $('#' + txtdealer).val('');
//            }
//        }

//    }
//}

function getVisitType(x, rowNo) {

    var ObjCurrRow = $(x).closest('tr');

    var val = ObjCurrRow.find('td:eq(' + TblIndx.VisitType + ') select option:selected').text();

    if (val === "New Acquisition") {
        $('#ddldealerName' + rowNo).next('.select2-container').hide();

        $('#txtdealer' + rowNo).attr("hidden", false);
        $('#txtdealer' + rowNo).attr("readonly", false);
        $('#txtdealer' + rowNo).val('');
        $('#txtState' + rowNo).val('');
        $('#ddlCity' + rowNo).prop('disabled', false).trigger('change');
        $('#ddlCity' + rowNo + ' option').filter(function () {
            return $(this).text() === '';
        }).prop('selected', true);
        $('#ddlCity' + rowNo).trigger('change');
        $('#ddldealerName' + rowNo + ' option').filter(function () {
            return $(this).text() === '';
        }).prop('selected', true);
        $('#ddldealerName' + rowNo).trigger('change');

    }
    else {
        $('#ddldealerName' + rowNo).next('.select2-container').show();
        $('#txtdealer' + rowNo).attr("hidden", true);
        $('#txtdealer' + rowNo).attr("readonly", true);
        $('#txtdealer' + rowNo).val('');
        $('#ddlCity' + rowNo).prop('disabled', true).trigger('change');
        $('#txtState' + rowNo).val('');
        $('#ddlCity' + rowNo + ' option').filter(function () {
            return $(this).text() === '';
        }).prop('selected', true);
        $('#ddlCity' + rowNo).trigger('change');

        $('#ddldealerName' + rowNo + ' option').filter(function () {
            return $(this).text() === '';
        }).prop('selected', true);
        $('#ddldealerName' + rowNo).trigger('change');


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
               
                checkWebveiw();
                
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
    var indexNO = IsValidList(Text, list);
    if (indexNO == -1) {
        $('#txtCity' + rowNo).val('');
        $('#txtState' + rowNo).val('');
        if ($('#ddlVisitType' + rowNo).val() != 'New Acquisition') {
            
            toastr.error("Dealer Name is invalid")
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

function IsValidList(codeText, list) {
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
function normalizeText(text) {
    var newValue = '';
    var specialChars = ".-#,=}]')[(*&$/@@ ";

    for (var i = 0; i < text.length; i++) {
        if (!specialChars.includes(text[i])) {
            newValue += text[i];
        }
    }
    return newValue.toUpperCase();
}
function GetAccountMasterDetails(element,rowNo) {
    

    //var AccountDesp = $('#ddldealerName' + rowNo).val();
    var AccountDesp = $(element).find('option:selected').text();
    AccountDesp = normalizeText(AccountDesp);

    if (AccountDesp == undefined || AccountDesp == '') {
         
        $('#ddlCity' + rowNo + ' option').filter(function () {
                return $(this).text() === '';
            }).prop('selected', true);
        $('#ddlCity' + rowNo).trigger('change');
        $('#txtState' + rowNo).val('');
            return false;
       
    }
    RoutePlanMasterService.GetAccountMasterDetails(AccountDesp).then(function (response) {

        if (response != '') {
            if (response.City != null) {
                //$('#txtCity' + rowNo).val(response.City);
                $('#ddlCity' + rowNo + ' option').filter(function () {
                    return $(this).text() === response.City;
                }).prop('selected', true);
                $('#ddlCity' + rowNo).trigger('change');
            }
            else {
                toastr.error("City Not Found")
            }
            if (response.State != null) {
                $('#txtState' + rowNo).val(response.State);
            } else {
                toastr.error("State Not Found")
            }
        }
    });
}

function BizSolhandleEnterKey(event) {
    if (event.key === "Enter") {
        //const inputs = document.getElementsByTagName('input')
        const inputs = $('.BizSolFormControl')
        const index = [...inputs].indexOf(event.target);
        if ((index + 1) == inputs.length) {
            inputs[0].focus();
        } else {
            inputs[index + 1].focus();
        }

        event.preventDefault();
    }
}

function SearchInput(x) {
    var inputText = $(x).val().toLowerCase();
    $('#list option').each(function () {
        var optionText = $(x).val().toLowerCase();

        // Check if the option starts with the typed letter
        if (optionText.startsWith(inputText)) {
            $(x).show();
        } else {
            $(x).hide();
        }
    });
}

function GetRoutePlanDates() {
    RoutePlanMasterService.GetRoutePlanList('Locate').then(function (response) {
        if (response && response.length > 0) {
            response.forEach(item => {
                if (item.Date) {
                    selectedDates.push(item.Date);
                }
            });
            highlightSelectedDates();
        }
        else {
            toastr.error('No Data Found')
            highlightSelectedDates();
        }
    });

}
function setupDateInputFormatting() {
    $('#txtdate').on('input', function () {
        let value = $(this).val().replace(/[^\d]/g, '');

        if (value.length >= 2 && value.length < 4) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        } else if (value.length >= 4) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
        }
        $(this).val(value);

        if (value.length === 10) {
            validateDate(value);
        } else {
            $(this).val(value);
        }
    });
}
function validateDate(value) {
    let regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    let isValidFormat = regex.test(value);

    if (isValidFormat) {
        let parts = value.split('/');
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        let date = new Date(year, month - 1, day);

        if (date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {

            $(this).val(value);
        } else {
            $('#txtdate').val('');

        }
    } else {
        $('#txtdate').val('');

    }
}
function highlightSelectedDates() {
    var highlightedDates = {};
    selectedDates.forEach(date => {
        var parts = date.split('/');
        var formattedDate = new Date(parts[2], parts[1] - 1, parts[0]).toDateString();
        highlightedDates[formattedDate] = true;
    });

    var today = new Date();
    var day = ('0' + today.getDate()).slice(-2);
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var year = today.getFullYear();

    $('#txtdate').val(`${day}/${month}/${year}`);
    GetRoutePlanListByPlanDate($('#txtdate').val());
    $('#txtdate').datepicker({
        format: 'dd/mm/yyyy',
        autoclose: true,
        beforeShowDay: function (date) {
            const formattedDate = date.toDateString();
            if (highlightedDates[formattedDate]) {
                return { classes: 'highlighted-date', tooltip: 'Data Available' };
            }
            return { classes: '', tooltip: '' };
        }
    });
}
function convertDateFormat(dateString) {
    const [day, month, year] = dateString.split('/');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthAbbreviation = monthNames[parseInt(month) - 1];
    return `${day}-${monthAbbreviation}-${year}`;
}

window.SaveData = SaveData;
window.getVisitType = getVisitType;
window.GetCityDetailsByName = GetCityDetailsByName;
window.DeleteRoutePlan = DeleteRoutePlan;
window.checkDealerListValid = checkDealerListValid;
window.BizSolhandleEnterKey = BizSolhandleEnterKey;
window.GetAccountMasterDetails = GetAccountMasterDetails;