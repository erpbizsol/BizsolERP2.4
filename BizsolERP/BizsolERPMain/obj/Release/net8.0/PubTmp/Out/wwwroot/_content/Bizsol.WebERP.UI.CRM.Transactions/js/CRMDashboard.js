import { CRMDashboardService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CRMDashboardService.js';
let marketingManMaster_Code = 0;
let DetailKey = "";
let AccountDesp = "All";
let OnlyToday = "N";
let showtodayIndashboard;
let usertype;
$(document).ready(function () {
    //BindDashBoard();
    GetSalespersonList();
    setTimeout(GetCRMFixedParameterConfig(), 2000);
    GetCRMDashboardRefreshText();
});
function ShowDashboard() {
    var chkShowSubordinate = $('#chkShowSubordinateData');
    var chkShowToday = $('#chkShowTodaysData');

    var ShowSubData = 'Y';
    if (chkShowSubordinate[0].checked == true) {
        ShowSubData = 'Y';
    } else {
        ShowSubData = 'N';
    }

    var ShowTodayData = 'N';
    if (chkShowToday[0] != undefined && chkShowToday[0] != null && chkShowToday[0].checked == true) {
        ShowTodayData = 'Y';
    } else {
        ShowTodayData = 'N';
    }
  
    BindDashBoard();
}

function GetCRMDashboardRefreshText() {
    CRMDashboardService.GetCRMDashboardRefreshText()
        .then(function (response) {
            if (response && response.length > 0) {
                $('#lblDataAsOn').text(response[0].DataAsOnText);

            } else {
                $('#lblDataAsOn').text('');
            }
        });
}
function GetSalespersonList() {
    CRMDashboardService.GetSalespersonList().then(function (response) {
        if (response.length > 0) {
            $('#txtSalesPersonlist').empty();
            var options = '<option value="All" selected>All</option>';
            for (var i = 0; i < response.length; i++) {
                options += `<option value="${response[i].PersonName}" data-code="${response[i].Code}">${response[i].PersonName}</option>`;
            }
            $('#txtSalesPersonlist').html(options);
            $('#txtSalesPerson').on('change', function () {
                const selectedName = $(this).val();
                const selectedOption = $(`#txtSalesPersonlist option[value="${selectedName}"]`);
                const code = selectedOption.attr('data-code') || '0';
                marketingManMaster_Code = code;

            });
        } else {
            $('#txtSalesPersonlist').empty();
        }

    }).catch(function (error) {
        console.error('Error fetching report types:', error);
        $('#txtSalesPersonlist').empty();

    });
}
function BindDashBoard() {
    CRMDashboardService.GetCRMDashboardDatalist(DetailKey, marketingManMaster_Code, AccountDesp = "All", OnlyToday)
        .then(function (response) {
            if (response && response.length > 0) {
                bindDashboardData(response);

            } else {
                toastr.error("No records found.");
            }
        });
}
function bindDashboardDatalist() {

    CRMDashboardService.GetCRMDashboardDetailDatalist(DetailKey = "Marketing Man Wise dealer wise Overdue", marketingManMaster_Code, AccountDesp = "All", OnlyToday)
        .then(function (redata) {
            if (redata.length > 0) {
                $('#ShowDetailModal1').modal('show');
                $('#ShowDetailModal1').modal({ backdrop: 'static', keyboard: false })
                const StringFilterColumn = ["Sales Person", "Dealer"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "Sales Person": 'left',
                };
                BizsolCustomFilterGrid.CreateDataTable("table-header1", "table-body1", redata, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);


            } else {
                toastr.error("Record not found...!");
            }
        });

}
function bindDashboardDatalistOutstanding() {
    CRMDashboardService.GetCRMDashboardDetailDatalist(DetailKey = "Marketing Man wise dealer wise current month Outstanding", marketingManMaster_Code, AccountDesp = "All", OnlyToday)
        .then(function (resdata) {
            if (resdata.length > 0) {
                $('#ShowDetailModal').modal('show');
                $('#ShowDetailModal').modal({ backdrop: 'static', keyboard: false })
                const StringFilterColumn = ["Sales Person", "Dealer"];
                const NumericFilterColumn = [];
                const DateFilterColumn = [];
                const Button = false;
                const showButtons = [];
                const StringdoubleFilterColumn = [];
                const hiddenColumns = ["Code"];
                const ColumnAlignment = {
                    "Sales Person": 'left',
                };
                BizsolCustomFilterGrid.CreateDataTable("table-header", "table-body", resdata, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment);

            } else {
                toastr.error("Record not found...!");
            }
        });

}
function bindDashboardData(data) {
    $('#DivIndxDashboard').empty();
    data.forEach(function (item) {
        var cardHtml = '';
        if (item.DetailKeyDesp === "Marketing Man Wise dealer wise Overdue") {
            cardHtml = `
            <div class="card card-width" onclick="bindDashboardDatalist()">
            <div class="dashboard-courses-item_bg"></div>
            <div class="number">${item.DataValue}</div>
            <div class="label">${item.DataDesp} ${item.SubDesp}</div>
            <i class="fas fa-arrow-circle-right"></i>
            </div>
            `;
        } else if (item.DetailKeyDesp === "Marketing Man wise dealer wise current month Outstanding") {
            cardHtml = `
            <div class="card card-width" onclick="bindDashboardDatalistOutstanding()">
            <div class="dashboard-courses-item_bg"></div>
            <div class="number">${item.DataValue}</div>
            <div class="label">${item.DataDesp} ${item.SubDesp}</div>
            <i class="fas fa-arrow-circle-right"></i>
            </div>
            `;
        } else {
            cardHtml = `
            <div class="card card-width">
            <div class="dashboard-courses-item_bg"></div>
            <div class="number">${item.DataValue}</div>
            <div class="label">${item.DataDesp} ${item.SubDesp}</div>
            </div>
            `;
        }
        $('#DivIndxDashboard').append(cardHtml);
    });

}
function GetCRMFixedParameterConfig() {
    GetUserDetails().then(function (usertype) {
        CRMDashboardService.GetCRMFixedParameterConfig()
            .then(function (ress) {
                ress.forEach(function (items) {
                    showtodayIndashboard = items.ShowTodayInDashboard;
                    if (showtodayIndashboard != null && showtodayIndashboard === "Y" && usertype != null && usertype === "A") {
                        $("#txtshowhide").show();
                    } else {
                        $("#txtshowhide").hide();
                    }
                });
            })
            .catch(function (error) {
                console.error("Error fetching fixed parameter config:", error);
            });
    }).catch(function (error) {
        console.error("Error fetching user details:", error);
    });
}
function GetUserDetails() {
    return CRMDashboardService.GetUserDetails()
        .then(function (res) {
            usertype = res.find(item => item.UserType);
            return usertype.UserType;
        })
        .catch(function (error) {
            console.error("Error fetching user details:", error);
            return null;
        });
}
function DataListValidation(ListName, Value, msg, elementId) {
    var Valid = false;
    var list = $('#' + ListName + ' option');
    $.each(list, function (index, value) {
        var text = value.value;
        if (Value === text) {
            Valid = true;
        }
    });
    if (Valid == false) {
        toastr.error( "please select Sales Person..!");
        $('#' + elementId).val('');
    }
}


window.bindDashboardDatalist = bindDashboardDatalist;
window.bindDashboardDatalistOutstanding = bindDashboardDatalistOutstanding;
window.ShowDashboard = ShowDashboard;
window.DataListValidation = DataListValidation;
