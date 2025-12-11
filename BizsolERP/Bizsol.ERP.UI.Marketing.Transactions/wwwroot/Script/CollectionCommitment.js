import { CollectionCommitmentService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CollectionCommitmentService.js';
import { OrderEntryListService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/OrderEntryListService.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');
let G_todayDate = '';
$(document).ready(function () {
    $("#ERPHeading").text("Collection Commitment");
    OrderByType();
    
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    G_todayDate = `${year}-${month}-${day}`;
    $('#txtCommitmentdate').val(G_todayDate);

    $('#btnSave').hide();
    $('#btnShow').click(function () {
        CollectionCommitmentTableShow();
    });
    $('#btnReport').click(function () {
        var ModuleName = "Target (Dealer Wise)",
            OptionName = "Report",
            ShowMsg = "Y",
            FinYear = getFinancialYear();
        OrderEntryListService.CheckModuleOptionRight(ModuleName, OptionName, ShowMsg, FinYear).then(function (response) {

            if (response.CheckModuleOptionRight == 'N') {
                toastr.error(response.Msg);
                return false;
            } else {
                window.location = baseUrl + "/MarketingTransactions/CollectionCommitment/CollectionCommitmentReport";
            }

        });
    });
});
function OrderByType() {
    CollectionCommitmentService.CollectionCommitmentOrderByList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList($('#ddlOrderBy')[0], response.map((item) => ({ Code: item.value, Desp: item.desp })));

            $('#ddlOrderBy').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        console.log('Error fetching user list:', error);
    });
}
function getFinancialYear() {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth(); 

    var startYear = currentDate.getFullYear();

    if (currentMonth < 3) {
        startYear = startYear - 1; 
    }

    return startYear + "-" + (startYear + 1);
}

