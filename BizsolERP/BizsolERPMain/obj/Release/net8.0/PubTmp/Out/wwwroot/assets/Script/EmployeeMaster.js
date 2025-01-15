
const authToken = '{"ERPDBConStr":"Data Source=220.158.165.98,65446;Connection Timeout=0;Persist Security Info=true;Initial Catalog=BizSolERPDBBizDev; User ID=sa;pwd=biz1981;Packet Size=32000","ERPMainDBConStr":"data source = 220.158.165.98,65446; initial catalog = BizSolERPMainDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000","ERPDMSDBConStr":"data source = 220.158.165.98,65446; initial catalog = BizSolERPDMSDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000","ERPDB_Name":"BizSolERPDBBizDev","ERPMainDB_Name":"BizSolERPMainDB_BizDev","ERPDMSDB_Name":"BizSolERPDMSDB_BizDev","AuthToken":"xyz","UserMaster_Code":"145","CompanyCode":"104"}';

$(document).ready(function () {
    var selectedStatus = $('#txtddlStatus').val();
    GetEmployeeData(selectedStatus);
    $('#txtddlStatus').on('change', function () {
        GetEmployeeData(selectedStatus);
    });

});

function GetEmployeeData(selectedStatus) {
    var selectedStatus = $('#txtddlStatus').val();
    var columns = [];
    $.ajax({
        type: "GET",
        url: "https://web.bizsol.in/erpapidev/api/EmployeeMaster/GetEmployeeMasterList?EmployeeStatus" + selectedStatus,
        data: { EmployeeStatus: selectedStatus },
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authToken);
        },
        success: function (data) {
            // Clear existing DataTable if it exists
            if ($.fn.dataTable.isDataTable('#Employeedatatable')) {
                $('#Employeedatatable').DataTable().clear().destroy();
            }
            columnNames = Object.keys(data[0]);
            for (var i in columnNames) {
                columns.push({
                    data: columnNames[i],
                    title: columnNames[i]
                });
            }
            $('#Employeedatatable').DataTable({
                "processing": true, // Show progress bar
                "serverSide": false, // Process client-side
                "data": data,
                "columns": columns,
                "responsive": true,
                "paging": true, // Enable pagination
                "ordering": true, // Enable sorting
                "info": true, // Show table information
                "searching": true // Enable searching
            });
        },
        error: function (data) {
            alert("Error while fetching Data");
        }
    });

}

function opneSetting() {
    window.location.href = "EmployeeMaster/EmployeeConfiguration";
}


