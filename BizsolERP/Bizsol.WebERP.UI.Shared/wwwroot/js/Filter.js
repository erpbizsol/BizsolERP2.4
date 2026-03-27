// Helper function to escape special characters in IDs for jQuery selectors
window.escapeId = function escapeId(id) {
    return id.replace(/([\/.:\[\]#@$%^&*()+=,!~`{}'"<>?|\\])/g, '\\$1');
}

const BizsolCustomFilterGrid = {
    CreateDataTable: function CreateDataTable(headerId, bodyId, data, Button, ShowButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, HiddenColumns, ColumnAlignment, Paginator = true, TotalColumns = null, FixedDecimalvalue = null) {
        const columns = Object.keys(data[0]);
        const tableId = $('#' + bodyId).closest('table').attr('id');
        renderTableHeader(HiddenColumns, headerId, bodyId, columns, Button, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn);
        window[`hiddenColumns_${bodyId}`] = HiddenColumns;
        window[`columnAlignment_${bodyId}`] = ColumnAlignment;
        window[`totalColumns_${bodyId}`] = TotalColumns;
        window[`fixedDecimalvalue_${bodyId}`] = FixedDecimalvalue;
        renderTable(data, bodyId);
        window[`button_${tableId}`] = Button;
        window[`ShowButtons_${bodyId}`] = ShowButtons;
        window[`filteredData_${tableId}`] = data;
        window[`filteredDataTemp_${tableId}`] = data;
        bodyId = bodyId;
        window[`currentPage_${tableId}`] = 1;
        window[`itemsPerPage_${tableId}`] = 10;
        window[`Paginator_${tableId}`] = Paginator;

        // Add filtered class if any filter columns are defined
        const hasFilterColumns = (StringFilterColumn && StringFilterColumn.length > 0) ||
                                (NumericFilterColumn && NumericFilterColumn.length > 0) ||
                                (DateFilterColumn && DateFilterColumn.length > 0) ||
                                (StringdoubleFilterColumn && StringdoubleFilterColumn.length > 0);

        if (hasFilterColumns) {
            $('#' + bodyId).closest('.table-wrapper').addClass('filtered');
        }

        if (Paginator) {
            createPaginator(tableId, bodyId);
            renderTableWithPagination(tableId, bodyId);
        }
    }

}

window.BizsolCustomFilterGrid = BizsolCustomFilterGrid;
window.populateFilterOptions = function populateFilterOptions(columnName, bodyId) {

    var uniqueValues = new Set();

    const tableId = $('#' + bodyId).closest('table').attr('id');
    window[`filteredData_${tableId}`].forEach(function (row) {
        if (row.hasOwnProperty(columnName)) {
            uniqueValues.add(row[columnName]);
        }
    });

    const colId = columnName.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`;
    const escapedId = escapeId(uniqueId);
    var checkboxContainer = $('#checkbox-container-' + escapedId);
    checkboxContainer.empty();
    checkboxContainer.append('<label><input type="checkbox" class="filter-checkbox" value="All"> All</label>');

    uniqueValues.forEach(function (value) {
        checkboxContainer.append('<label><input type="checkbox" class="filter-checkbox" value="' + value + '"> ' + value + '</label>');
    });

    checkboxContainer.find('input[value="All"]').change(function () {
        var isChecked = $(this).is(':checked');
        checkboxContainer.find('input[type="checkbox"]').not(this).prop('checked', isChecked);
    });

    checkboxContainer.find('input[type="checkbox"]').not('input[value="All"]').change(function () {
        var allChecked = checkboxContainer.find('input[type="checkbox"]').not('input[value="All"]').length ===
            checkboxContainer.find('input[type="checkbox"]:checked').not('input[value="All"]').length;

        checkboxContainer.find('input[value="All"]').prop('checked', allChecked);
    });
}
window.toggleFilter = function (columnName, bodyId) {
    closeAllFilters();
    closeAllFiltersDouble();
    populateFilterOptions(columnName, bodyId);
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const colId = columnName.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`;
    const escapedId = escapeId(uniqueId);
    $('#filter-' + escapedId).toggle();
    $('#filterDropdown-' + escapedId).toggle();
};
window.closeAllFilters = function closeAllFilters() {
    $('.filter-dropdown').hide();
    $('.filter-input').val('');
    $('.filter-dropdown-double').hide();
    $('.checkbox-container-double').hide();
}

$(document).on('input', '.filter-input', function () {
    var searchValue = $(this).val().toLowerCase();
    var column = $(this).data('column');
    // Find the closest checkbox container (within the same filter dropdown)
    var checkboxContainer = $(this).closest('.filter-dropdown').find('.checkbox-container');
    checkboxContainer.find('label').each(function () {
        var checkboxLabel = $(this).text().toLowerCase();
        $(this).toggle(checkboxLabel.includes(searchValue));
    });
});

// Single unified click handler to close filters when clicking outside
$(document).click(function (event) {
    // Check if click is outside filter elements
    if (!$(event.target).closest('.filter-dropdown, .filter-dropdown-double, .filter-division, .table-filter-arrow, .fafilter, .checkbox-container-double').length) {
        $('.filter-division').hide();
        closeAllFilters();
        closeAllFiltersDouble();
    }
});

// Prevent filter dropdowns from closing when clicking inside them
$(document).on('click', '.filter-dropdown, .filter-dropdown-double', function (event) {
    event.stopPropagation();
});

window.checkAllCheckboxesOnLoad = function checkAllCheckboxesOnLoad() {
    $('.filter-checkbox').prop('checked', true);
}

checkAllCheckboxesOnLoad();
window.toggleFilterDouble = function (columnName, bodyId) {
    closeAllFiltersDouble();
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const colId = columnName.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`;
    const escapedId = escapeId(uniqueId);
    $('#filter-double-' + escapedId).toggle();
    $('.filter-dropdown').hide();
    $('#filterDropdown-' + escapedId).toggle();
};

$(document).click(function (event) {
    if (!$(event.target).closest('.filter-dropdown-double, .fafilter').length) {
        closeAllFiltersDouble();
    }
});

var columnFilters = {};

// Helper function to check if any filters are active and manage the filtered class
window.updateFilteredClass = function(bodyId) {
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const hasActiveFilters = Object.keys(columnFilters).length > 0 || 
                            $('.fa-filter[style*="color: white"]').length > 0;

    if (hasActiveFilters) {
        $('#' + bodyId).closest('.table-wrapper').addClass('filtered');
    } else {
        $('#' + bodyId).closest('.table-wrapper').removeClass('filtered');
    }
}

window.populateDateFilter = function (columnName, bodyId) {
closeAllFilters();
closeAllFiltersDouble();
    
const tableId = $('#' + bodyId).closest('table').attr('id');
const colId = columnName.replace(/\s+/g, '');
const uniqueId = `${tableId}-${colId}`;
const escapedId = escapeId(uniqueId);
    
$('#filter-' + escapedId).toggle();
$('#filterDropdown-' + escapedId).toggle();
var uniqueDates = new Set();
window[`filteredData_${tableId}`].forEach(function (row) {
    if (row.hasOwnProperty(columnName)) {
        uniqueDates.add(row[columnName]);
    }
});
var dateStructure = {};
uniqueDates.forEach(function (dateStr) {
    var dateObj = new Date(dateStr);
    var year = dateObj.getFullYear();
    var month = dateObj.toLocaleString('default', { month: 'long' });
    var day = dateObj.getDate();

    if (!dateStructure[year]) {
        dateStructure[year] = {};
    }
    if (!dateStructure[year][month]) {
        dateStructure[year][month] = [];
    }
    dateStructure[year][month].push(day);
});
var checkboxContainer1 = $('#checkbox-container-' + escapedId);
checkboxContainer1.empty();
checkboxContainer1.append('<label><input type="checkbox" class="filter-checkbox" value="All"> (Select All)</label>');
for (var year in dateStructure) {
    checkboxContainer1.append(
        `<label><i class="fa-solid fa-plus toggle-icon" data-target="year-${uniqueId}-${year}"></i><input type="checkbox" class="year-checkbox" value="${year}"> ${year}</label>` +
        `<div class="nested-checkbox" id="year-${uniqueId}-${year}"></div>`
    );
}
for (var year in dateStructure) {
    for (var month in dateStructure[year]) {
        var monthCheckbox = `<label><i class="fa-solid fa-plus toggle-icon" data-target="month-${uniqueId}-${year}-${month}"></i><input type="checkbox" class="month-checkbox" value="${month}"> ${month}</label>`;
        var dayCheckboxes = `<div class="nested-checkbox" id="month-${uniqueId}-${year}-${month}">`;
        dateStructure[year][month].forEach(function (day) {
            dayCheckboxes += `<label><input type="checkbox" class="day-checkbox" value="${day}"> ${day}</label>`;
        });
        dayCheckboxes += '</div>';

        $('#year-' + escapedId + '-' + year).append(monthCheckbox + dayCheckboxes);
    }
}
checkboxContainer1.find('.year-checkbox').change(function () {
    var isChecked = $(this).is(':checked');
    var year = $(this).val();
    $('#year-' + escapedId + '-' + year + ' input[type="checkbox"]').prop('checked', isChecked);
});
checkboxContainer1.find('.month-checkbox').change(function () {
    var isChecked = $(this).is(':checked');
    var monthCheckboxes = $(this).closest('label').nextAll('.nested-checkbox:first');
        monthCheckboxes.find('input[type="checkbox"]').prop('checked', isChecked);

        var yearCheckbox = $(this).closest('.nested-checkbox').prev('label').find('.year-checkbox');
        var monthCheckboxes = $(this).closest('.nested-checkbox').find('.month-checkbox');

        var checkedCount = monthCheckboxes.filter(':checked').length;
        yearCheckbox.prop('checked', checkedCount > 0);
    });
    checkboxContainer1.find('.day-checkbox').change(function () {
        var monthCheckbox = $(this).closest('.nested-checkbox').prev('label').find('.month-checkbox');
        var allDaysChecked = $(this).closest('.nested-checkbox').find('.day-checkbox:checked').length > 0;
        monthCheckbox.prop('checked', allDaysChecked);

        var yearCheckbox = monthCheckbox.closest('.nested-checkbox').prev('label').find('.year-checkbox');
        var allMonthsChecked = $(this).closest('.nested-checkbox').prevAll('label').find('.month-checkbox:checked').length;
        var allMonthsChecked1 = $(this).closest('.nested-checkbox').nextAll('label').find('.month-checkbox:checked').length;
        yearCheckbox.prop('checked', allMonthsChecked > 0 || allMonthsChecked1 > 0);
    });
    checkboxContainer1.find('input[value="All"]').change(function () {
        var isChecked = $(this).is(':checked');
        checkboxContainer1.find('input[type="checkbox"]').not(this).prop('checked', isChecked);
    });
    checkboxContainer1.find('input[type="checkbox"]').not('input[value="All"]').change(function () {
        var allChecked = checkboxContainer1.find('input[type="checkbox"]').not('input[value="All"]').length ===
            checkboxContainer1.find('input[type="checkbox"]:checked').not('input[value="All"]').length;
        checkboxContainer1.find('input[value="All"]').prop('checked', allChecked);
    });
    $('.toggle-icon').click(function (event) {
        event.preventDefault();
        event.stopPropagation();
        var targetId = $(this).data('target');
        var escapedTargetId = escapeId(targetId);
        $('#' + escapedTargetId).toggle();
        $(this).toggleClass('fa-plus fa-minus');
    });
}
window.applyFilters = function applyFilters(bodyId) {
    var column1 = "";
    var column1 = "";
    const tableId = $('#' + bodyId).closest('table').attr('id');

    var filteredArray = window[`filteredData_${tableId}`].filter(item => {
        return Object.keys(columnFilters).every(column => {
            column1 = column;
            var selectedValues = columnFilters[column];
            var cellValue = item[column];

            if (selectedValues.includes("All")) {
                return true;
            }

            var dateObj = new Date(cellValue);
            console.log(dateObj);

            if (!isNaN(dateObj.getTime())) {
                var year = dateObj.getFullYear().toString();
                var month = dateObj.toLocaleString("default", { month: "long" });
                var day = dateObj.getDate().toString();
                return (
                    selectedValues.includes(year) &&
                    selectedValues.includes(month) &&
                    selectedValues.includes(day)
                );
            }

            return selectedValues.includes(cellValue);
        });
    });

    window[`filteredData_${tableId}`] = filteredArray;
    renderTable(filteredArray, bodyId);
    if (window[`Paginator_${tableId}`]) {
        createPaginator(tableId, bodyId);
        renderTableWithPagination(tableId, bodyId);
    }

    const uniqueId = tableId + '-' + column1.replace(/\s+/g, '');
    const escapedId = escapeId(uniqueId);
    const th = $('#filterDropdown-' + escapedId).closest('th');
    const span = th.find('span.filter-table-heading');
    span.find('.fa-filter').remove();
    span.append('<i class="fa-solid fa-filter" style="color: white; margin-left: 5px;"></i>');

}
window.toggleFilterNumeric = function (filterId, ColumnName, bodyId) {
    closeAllFilters();
    closeAllFiltersDouble();
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const colId = ColumnName.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`;
    const escapedId = escapeId(uniqueId);
    const escapedFilterId = escapeId(filterId);
    $('#filterDropdown-' + escapedId).toggle();
    $('#' + escapedFilterId).toggle();
    toggleNumericInputs(ColumnName, tableId);
};
window.toggleNumericInputs = function (columnName, tableId) {
    const colId = columnName.replace(/\s+/g, '');
    const uniqueId = tableId ? `${tableId}-${colId}` : colId;
    const escapedId = escapeId(uniqueId);
    const selectedOption = $('#numeric-filter-select-' + escapedId).val();
    $('#filter-value-' + escapedId).hide();
    $('#min-value-' + escapedId).hide();
    $('#max-value-' + escapedId).hide();

    if (selectedOption === 'equals' || selectedOption === 'greater' || selectedOption === 'less') {
        $('#filter-value-' + escapedId).show();
    } else if (selectedOption === 'between') {
        $('#min-value-' + escapedId).show();
        $('#max-value-' + escapedId).show();
    }
};
window.applyNumericFilter = function (columnName, bodyId) {
const tableId = $('#' + bodyId).closest('table').attr('id');
const colId = columnName.replace(/\s+/g, '');
const uniqueId = `${tableId}-${colId}`;
const escapedId = escapeId(uniqueId);
const selectedOption = $('#numeric-filter-select-' + escapedId).val();
const filterValue = parseFloat($('#filter-value-' + escapedId).val());
const minValue = parseFloat($('#min-value-' + escapedId).val());
const maxValue = parseFloat($('#max-value-' + escapedId).val());

    if (!isNaN(filterValue) || (!isNaN(minValue) && !isNaN(maxValue))) {
        const tableId = $('#' + bodyId).closest('table').attr('id');
        var filteredArray = window[`filteredData_${tableId}`].filter(item => {
            const cellValue = parseFloat(item[columnName]);
            let shouldShow = false;

            switch (selectedOption) {
                case "equals":
                    shouldShow = cellValue === filterValue;
                    break;
                case "greater":
                    shouldShow = cellValue > filterValue;
                    break;
                case "less":
                    shouldShow = cellValue < filterValue;
                    break;
                case "between":
                    shouldShow = cellValue >= minValue && cellValue <= maxValue;
                    break;
            }

            return shouldShow;
        });

        window[`filteredData_${tableId}`] = filteredArray;
        renderTable(filteredArray, bodyId);
        if (window[`Paginator_${tableId}`]) {
            createPaginator(tableId, bodyId);
            renderTableWithPagination(tableId, bodyId);
        }

        const th = $('#filterDropdown-' + escapedId).closest('th');
        const span = th.find('span.filter-table-heading');
        span.find('.fa-filter').remove();
        span.append('<i class="fa-solid fa-filter" style="color: white; margin-left: 5px;"></i>');
    }

    closeAllFilters();
};
window.ClearFilter = function ClearFilter(bodyId) {
    $('.filter-dropdown').hide();
    $('.filter-input').val('');
    $('.filter-input-double').val('');
    $('.filter-dropdown-double').hide();
    // Clear stored column filters (used by date filters)
    columnFilters = {};
    const tableId = $('#' + bodyId).closest('table').attr('id');
    // Remove filtered class from table-wrapper
    //$('#' + bodyId).closest('.table-wrapper').removeClass('filtered');
    window[`filteredData_${tableId}`] = window[`filteredDataTemp_${tableId}`];
    renderTable(window[`filteredData_${tableId}`], bodyId);
    if (window[`Paginator_${tableId}`]) {
        createPaginator(tableId, bodyId);
        renderTableWithPagination(tableId, bodyId);
    }
    $("#" + tableId + " th span.filter-table-heading .fa-filter").remove();
}
window.applyStringFilters = function applyStringFilters(columnName, bodyId) {
    var column = columnName;
    var selectedValues = [];
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const checkboxContainerId = tableId +'-'+column.replace(/\s+/g, '');
    const escapedCheckboxId = escapeId(checkboxContainerId);
    $('#checkbox-container-' + escapedCheckboxId + ' input:checked').each(function () {
        if ($(this).val() != "All") {
            selectedValues.push($(this).val());
        }
    });

    if (selectedValues.length > 0) {

        var filteredArray = window[`filteredData_${tableId}`].filter(item =>
            selectedValues.includes(item[column]) || selectedValues.includes("All")
        );

        window[`filteredData_${tableId}`] = filteredArray;
        renderTable(filteredArray, bodyId);
        if (window[`Paginator_${tableId}`]) {
            createPaginator(tableId, bodyId);
            renderTableWithPagination(tableId, bodyId);
        }

        const uniqueId = tableId + '-' + column.replace(/\s+/g, '');
        const escapedId = escapeId(uniqueId);
        const th = $('#filterDropdown-' + escapedId).closest('th');
        const span = th.find('span.filter-table-heading');
        span.find('.fa-filter').remove();
        span.append('<i class="fa-solid fa-filter" style="color: white; margin-left: 5px;"></i>');
    }
    closeAllFilters();
}
window.ShowEntry = function ShowEntry(columnName, bodyId) {
    var column = columnName;
    populateFilterOptionsDouble(column, bodyId);
    $('#checkbox-container-double-' + column.replace(/\s+/g, '')).toggle();
}
window.populateFilterOptionsDouble = function populateFilterOptionsDouble(columnName, bodyId) {
    var uniqueValues = new Set();
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const colId = columnName.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`;
    const escapedId = escapeId(uniqueId);
    
    window[`filteredData_${tableId}`].forEach(function (row) {
        if (row.hasOwnProperty(columnName)) {
            uniqueValues.add(row[columnName]);
        }
    });
    var checkboxContainer = $('#checkbox-container-double-' + escapedId);
    checkboxContainer.empty();
    checkboxContainer.append('<label><input type="checkbox" class="filter-checkbox" value="All"> All</label>');
    uniqueValues.forEach(function (value) {
        checkboxContainer.append('<label><input type="checkbox" class="filter-checkbox" value="' + value + '"> ' + value + '</label>');
    });
    checkboxContainer.find('input[value="All"]').change(function () {
        var isChecked = $(this).is(':checked');
        checkboxContainer.find('input[type="checkbox"]').not(this).prop('checked', isChecked);
    });
    checkboxContainer.find('input[type="checkbox"]').not('input[value="All"]').change(function () {
        var allChecked = checkboxContainer.find('input[type="checkbox"]').not('input[value="All"]').length ===
            checkboxContainer.find('input[type="checkbox"]:checked').not('input[value="All"]').length;
        checkboxContainer.find('input[value="All"]').prop('checked', allChecked);
    });
}
window.applyfilterdouble = function applyfilterdouble(columnName, bodyId) {
var column = columnName;
const tableId = $('#' + bodyId).closest('table').attr('id');
const colId = column.replace(/\s+/g, '');
const uniqueId = `${tableId}-${colId}`;
const escapedId = escapeId(uniqueId);

var filterType = $('#filter-type-' + escapedId).val();
var searchValue = $('.filter-input-double[data-column="' + column + '"]').val().trim().toLowerCase();
var selectedValues = [];

$('#checkbox-container-double-' + escapedId + ' input:checked').each(function () {
    if ($(this).val() !== "All") {
        selectedValues.push($(this).val().toLowerCase());
    }
});
var useCheckboxFilter = selectedValues.length > 0;
var useTextFilter = searchValue.length > 0;
if (useCheckboxFilter || useTextFilter) {
    var filteredArray = window[`filteredData_${tableId}`].filter(item => {
        var cellValue = item[columnName].toLowerCase();
        var showRow = false;

        if (useTextFilter) {
            if (filterType === "startsWith" && cellValue.startsWith(searchValue)) {
                showRow = true;
            } else if (filterType === "endsWith" && cellValue.endsWith(searchValue)) {
                showRow = true;
            } else if (filterType === "like" && cellValue.includes(searchValue)) {
                showRow = true;
            }
        } else if (useCheckboxFilter) {
            showRow = selectedValues.includes(cellValue);
        }

        return showRow;
    });

    window[`filteredData_${tableId}`] = filteredArray;
    renderTable(filteredArray, bodyId);
    if (window[`Paginator_${tableId}`]) {
        createPaginator(tableId, bodyId);
            renderTableWithPagination(tableId, bodyId);
        }

        const th = $('#filterDropdown-' + escapedId).closest('th');
        const span = th.find('span.filter-table-heading');
        span.find('.fa-filter').remove();
        span.append('<i class="fa-solid fa-filter" style="color: white; margin-left: 5px;"></i>');
    }
    closeAllFiltersDouble();
};
window.closeAllFiltersDouble = function closeAllFiltersDouble() {
    $('.filter-dropdown-double').hide();
    $('.checkbox-container-double').hide();
}
window.applyfilterdate = function applyfilterdate(columnName, bodyId) {
    var column = columnName;
    var selectedValues = [];

    // Use the same ID pattern as populateDateFilter / renderTableHeader
    const tableId = $('#' + bodyId).closest('table').attr('id');
    const colId = column.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`;
    const escapedId = escapeId(uniqueId);

    $('#checkbox-container-' + escapedId + ' input:checked').each(function () {
        if ($(this).val() != "All") {
            selectedValues.push($(this).val());
        }
    });

    columnFilters[column] = selectedValues;
    applyFilters(bodyId);
    closeAllFilters();
}
window.renderTableHeader = function renderTableHeader(hiddenColumns, headerId, bodyId, columns, button, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn) {
const $header = $(`#${headerId}`);
$header.empty();
const tableId = $(`#${bodyId}`).closest('table').attr('id');
let headerRow = '<tr>';
columns.forEach(col => {
    let filterHtml = '';
    const colId = col.replace(/\s+/g, '');
    const uniqueId = `${tableId}-${colId}`; // Make IDs unique per table
        
    if (StringFilterColumn.includes(col)) {
        filterHtml = `<th>
                                     <div class="filter-table-heading-div">
                                      <span class="filter-table-heading">${col}</span>
                                        <span class="table-filter-arrow">
                                          <i class="fa-solid fa-angle-down" onclick="OpenFilter('${uniqueId}', event)" style="cursor: pointer;"></i>
                                        </span>
                                          <div class="filter-division" id="filterDropdown-${uniqueId}" style="display:none;">
                                            <div class="dropdown-content">
                                              <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="asc">
                                                <i class="fa-solid fa-arrow-up-a-z sort-indicator sort-indicator-color"></i> Ascending
                                              </div>
                                              <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="desc">
                                                <i class="fa-solid fa-arrow-down-z-a sort-indicator sort-indicator-color"></i> Descending
                                              </div>
                                              <div class="dropdown-item fafilter" onclick="toggleFilter('${col}','${bodyId}')">
                                                <i class="fa-solid fa-filter  sort-indicator-color"></i> Filter...
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div class="filter-dropdown" id="filter-${uniqueId}">
                                        <input type="text" placeholder="Search..." class="filter-input form-control form-control-sm" data-column="${col}" />
                                        <div class="checkbox-container" id="checkbox-container-${uniqueId}"></div>
                                        <hr>
                                        <button class="btn btn-success btn-height" onclick="applyStringFilters('${col}','${bodyId}')" data-column="${col}">Apply</button>
                                        <button class="btn btn-success btn-height" onclick="ClearFilter('${bodyId}')">Clear</button>
                                        </div>
                                       </div>
                                 </th>`;
        } else if (NumericFilterColumn.includes(col)) {
            filterHtml = `<th>
                                         <div class="filter-table-heading-div">
                                              <span class="filter-table-heading">${col}</span>
                                              <span class="table-filter-arrow">
                                                  <i class="fa-solid fa-angle-down" onclick="OpenFilter('${uniqueId}', event)" style="cursor: pointer;"></i>
                                                </span>
                                                  <div class="filter-division" id="filterDropdown-${uniqueId}" style="display:none;">
                                                    <div class="dropdown-content">
                                                      <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="asc">
                                                        <i class="fa-solid fa-arrow-up-a-z sort-indicator  sort-indicator-color"></i> Ascending
                                                      </div>
                                                      <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="desc">
                                                        <i class="fa-solid fa-arrow-down-z-a sort-indicator  sort-indicator-color"></i> Descending
                                                      </div>
                                                      <div class="dropdown-item fafilter" onclick="toggleFilterNumeric('filter-dropdown-numeric-${uniqueId}','${col}','${bodyId}');">
                                                        <i class="fa-solid fa-filter  sort-indicator-color"></i> Filter...
                                                      </div>
                                                    </div>
                                                  </div>
                                               </div>
                                         <div class="filter-dropdown" id="filter-dropdown-numeric-${uniqueId}">
                                          <select id="numeric-filter-select-${uniqueId}" onchange="toggleNumericInputs('${col}', '${tableId}')">
                                                <option value="equals">=</option>
                                                <option value="greater">></option>
                                                <option value="less">&lt;</option>
                                                <option value="between">Between</option>
                                            </select>
                                            <div class="filter-inputs">
                                                <input type="number" id="filter-value-${uniqueId}" class="filter-input form-control form-control-sm" placeholder="Enter value" />
                                                 <input type="number" id="min-value-${uniqueId}" class="filter-input form-control form-control-sm" placeholder="Min value" style="display:none" />
                                                <input type="number" id="max-value-${uniqueId}" class="filter-input form-control form-control-sm" placeholder="Max value" style="display:none" />
                                            </div>
                                            <button class="btn btn-success btn-height" onclick="applyNumericFilter('${col}','${bodyId}')">Apply</button>
                                            <button class="btn btn-success btn-height" onclick="ClearFilter('${bodyId}')">Clear</button>
                                         </div>
                                         </th>`;
        } else if (DateFilterColumn.includes(col)) {
            filterHtml = ` <th>
                                            <div class="filter-table-heading-div">
                                              <span class="filter-table-heading"> ${col}</span>
                                              <span class="table-filter-arrow">
                                                  <i class="fa-solid fa-angle-down" onclick="OpenFilter('${uniqueId}', event)" style="cursor: pointer;"></i>
                                                </span>
                                                  <div class="filter-division" id="filterDropdown-${uniqueId}" style="display:none;">
                                                    <div class="dropdown-content">
                                                      <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="asc">
                                                        <i class="fa-solid fa-arrow-up-a-z sort-indicator  sort-indicator-color"></i> Ascending
                                                      </div>
                                                      <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="desc">
                                                        <i class="fa-solid fa-arrow-down-z-a sort-indicator  sort-indicator-color"></i> Descending
                                                      </div>
                                                      <div class="dropdown-item fafilter" onclick="populateDateFilter('${col}','${bodyId}')">
                                                        <i class="fa-solid fa-filter  sort-indicator-color"></i> Filter...
                                                      </div>
                                                    </div>
                                                  </div>
                                               </div>
                                            <div class="filter-dropdown" id="filter-${uniqueId}">
                                            <div class="checkbox-container" id="checkbox-container-${uniqueId}"></div>
                                            <button class="btn btn-success btn-height" onclick="applyfilterdate('${col}','${bodyId}')" data-column="${col}">Apply</button>
                                            <button class="btn btn-success btn-height" onclick="ClearFilter('${bodyId}')">Clear</button>
                                            </div>
                                       </th>`;
        } else if (StringdoubleFilterColumn.includes(col)) {
            filterHtml = `<th>
                                           <div class="filter-table-heading-div">
                                         <span class="filter-table-heading">${col}</span>
                                         <span class="table-filter-arrow">
                                             <i class="fa-solid fa-angle-down" onclick="OpenFilter('${uniqueId}', event)" style="cursor: pointer;"></i>
                                           </span>
                                             <div class="filter-division" onclick="stopPropagationdouble(event)" id="filterDropdown-${uniqueId}" style="display:none;">
                                               <div class="dropdown-content">
                                                 <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="asc">
                                                   <i class="fa-solid fa-arrow-up-a-z sort-indicator  sort-indicator-color"></i> Ascending
                                                 </div>
                                                 <div class="dropdown-item" onclick="sortable(this)" data-column="${col}" data-order="desc">
                                                   <i class="fa-solid fa-arrow-down-z-a sort-indicator  sort-indicator-color"></i> Descending
                                                 </div>
                                                 <div class="dropdown-item fafilter" onclick="toggleFilterDouble('${col}','${bodyId}')">
                                                   <i class="fa-solid fa-filter  sort-indicator-color"></i> Filter...
                                                 </div>
                                               </div>
                                             </div>
                                          </div>
                                        <div class="filter-dropdown-double" onclick="stopPropagationdouble(event)" id="filter-double-${uniqueId}">
                                         <select class="filter-type" id="filter-type-${uniqueId}">
                                            <option value="startsWith">Starts With</option>
                                            <option value="endsWith">Ends With</option>
                                            <option value="like">Between</option>
                                        </select>
                                        <input type="text" placeholder="Search..." class="filter-input-double form-control form-control-sm" data-column="${col}" />
                                        <div class="checkbox-container-double" id="checkbox-container-double-${uniqueId}"></div>
                                        <button class="btn btn-success btn-height" onclick="applyfilterdouble('${col}','${bodyId}')" data-column="${col}">Apply</button>
                                        <button class="btn btn-primary btn-height" onclick="ShowEntry('${col}','${bodyId}')" data-column="${col}">Show Entries</button>
                                        <button class="btn btn-success btn-height" onclick="ClearFilter('${bodyId}')">Clear</button>
                                        </div>
                                    </th>`;
        } else if (hiddenColumns.includes(col)) {
            filterHtml = `<th style="display:none">${col}</th>`
        }
        else {
            filterHtml = `<th>${col}</th>`;
        }
        headerRow += `${filterHtml}`;
    });
    if (button) {
        headerRow += '<th style="min-width:120px !important">Action</th></tr>';
    } else {
        headerRow += '</tr>';
    }
    $header.append(headerRow);
}
window.sortable = function sortable(element) {
    var column = $(element).data('column');
    var index = $(element).closest('th').index();
    var order = $(element).data('order');
    var tbodyId = $(element).closest('table').find('tbody').attr('id');
    $(element).data('order', order);
    sortTable(index, order, tbodyId);
};
window.sortTable = function sortTable(columnIndex, order, tbodyId) {
    var rows = $(`#${tbodyId} tr`).get();
    rows.sort(function (a, b) {
        var keyA = $(a).children('td').eq(columnIndex).text().trim();
        var keyB = $(b).children('td').eq(columnIndex).text().trim();
        if ($.isNumeric(keyA) && $.isNumeric(keyB)) {
            return (order === 'asc') ? keyA - keyB : keyB - keyA;
        } else {
            return (order === 'asc') ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA);
        }
    });
    $.each(rows, function (index, row) {
        $(`#${tbodyId}`).append(row);
    });
    CloseFilter();
}
window.stopPropagationdouble = function stopPropagationdouble(event) {
    event.stopPropagation();
};
window.renderTable = function renderTable(items, bodyId, skipTotalRow = false) {
    let showButtons = ''
    const tableId = $('#' + bodyId).closest('table').attr('id');
    var button = window[`button_${tableId}`];
    if (button == true) {
        showButtons = window[`ShowButtons_${bodyId}`]
    }

    const totalColumns = window[`totalColumns_${bodyId}`];
    const columnTotals = {};

    // Calculate totals for specified columns (if not skipping)
    if (totalColumns && Array.isArray(totalColumns) && totalColumns.length > 0 && !skipTotalRow) {
        totalColumns.forEach(colName => {
            columnTotals[colName] = 0;
        });

        items.forEach(item => {
            totalColumns.forEach(colName => {
                const value = parseFloat(item[colName]);
                if (!isNaN(value) && isFinite(value)) {
                    columnTotals[colName] += value;
                }
            });
        });
    }

    let rows = items.map((item, index) => {
        const row = Object.keys(item).map((key) => {
            const alignment = window[`columnAlignment_${bodyId}`][key] || 'left';
            const style = window[`hiddenColumns_${bodyId}`].includes(key)
                ? 'display:none'
                : `text-align:${alignment}`;

            // Format numeric values based on FixedDecimalvalue parameter
            let cellValue = item[key];
            const fixedDecimalConfig = window[`fixedDecimalvalue_${bodyId}`];

            if (cellValue !== null && cellValue !== undefined && cellValue.toString().includes('.')==true && !isNaN(parseFloat(cellValue)) && isFinite(cellValue)) {
                // Check if FixedDecimalvalue is configured and if current column is in the config
                if (fixedDecimalConfig && typeof fixedDecimalConfig === 'object' && fixedDecimalConfig.hasOwnProperty(key)) {
                    const decimalPlaces = fixedDecimalConfig[key];
                    cellValue = parseFloat(cellValue).toFixed(decimalPlaces);
                } else if (fixedDecimalConfig && typeof fixedDecimalConfig === 'number') {
                    // If FixedDecimalvalue is a number, apply to all numeric columns
                    cellValue = parseFloat(cellValue).toFixed(fixedDecimalConfig);
                } else {
                    // Default behavior: show 3 decimal places
                    cellValue = parseFloat(cellValue).toFixed(3);
                }
            }

            return `<td style="${style}">${cellValue}</td>`;
        }).join('');

        let buttons = '';

        if (button == true && Array.isArray(showButtons) && showButtons.length > 0) {
            buttons = '<td>';
            if (showButtons.includes('E')) {
                buttons += ` <button class="btn btn-primary icon-height mb-1" title="Edit"><i aria-hidden="true" class="fa fa-pencil" type="button" onclick="EditData('${item.Code}')" /></i></button> `;
            }
            if (showButtons.includes('D')) {
                buttons += ` <button class="btn btn-danger icon-height mb-1" title="Delete"><i aria-hidden="true" class="fa fa-trash" type="button" onclick="DeleteData('${item.Code}')" /></i></button> `;
            }
            if (showButtons.includes('V')) {
                buttons += `<button class="btn btn-info icon-height mb-1" title="View"> <i aria-hidden="true" class="fa fa-eye" type="button" onclick="ViewData('${item.Code}')" value="View"/></i></button> `;
            }
            if (showButtons.includes('VE')) {
                buttons += `<button class="btn btn-success icon-height mb-1" title="Verify"><i class="fa fa-check" type="button" onclick="VerifyData('${item.Code}')" value="Verify"/></i></button> `;
            }
            if (showButtons.includes('A')) {
                buttons += `<button class="btn btn-warning icon-height mb-1" title="Approve"><i class="fa-check-square-o" type="button" onclick="ApproveData('${item.Code}')" value="Approve"/></i></button> `;
            }
            if (showButtons.includes('M')) {
                buttons += `<button class="btn btn-info icon-height mb-1" title="More Info"><i class="" type="button" onclick="MoreData('${item.Code}')" value="..."/></i></button> `;
            }

            buttons += '</td>';
        }

        return `<tr data-index="${index}">${row}${buttons}</tr>`;
    }).join('');

    // Add total row if totalColumns is specified and not skipping
    if (totalColumns && Array.isArray(totalColumns) && totalColumns.length > 0 && items.length > 0 && !skipTotalRow) {
        const firstItem = items[0];
        const fixedDecimalConfig = window[`fixedDecimalvalue_${bodyId}`];

        const _totalRowKeys = Object.keys(firstItem);
        const _firstVisibleTotalIdx = _totalRowKeys.findIndex(k => !window[`hiddenColumns_${bodyId}`].includes(k));
        const totalRow = _totalRowKeys.map((key, colIndex) => {
            const alignment = window[`columnAlignment_${bodyId}`][key] || 'left';
            const style = window[`hiddenColumns_${bodyId}`].includes(key)
                ? 'display:none'
                : `text-align:${alignment}`;

            let cellContent = '';

            if (colIndex === _firstVisibleTotalIdx) {
                // First visible column shows "Total" label
                cellContent = '<strong>Total</strong>';
            } else if (totalColumns.includes(key)) {
                // Show total for specified columns with appropriate decimal places
                let decimalPlaces = 3; // default
                if (fixedDecimalConfig && typeof fixedDecimalConfig === 'object' && fixedDecimalConfig.hasOwnProperty(key)) {
                    decimalPlaces = fixedDecimalConfig[key];
                } else if (fixedDecimalConfig && typeof fixedDecimalConfig === 'number') {
                    decimalPlaces = fixedDecimalConfig;
                }
                const totalValue = columnTotals[key].toFixed(decimalPlaces);
                cellContent = `<strong>${totalValue}</strong>`;
            }

            return `<td style="${style}; font-weight: bold; background-color: #f8f9fa; border-top: 2px solid #333;">${cellContent}</td>`;
        }).join('');

        let totalButtons = '';
        if (button == true && Array.isArray(showButtons) && showButtons.length > 0) {
            totalButtons = '<td style="background-color: #f8f9fa; border-top: 2px solid #333;"></td>';
        }

        rows += `<tr class="total-row">${totalRow}${totalButtons}</tr>`;
    }

    $(`#${bodyId}`).html(rows);
}
window.renderGrandTotalRow = function renderGrandTotalRow(tableId, bodyId) {
    const totalColumns = window[`totalColumns_${bodyId}`];
    const filteredData = window[`filteredData_${tableId}`];
    const isPaginated = window[`Paginator_${tableId}`];
    
    console.log('renderGrandTotalRow called:', { tableId, bodyId, isPaginated, totalColumns, dataLength: filteredData?.length });
    
    // Only render grand total if pagination is enabled and totalColumns is specified
    if (!isPaginated || !totalColumns || !Array.isArray(totalColumns) || totalColumns.length === 0 || !filteredData || filteredData.length === 0) {
        console.log('renderGrandTotalRow: Skipping grand total row', { isPaginated, hasTotalColumns: !!totalColumns, hasData: !!filteredData });
        return;
    }

    var button = window[`button_${tableId}`];
    var showButtons = window[`ShowButtons_${bodyId}`];

    // Calculate grand totals from ALL filtered data
    const grandTotals = {};
    totalColumns.forEach(colName => {
        grandTotals[colName] = 0;
    });

    filteredData.forEach(item => {
        totalColumns.forEach(colName => {
            const value = parseFloat(item[colName]);
            if (!isNaN(value) && isFinite(value)) {
                grandTotals[colName] += value;
            }
        });
    });

    console.log('Grand Totals calculated:', grandTotals);

    // Build grand total row
    const firstItem = filteredData[0];
    const fixedDecimalConfig = window[`fixedDecimalvalue_${bodyId}`];

    const _grandTotalRowKeys = Object.keys(firstItem);
    const _firstVisibleGrandIdx = _grandTotalRowKeys.findIndex(k => !window[`hiddenColumns_${bodyId}`].includes(k));
    const grandTotalRow = _grandTotalRowKeys.map((key, colIndex) => {
        const alignment = window[`columnAlignment_${bodyId}`][key] || 'left';
        const style = window[`hiddenColumns_${bodyId}`].includes(key)
            ? 'display:none'
            : `text-align:${alignment}`;

        let cellContent = '';

        if (colIndex === _firstVisibleGrandIdx) {
            // First visible column shows "Grand Total" label
            cellContent = '<strong>Grand Total</strong>';
        } else if (totalColumns.includes(key)) {
            // Show grand total for specified columns with appropriate decimal places
            let decimalPlaces = 2; // default for grand total
            if (fixedDecimalConfig && typeof fixedDecimalConfig === 'object' && fixedDecimalConfig.hasOwnProperty(key)) {
                decimalPlaces = fixedDecimalConfig[key];
            } else if (fixedDecimalConfig && typeof fixedDecimalConfig === 'number') {
                decimalPlaces = fixedDecimalConfig;
            }
            const totalValue = grandTotals[key].toFixed(decimalPlaces);
            cellContent = `<strong>${totalValue}</strong>`;
        }

        return `<td style="${style}; font-weight: bold; background-color: #d4edda; border-top: 3px solid #28a745;">${cellContent}</td>`;
    }).join('');

    let totalButtons = '';
    if (button == true && Array.isArray(showButtons) && showButtons.length > 0) {
        totalButtons = '<td style="background-color: #d4edda; border-top: 3px solid #28a745;"></td>';
    }

    const grandTotalRowHtml = `<tr class="grand-total-row">${grandTotalRow}${totalButtons}</tr>`;
    
    console.log('Appending grand total row to:', bodyId);
    // Append grand total row to tbody
    $(`#${bodyId}`).append(grandTotalRowHtml);
}
window.updatePageInfo = function updatePageInfo(tableId) {
    var filteredData = window[`filteredData_${tableId}`];
    var currentPage = window[`currentPage_${tableId}`];
    let itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    const maxPage = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    if (itemsPerPage >= filteredData.length) {
        currentPage = 1;
    } else if (currentPage > maxPage) {
        currentPage = maxPage;
    }
    window[`currentPage_${tableId}`] = currentPage;
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, filteredData.length);
    $(`#pageInfo-${tableId}`).text(`${start} – ${end} of ${filteredData.length}`);
}
window.updateButtons = function updateButtons(tableId) {
    var filteredData = window[`filteredData_${tableId}`];
    let itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    var currentPage = window[`currentPage_${tableId}`];
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    $(`#firstBtn-${tableId}, #prevBtn-${tableId}`).prop('disabled', currentPage === 1);
    $(`#nextBtn-${tableId}, #lastBtn-${tableId}`).prop('disabled', currentPage === totalPages);
}
window.renderTableWithPagination = function renderTableWithPagination(tableId, bodyId) {
    updatePageInfo(tableId);
    var filteredData = window[`filteredData_${tableId}`];
    let itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    var currentPage = window[`currentPage_${tableId}`];

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const itemsToDisplay = filteredData.slice(start, end);
    renderTable(itemsToDisplay, bodyId, false); // Pass false to show total row for current page

    // Add grand total row after paginated data (shows total of ALL data)
    renderGrandTotalRow(tableId, bodyId);

    updateButtons(tableId);
}
window.firstBtn = function firstBtn(tableId, bodyId) {
    var currentPage = window[`currentPage_${tableId}`];
    window[`currentPage_${tableId}`] = 1;
    renderTableWithPagination(tableId, bodyId);
};
window.prevBtn = function prevBtn(tableId, bodyId) {
    var currentPage = window[`currentPage_${tableId}`];

    if (currentPage > 1) {
        window[`currentPage_${tableId}`]--;
        renderTableWithPagination(tableId, bodyId);
    }
};
window.nextBtn = function nextBtn(tableId, bodyId) {
    var filteredData = window[`filteredData_${tableId}`];
    let itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    var currentPage = window[`currentPage_${tableId}`];
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
        window[`currentPage_${tableId}`]++;
        renderTableWithPagination(tableId, bodyId);
    }
};
window.lastBtn = function lastBtn(tableId, bodyId) {
    var filteredData = window[`filteredData_${tableId}`];
    var currentPage = window[`currentPage_${tableId}`];

    let itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    window[`currentPage_${tableId}`] = Math.ceil(filteredData.length / itemsPerPage);
    renderTableWithPagination(tableId, bodyId);
};
window.pageSize = function pageSize(tableId, bodyId) {
    let itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    var currentPage = window[`currentPage_${tableId}`];

    currentPage = 1;
    renderTableWithPagination(tableId, bodyId);
};
window.createPaginator = function createPaginator(tableId, bodyId) {
    $('#paginator-' + tableId).empty();
    var filterHtml = `
        <div class="page-size-select">
            <label for="pageSize-${tableId}">Lines Per Page:</label>
            <select onchange="pageSize('${tableId}','${bodyId}')" class="pageSize" id="pageSize-${tableId}">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>   
                <option value="100">100</option>   
                <option value="200">200</option>   
            </select>
        </div>
        <button id="firstBtn-${tableId}" onclick="firstBtn('${tableId}','${bodyId}')" class="btn btn-primary paginator-btn icon-height">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24" class="svg-icon">
                <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"></path>
            </svg>
        </button>
        <button id="prevBtn-${tableId}" onclick="prevBtn('${tableId}','${bodyId}')" class="btn btn-primary paginator-btn icon-height">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24" class="svg-icon">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
            </svg>
        </button>
        <span class="page-info" id="pageInfo-${tableId}">1 – 10 of 0</span>
        <button id="nextBtn-${tableId}" onclick="nextBtn('${tableId}','${bodyId}')" class="btn btn-primary paginator-btn icon-height">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24" class="svg-icon">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
            </svg>
        </button>
        <button id="lastBtn-${tableId}" onclick="lastBtn('${tableId}','${bodyId}')" class="btn btn-primary paginator-btn icon-height">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24" class="svg-icon">
                <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"></path>
            </svg>
        </button>
    `;

    $('#paginator-' + tableId).append(filterHtml);
}
window.OpenFilter = function OpenFilter(columnName, event) {
    // Prevent event from bubbling to document click handler
    if (event) {
        event.stopPropagation();
    }
    
    // Close all other filter divisions first
    $(".filter-division").hide();
    
    // Show the clicked filter division
    const escapedId = escapeId(columnName);
    $("#filterDropdown-" + escapedId).show();
}
window.CloseFilter = function CloseFilter() {
    $(".filter-division").hide();
}

