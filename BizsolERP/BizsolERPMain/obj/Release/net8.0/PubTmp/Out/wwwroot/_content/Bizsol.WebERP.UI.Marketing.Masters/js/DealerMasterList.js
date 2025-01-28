import { DealerMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/DealerMasterService.js';
var baseUrl = sessionStorage.getItem('AppBaseURL');

const Indx_Tbl = {
	Code: 0,
	DealerName: 1,
	AccountMaster_Code: 2,
	CityName: 3,
	StateName: 4,
	Address: 5,
	CityMaster_Code: 6,
	StateMaster_Code: 7,
	MobileNo: 8,
	EmailId: 9,
	CreatedBy: 10,
	CreatedDate: 11,
	UpdatedBy: 12,
	UpdatedDate: 13
}

$(document).ready(function () {

	$("#ERPHeading").text("Dealer Master");
	GetDistributorList();
	$("#btnShow").click(function () {
		var Distributor_Name = $("#txtDistributor").val();

		if (Distributor_Name == undefined || Distributor_Name == '') {
			toastr.error('Please select Distributor Name');
			return false;
		}


		GetDealerList();
	});
	$("#btnAddDealerMaster").click(function () {
		CreateNew(0);
	});

	$('#txtDistributor').on('change', function () {

		var selectedValue = $(this).val();  // Get the selected value from the input

		// Loop through the options in the datalist
		$('#ddlDistributorList option').each(function () {
			if ($(this).val() === selectedValue) {
				// Get the code (data-code attribute)
				var selectedCode = $(this).data('code');

				// Set the code in the hidden textbox
				$('#hdntxtDistributor').val(selectedCode);
			}
		});

	});
});

function GetDistributorList() {
	DealerMasterService.GetNestedAccountMasterList().then(function (response) {
		var defaultValue = '';
		if (response.length > 0) {
			$('#ddlDistributorList option').empty();
			var option = '';
			for (var i = 0; i < response.length; i++) {
				if (i == 0) {
					defaultValue = response[0].AccountDesp;
				}
				option += '<option data-code="' + response[i].Code + '">' + response[i].AccountDesp + '</option>'
			}
			$('#ddlDistributorList')[0].innerHTML = option;
			$('#txtDistributor').val(defaultValue);
		}
		//GetDealerList();
	});
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
function GetDealerList() {
	var Distributor_Name = $("#txtDistributor").val();
	Distributor_Name = normalizeText(Distributor_Name);
	DealerMasterService.GetDealerList(Distributor_Name).then(function (response) {
		$("#tblDealerMasterList").show();
		if (response.length > 0) {
			const StringFilterColumn = ["DealerName","CityName","StateName"];
			const NumericFilterColumn = [];
			const DateFilterColumn = [];
			const Button = false;
			const showButtons = [];
			const StringdoubleFilterColumn = [];
			const hiddenColumns = ["Code", "AccountMaster_Code", "CityMaster_Code", "StateMaster_Code","CreatedBy","CreatedDate","UpdatedBy","UpdatedDate"]
			const ColumnAlignment = {
			};

			const updatedResponse = response.map(item => {
				let buttonsHTML = `<button class="btn btn-primary icon-height mb-1" title="Edit"  onclick="EditData(${item.Code},this)"><i class="fa fa-pencil"></i></button>
                <button class="btn btn-danger icon-height mb-1" title="Delete"  onclick="DeleteData(${item.Code})"><i class="fa fa-times"></i></button>
                <button class="btn btn-info icon-height mb-1" title="View" onclick="ViewData(${item.Code},this)"><i class="fa fa-eye"></i></button>`;

			
				return {
					...item,
					Action: buttonsHTML,
				};

			});



			BizsolCustomFilterGrid.CreateDataTable("DealerMasterList-header", "DealerMasterList-body", updatedResponse, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment)
		}
		else {
			toastr.error('No Data Found');
			$("#tblDealerMasterList").hide();
		}
	});

}

function EditData(Code, x) {
	const codes = window.btoa(Code);
	var Distributor_Name = window.btoa($("#txtDistributor").val());
	// Loop through the options in the datalist
	$('#ddlDistributorList option').each(function () {
		if ($(this).val() === $("#txtDistributor").val()) {
			// Get the code (data-code attribute)
			var selectedCode = $(this).data('code');

			// Set the code in the hidden textbox
			$('#hdntxtDistributor').val(selectedCode);
		}
	});
	var Distributor_Code = window.btoa($("#hdntxtDistributor").val());
	var Mode = window.btoa("Edit");
	window.location = baseUrl + "/MarketingMasters/DealerMaster/DealerMaster?Code=" + codes + "&Mode=" + Mode + "&Distributor_Code=" + Distributor_Code + "&Distributor_Name=" + Distributor_Name;
}
function ViewData(Code, x) {
	const codes = window.btoa(Code);
	var Distributor_Name = window.btoa($("#txtDistributor").val());
	// Loop through the options in the datalist
	$('#ddlDistributorList option').each(function () {
		if ($(this).val() === $("#txtDistributor").val()) {
			// Get the code (data-code attribute)
			var selectedCode = $(this).data('code');

			// Set the code in the hidden textbox
			$('#hdntxtDistributor').val(selectedCode);
		}
	});
	var Distributor_Code = window.btoa($("#hdntxtDistributor").val());
	var Mode = window.btoa("View");
	window.location = baseUrl + "/MarketingMasters/DealerMaster/DealerMaster?Code=" + codes + "&Mode=" + Mode + "&Distributor_Code=" + Distributor_Code + "&Distributor_Name=" + Distributor_Name;
}
function CreateNew(Code) {
	var Distributor_Name = $("#txtDistributor").val();
	// Loop through the options in the datalist
	$('#ddlDistributorList option').each(function () {
		if ($(this).val() === Distributor_Name) {
			// Get the code (data-code attribute)
			var selectedCode = $(this).data('code');

			// Set the code in the hidden textbox
			$('#hdntxtDistributor').val(selectedCode);
		}
	});

	var Distributor_Code = $("#hdntxtDistributor").val();

	if (Distributor_Name == 'undefined' || Distributor_Name == "" || Distributor_Name == "All") {
		toastr.error('Please select a Distributor Name.');
		return false;
	}

	const codes = window.btoa(Code);
	const Name = window.btoa(Distributor_Name);
	const disCode = window.btoa(Distributor_Code);
	var Mode = window.btoa("New");
	window.location = baseUrl + "/MarketingMasters/DealerMaster/DealerMaster?Code=" + codes + "&Mode=" + Mode + "&Distributor_Code=" + disCode + "&Distributor_Name=" + Name;
}

function DeleteData(Code) {
	$('#myModal').modal('show');
	$('#myModal').modal({
		backdrop: 'static',
	});
	$("#txtcode").val(Code);
}
function DeleteModal() {
	var reason = $("#deleteReason").val();
	var code = $("#txtcode").val();
	if (reason == "") {
		alert('Please enter a reason before proceeding.');
		return;
	}
	DealerMasterService.DeleteDealerMaster(code, reason).then(function (response) {
		if (response.Msg) {
			
			toastr.success(response.Msg);
			setTimeout(function () {
				$('#deleteReason').val('');
				$('#txtCode').val('');
				$('#myModal').modal('hide');
				window.location = baseUrl + "/MarketingMasters/DealerMaster/DealerMasterList";
			}, 2000); // 2 seconds delay before redirect
		} else {
			toastr.error('An error occurred. Please try again.');
		}
	})
		.catch(function (error) {
			//toastr.error('An unexpected error occurred.');
			console.error(error);
		});
}
function CloseModal() {
	$('#myModal').modal('hide');
}

window.EditData = EditData;
window.ViewData = ViewData;
window.DeleteData = DeleteData;
window.DeleteModal = DeleteModal;
window.CloseModal = CloseModal;