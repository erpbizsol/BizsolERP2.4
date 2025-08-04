import { CollectionCommitmentService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CollectionCommitmentService.js';

var baseUrl = sessionStorage.getItem('AppBaseURL');
let G_todayDate = '';
$(document).ready(function () {
    $("#ERPHeading").text("Collection Commitment Report");
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    G_todayDate = `${year}-${month}-${day}`;
    $('#txtFromDate, #txtToDate').val(G_todayDate);

    $('#btnShow').click(function () {
        CollectionCommitmentReportTableShow();
    });
    $('#btnBack').click(function () {
        window.location = baseUrl + "/MarketingTransactions/CollectionCommitment/CollectionCommitment";
    });
    $('#btnDownload').click(function () {
        Export();
    });
});
function CollectionCommitmentReportTableShow() {
    let FromDate = $('#txtFromDate').val();
    let ToDate = $('#txtToDate').val();
    
    Showloader();
    CollectionCommitmentService.CollectionCommitmentReportTable(FromDate, ToDate).then(function (response) {
            if (response && response.length > 0) {
                HideLoader();
                $("#tbCollectionCommitmentReport").show();
                const stringFilterColumn = ["Party Name","Sales Person"];
                const numericFilterColumn = ["OutStanding","OverDue"];
                const dateFilterColumn = [];
                const button = false;
                const stringDoubleFilterColumn = [];
                const showButtons = [];
                const hiddenColumns = [];
                const columnAlignment = {};
                
                BizsolCustomFilterGrid.CreateDataTable("tableheader-CollectionCommitmentReport", "tablebody-CollectionCommitmentReport", response, button, showButtons, stringFilterColumn, numericFilterColumn, dateFilterColumn, stringDoubleFilterColumn, hiddenColumns, columnAlignment);
                PopulateTableForPrint(response);
            } else {
                HideLoader();
                toastr.error("Data Not Found");
                $("#tbCollectionCommitmentReport").hide();
                $("#paginator-tbCollectionCommitmentReport").hide();
            }
    }).catch(function (error) {
        HideLoader();
        console.log(error.Msg || 'Error during Collection Commitment Report');
        $("#tbCollectionCommitmentReport").hide();
        });
}
function PopulateTableForPrint(data) {
    const tableBody = document.querySelector('#tblReport tbody');
    const tableHeader = document.querySelector('#tblReport thead tr');


    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1); 
        tableHeader.appendChild(th);
    });

    $('#tblReport th').css('font-weight', 'bold');
    data.forEach(item => {
        const row = document.createElement('tr');

        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = item[header];
            row.appendChild(td);
        });

        tableBody.appendChild(row);
    });

}
function Export() {
    var ReportType = "CollectionCommitmentReport";
    var currentDate = new Date();
    var dateString = currentDate.getFullYear() + "-" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0") + "-" +
        currentDate.getDate().toString().padStart(2, "0") + "_" +
        currentDate.getHours().toString().padStart(2, "0") + "-" +
        currentDate.getMinutes().toString().padStart(2, "0") + "-" +
        currentDate.getSeconds().toString().padStart(2, "0");

    $("#tblReport").table2excel({
        filename: ReportType + "_" + dateString,
        fileext: ".xlsx"
    });
}
window.Export = Export;
