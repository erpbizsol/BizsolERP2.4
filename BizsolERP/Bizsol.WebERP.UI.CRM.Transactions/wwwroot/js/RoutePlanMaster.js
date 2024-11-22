import { RoutePlanMasterService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/RoutePlanService.js';

const TblIndx = {
    Code: 0,
    VisitType: 1,
    AccountDesp: 2,
    CityName: 3,
    StateName: 4,
    Description: 5,
    RoutePlanStatus: 6
}

$(document).ready(function () {
    //$('#tblRoutePlan').DataTable();
    GetNestedDealerList();
    RoutePlanVistTypeDropDownList();
    GetStateList();
    GetCityList();
     $('#btnSearch').on('click', function() {
         var dtPlanDate=$('#txtdate').val();
                alert(dtPlanDate);
                var Valid = true;
                if (typeof $('#txtdate').val() === 'undefined' || $('#txtdate').val() === '' || $('#txtdate').val() === null) {
                    
                    $('#txtdate').focus();
                    Valid = false;
                }else{
                    GetRoutePlanListByPlanDate(dtPlanDate);
                }
            });
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
 function GetStateList() {
    RoutePlanMasterService.GetStateList().then(function (response) {
      
       if (response.length > 0) {
                    $('#listState option').empty();
                        var option = '';
                        for (var i = 0; i < response.length; i++) {
                          
                            option += '<option text="' + response[i].Code + '">' + response[i].AccountDesp + '</option>'
                        }
                        $('#listState')[0].innerHTML = option;
                        
                }
      
    });
}

 function GetCityList() {
    RoutePlanMasterService.GetCityList().then(function (response) {
      
       if (response.length > 0) {
                    $('#listCity option').empty();
                        var option = '';
                        for (var i = 0; i < response.length; i++) {
                          
                            option += '<option text="' + response[i].Code + '">' + response[i].AccountDesp + '</option>'
                        }
                        $('#listCity')[0].innerHTML = option;
                        
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
      var td_DeleteBtn='';
      if(item.RoutePlanStatus=='Un-Verified' ){
            td_DeleteBtn='<a id="btnDelete" class=" btn btn-primary btn-sm waves-effect waves-light" title="Delete" onclick="Delete(this);"><i class="fa fa-times" aria-hidden="true"></i></a>';
        }else{
            td_DeleteBtn='<a id="btnDelete" class=" btn btn-primary btn-sm waves-effect waves-light disabled" title="Delete" onclick="Delete(this);"><i class="fa fa-times" aria-hidden="true"></i></a>';
        }
        

    var row = `
      <tr>
        <td style="display:none">${item.Code}</td>
        <td>${item.VisitType}</td>
        <td>${item.AccountDesp}</td>
        <td>${item.CityName}</td>
        <td>${item.StateName}</td>
        <td>${item.Description}</td>
        <td>${item.RoutePlanStatus}</td>
        <td>${td_DeleteBtn}</td>
      </tr>
    `;
    tbody.append(row);
  });

  var today = new Date().toISOString().split("T")[0];
  var dtPlanDate=document.getElementById("txtdate").value ;
  if(today==dtPlanDate){
      AddNewRow();
  }
  
}

function AddNewRow()
    {
        var tbItemConsumeRowNo = 1;
        var table = $('#tblRoutePlan');
        var rowNo = table[0].rows.length;
        var row = table[0].insertRow(rowNo);
        /*
            var Code = row.insertCell(TblIndx.Code);
            var VisitType = row.insertCell(TblIndx.VisitType);
            var DealerName = row.insertCell(TblIndx.DealerName);
            var CityName = row.insertCell(TblIndx.CityName);
            var StateName = row.insertCell(TblIndx.StateName);
            var Description = row.insertCell(TblIndx.Description);
            var Status = row.insertCell(TblIndx.Status);
*/
            var VisitType = row.insertCell(0);
            var DealerName = row.insertCell(1);
            var CityName = row.insertCell(2);
            var StateName = row.insertCell(3);
            var Description = row.insertCell(4);
            var Status = row.insertCell(5);
            var Code = row.insertCell(6);

            Code.innerHTML = '<input type="hidden" value="0">';
            VisitType.innerHTML = '<input type="text"  id="ddlVisitType' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="ddlVisitType" placeholder="Visit Type" list="listVisitType" autocomplete="off" onclick="$(this).val(\'\')" onchange="getVisitType(\'ddlVisitType' + tbItemConsumeRowNo + '\',\'ddldealerName' + tbItemConsumeRowNo + '\',' + tbItemConsumeRowNo + ');" required>';
            DealerName.innerHTML = '<input type="text" id="ddldealerName' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="ddldealerName" placeholder="Dealer Name"  list="listdealer" autocomplete="off" onclick="$(this).val(\'\');"  required>';
            CityName.innerHTML = '<input type="text" id="txtCity' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtCity" placeholder="City Name"  list="listCity" autocomplete="off" required>';
            StateName.innerHTML = '<input type="text" id="txtState' + tbItemConsumeRowNo + '" class="BizSolFormControl box_border form-control form-control-sm" name="txtState" placeholder="State Name" list="listState" autocomplete="off"  required>';
            Description.innerHTML = '<input type="text" class="BizSolFormControl box_border form-control form-control-sm" id="txtdescription"  name="txtdescription" placeholder="Description" autocomplete="off" required="" onfocusout="AddNewRow();">';
            Status.innerHTML = '<input type="hidden" value="0">';
            
            
    }