function ParseDateForComparison(dateStr) {
    if (!dateStr) {
        return null;
    }

    var onlyDate = dateStr;

    if (onlyDate.length >= 10) {
        onlyDate = onlyDate.substring(0, 10);
    }

    var parts = onlyDate.split('-');

    if (parts.length !== 3) {
        return null;
    }

    var day;
    var month;
    var year;

    // Format yyyy-MM-dd
    if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
    } else {
        // Assume format dd-MM-yyyy
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return null;
    }

    return new Date(year, month, day);
}
function CollectionCommitmentTableShow() {
    let TxtOrderBy = $('#ddlOrderBy').val();
    G_todayDate = $('#txtCommitmentdate').val();
    if (!TxtOrderBy || TxtOrderBy.trim() === '' || TxtOrderBy==='0') {
        toastr.warning("Please select an Order By value.");
        return;
    }
    Showloader();
    CollectionCommitmentService.CollectionCommitmentTable(G_todayDate,TxtOrderBy).then(function (response) {
            if (response && response.length > 0) {
                HideLoader();
                $("#tbCollectionCommitment").show();
                const stringFilterColumn = ["Party Name"];
                const numericFilterColumn = ["OutStanding","Over Due"];
                const dateFilterColumn = ["Created Date"];
                const button = false;
                const stringDoubleFilterColumn = [];
                const showButtons = [];
                const hiddenColumns = ["PartyMaster_Code","UserCode"];
                const columnAlignment = { "OutStanding": 'right', "Over Due": 'right', "Collected Amount": 'right',"Balance Amount":'right',"Created Date":'center'};
                const updatedResponse = response.map(function (item) {
                    let commitmentAmount = parseFloat(item['Commitment Amount']) || 0;
                    let collectedAmount = parseFloat(item['Collected Amount']) || 0;
                    let balanceAmount = commitmentAmount - collectedAmount;

                    let inputAmount = `<input type="text" class="tblAmount box_border form-control form-control-sm" style="width:100px;text-align:right" value="${commitmentAmount}" oninput="CollectionCommitment_validateDecimalInput(this)" maxlength="10" autocomplete="off" />`;
                    let BalanceAmount = balanceAmount.toFixed(2);
                    let buttonsHTML = "";

                    if (commitmentAmount > 0) {
                        buttonsHTML = `<button class="btn btn-danger icon-height mb-1" title="Delete" onclick="CommitmentCollection_Delete('${item.PartyMaster_Code}','${item?.['Created Date']}','${item.UserCode}')"><i class="fa fa-remove"></i></button>`;
                    }

                    return {
                        ...item,
                        "Commitment Amount": inputAmount,
                        "Balance Amount": BalanceAmount,
                        Action: buttonsHTML
                    };
                });

                BizsolCustomFilterGrid.CreateDataTable("table-header-CollectionCommitment", "tablebody-CollectionCommitment", updatedResponse, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
                $('#btnSave').show();
            } else {
                HideLoader();
                toastr.error("Data Not Found");
                $("#tbCollectionCommitment").hide();
                $("#paginator-tbCollectionCommitment").hide();
                $('#btnSave').hide();
            }
    }).catch(function (error) {
        HideLoader();
        console.log(error.Msg || 'Error during Collection Commitment');
        $("#tbCollectionCommitment").hide();
        $("#paginator-tbCollectionCommitment").hide();
        $('#btnSave').hide();
        });
}
function CollectionCommitment_validateDecimalInput(input) {
    let value = input.value.replace(/[^0-9.]/g, '');
    let parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts[1];
    }
    if (value.length > 9) {
        value = value.slice(0, 9);
    }
    if (parts[1] && parts[1].length > 3) {
        value = parts[0] + '.' + parts[1].slice(0, 3);
    }
    input.value = value;
}
function BindSelectList(element, list) {
    let option = '<option value="0"></option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}
function UpdateCommitmentAmount() {
    let updateCommitmentDate = $('#txtCommitmentdate').val();
    let payloadCommitment = [];

    $('#tablebody-CollectionCommitment tr').each(function () {
        let row = $(this);

        let PartyMaster_Code = parseInt(row.find('td').first().text().trim());
        let TargetedAmount = parseFloat(row.find('input.tblAmount').val());

    if (!isNaN(PartyMaster_Code) && TargetedAmount > 0) {
        payloadCommitment.push({
            partyMaster_Code: PartyMaster_Code,
            targetedAmount: TargetedAmount
        });
    }
    });
    console.log(payloadCommitment);
    CollectionCommitmentService.SaveCollectionCommitment(updateCommitmentDate, JSON.stringify(payloadCommitment)).then(function (response) {
            if (response.Status === 'Y') {
                toastr.success(response.Msg);
                CollectionCommitmentTableShow();
            } else {
                toastr.error(response.Msg);
            }
        })
        .catch(function (error) {
            console.log(error.Msg);
        });
}
function CommitmentCollection_Delete(PartyMaster_Code, CreateDate, CreatedBy) {
    var currentDateString = $('#txtCommitmentdate').val();
    var currentDate = ParseDateForComparison(currentDateString);
    var rowDate = ParseDateForComparison(CreateDate);

    if (!currentDate || !rowDate ||
        currentDate.getFullYear() !== rowDate.getFullYear() ||
        currentDate.getMonth() !== rowDate.getMonth() ||
        currentDate.getDate() !== rowDate.getDate()) {
        toastr.warning('Only current date data can be deleted.');
        return;
    }

    if (confirm('Are you sure you want to Delete') == true) {
        Showloader();
        CollectionCommitmentService.CollectionCommitmentCheckSenior(CreatedBy).then(function (response) {
            var result = null;
            if (response && response.length > 0) {
                result = response[0];
            }

            if (result && result.Status == 'Y') {
                CollectionCommitmentService.DeleteCollectionCommitment(PartyMaster_Code, currentDateString).then(function (deleteResponse) {
                    if (deleteResponse.Status == 'Y') {
                        toastr.success(deleteResponse.Msg);
                        CollectionCommitmentTableShow();
                    } else {
                        toastr.error(deleteResponse.Msg);
                    }
                    HideLoader();
                }).catch(function (error) {
                    console.log(error);
                    HideLoader();
                });
            } else if (result && result.Status == 'N') {
                toastr.warning(result.Msg);
                HideLoader();
            } else {
                toastr.error(result ? result.Msg : 'Error while checking senior rights.');
                HideLoader();
            }
        }).catch(function (error) {
            console.log(error);
            HideLoader();
        });
    }
}

window.CollectionCommitment_validateDecimalInput = CollectionCommitment_validateDecimalInput;
window.UpdateCommitmentAmount = UpdateCommitmentAmount;
window.CommitmentCollection_Delete = CommitmentCollection_Delete;
