
let data = [];
let filteredData = [];
let currentPage = 1;
let itemsPerPage = 10;
let button = false;
let showButtons = [];
$(document).ready(function () {
    $('#paginator').empty();

    var filterHtml = `
                <div class="page-size-select">
                    <label for="pageSize">Lines Per Page:</label>
                    <select onchange="pageSize()" id="pageSize">
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                    </select>
                </div>
                <button id="firstBtn" onclick="firstBtn()" class="paginator-btn" ><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24">
                <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"></path></svg></button>
                <button id="prevBtn" onclick="prevBtn()" class="paginator-btn"> <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
                </svg></button>
                <span class="page-info" id="pageInfo">1 – 10 of 0</span>
                <button id="nextBtn" onclick="nextBtn()" class="paginator-btn">  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></svg></button>
                <button id="lastBtn" onclick="lastBtn()" class="paginator-btn"><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24">
                <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"></path>
                </svg></button>
                `;

    $('#paginator').append(filterHtml);
    function populateFilterOptions(columnName) {

        var uniqueValues = new Set();
        $('#table-body tr:visible').each(function () {
            var cellValue = $(this).find('td').eq($('th:contains(' + columnName + ')').index()).text().trim();
            uniqueValues.add(cellValue);
        });

        var checkboxContainer = $('#checkbox-container-' + columnName.replace(' ',''));
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
    window.toggleFilter = function (columnName) {
        closeAllFilters();
        populateFilterOptions(columnName);
        $('#filter-' + columnName.replace(' ','')).toggle();
    };
    function closeAllFilters() {
        $('.filter-dropdown').hide();
        $('.filter-input').val('');
        $('.filter-dropdown-double').hide();
        $('.checkbox-container-double').hide();
    }

    $(document).on('input', '.filter-input', function () {
        var searchValue = $(this).val().toLowerCase();
        var column = $(this).data('column');

        $('#checkbox-container-' + column + ' label').each(function () {
            var checkboxLabel = $(this).text().toLowerCase();
            $(this).toggle(checkboxLabel.includes(searchValue));
        });
    });

    $(document).click(function (event) {
        if (!$(event.target).closest('.filter-dropdown, .fa-filter').length) {
            closeAllFilters();
        }
    });

    $('.filter-dropdown').click(function (event) {
        event.stopPropagation();
    });
    function checkAllCheckboxesOnLoad() {
        $('.filter-checkbox').prop('checked', true);
    }

    checkAllCheckboxesOnLoad();
    window.toggleFilterDouble = function (columnName) {
        closeAllFiltersDouble();
        $('#filter-double-' + columnName.replace(' ','')).toggle();
        $('.filter-dropdown').hide();
        
    };

    $(document).click(function (event) {
        if (!$(event.target).closest('.filter-dropdown-double, .fa-filter').length) {
            closeAllFiltersDouble();
        }
    });
    
});

var columnFilters = {};
window.populateDateFilter = function (columnName) {
    closeAllFilters();
    $('#filter-' + columnName.replace(' ', '')).toggle();
    
    var uniqueDates = new Set();

    $('#table-body tr:visible').each(function () {
        var dateValue = $(this).find('td').eq($('th:contains(' + columnName + ')').index()).text().trim();
        if (dateValue) {
            uniqueDates.add(dateValue);
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

    var checkboxContainer1 = $('#checkbox-container-' + columnName.replace(' ', ''));
    checkboxContainer1.empty();

    checkboxContainer1.append('<label><input type="checkbox" class="filter-checkbox" value="All"> (Select All)</label>');

    for (var year in dateStructure) {
        checkboxContainer1.append(
            `<label><i class="fa-solid fa-plus toggle-icon" data-target="year-${columnName.replace(' ', '') }-${year}"></i><input type="checkbox" class="year-checkbox" value="${year}"> ${year}</label>` +
            `<div class="nested-checkbox" id="year-${columnName.replace(' ', '') }-${year}"></div>`
        );
    }

    for (var year in dateStructure) {
        for (var month in dateStructure[year]) {
            var monthCheckbox = `<label><i class="fa-solid fa-plus toggle-icon" data-target="month-${columnName.replace(' ', '') }-${year}-${month}"></i><input type="checkbox" class="month-checkbox" value="${month}"> ${month}</label>`;
            var dayCheckboxes = `<div class="nested-checkbox" id="month-${columnName.replace(' ', '')}-${year}-${month}">`;
            dateStructure[year][month].forEach(function (day) {
                dayCheckboxes += `<label><input type="checkbox" class="day-checkbox" value="${day}"> ${day}</label>`;
            });
            dayCheckboxes += '</div>';

            $('#year-' + columnName.replace(' ', '') + '-' + year).append(monthCheckbox + dayCheckboxes);
        }
    }

    checkboxContainer1.find('.year-checkbox').change(function () {
        var isChecked = $(this).is(':checked');
        var year = $(this).val();
        $('#year-' + columnName.replace(' ', '') + '-' + year + ' input[type="checkbox"]').prop('checked', isChecked);
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
        $('#' + targetId).toggle();
        $(this).toggleClass('fa-plus fa-minus');
    });
}
function applyFilters() {
    $('#table-body tr').each(function () {
        var row = $(this);
        var isVisible = true;

        Object.keys(columnFilters).forEach(function (column) {
            var selectedValues = columnFilters[column];
            var cellValue = row.find('td').eq($('th:contains(' + column + ')').index()).text().trim();
            var dateObj = new Date(cellValue);
            var year = dateObj.getFullYear();
            var month = dateObj.toLocaleString('default', { month: 'long' });
            var day = dateObj.getDate();

            var isMatch = selectedValues.includes('All') ||
                (selectedValues.includes(year.toString()) &&
                    selectedValues.includes(month) &&
                    selectedValues.includes(day.toString()));
            if (!isMatch) {
                isVisible = false;
            }
        });

        if (isVisible) {
            row.show();
        } else {
            row.hide();
        }
        $('#table-body tr:visible').each(function (index) {
            $(this).attr('data-index', index);
        });
    });
}
window.toggleFilterNumeric = function (filterId, ColumnName) {
    closeAllFilters();
    $('#' + filterId).toggle();
    toggleNumericInputs(ColumnName);
    
};
window.toggleNumericInputs = function (columnName) {
    const selectedOption = $('#numeric-filter-select-' + columnName.replace(' ','')).val();
    $('#filter-value-' + columnName.replace(' ', '')).hide();
    $('#min-value-' + columnName.replace(' ', '')).hide();
    $('#max-value-' + columnName.replace(' ', '')).hide();

    if (selectedOption === 'equals' || selectedOption === 'greater' || selectedOption === 'less') {
        $('#filter-value-' + columnName.replace(' ', '')).show();
    } else if (selectedOption === 'between') {
        $('#min-value-' + columnName.replace(' ', '')).show();
        $('#max-value-' + columnName.replace(' ', '')).show();
    }
};
window.applyNumericFilter = function (columnName) {
    const selectedOption = $('#numeric-filter-select-' + columnName.replace(' ', '')).val();
    const filterValue = parseFloat($('#filter-value-' + columnName.replace(' ', '')).val());
    const minValue = parseFloat($('#min-value-' + columnName.replace(' ', '')).val());
    const maxValue = parseFloat($('#max-value-' + columnName.replace(' ', '')).val());

    if (!isNaN(filterValue) || (!isNaN(minValue) && !isNaN(maxValue))) {
        $('#table-body tr').each(function () {
            const cellValue = parseFloat($(this).find('td').eq($('th:contains(' + columnName + ')').index()).text().trim());
            let shouldShow = false;

            switch (selectedOption) {
                case 'equals':
                    shouldShow = cellValue === filterValue;
                    break;
                case 'greater':
                    shouldShow = cellValue > filterValue;
                    break;
                case 'less':
                    shouldShow = cellValue < filterValue;
                    break;
                case 'between':
                    shouldShow = cellValue >= minValue && cellValue <= maxValue;
                    break;
            }

            $(this).toggle(shouldShow);
            $('#table-body tr:visible').each(function (index) {
                $(this).attr('data-index', index);
            });
        });
    }

    closeAllFilters();
};
function closeAllFilters() {
    $('.filter-dropdown').hide();
}
function ClearFilter() {
    $('#table-body tr').each(function () {
        $(this).show();
    });

    $('.filter-dropdown').hide();
    $('.filter-input').val('');
    $('.filter-input-double').val('');
    $('.filter-dropdown-double').hide();
    $('#table-body tr:visible').each(function (index) {
        $(this).attr('data-index', index);
    });
}
function applyStringFilters(columnName) {
    var column = columnName;
    var selectedValues = [];

    $('#checkbox-container-' + column.replace(' ','') + ' input:checked').each(function () {
        if ($(this).val() != "All") {
            selectedValues.push($(this).val());
        }
    });

    if (selectedValues.length > 0) {
        $('#table-body tr:visible').each(function () {
            var cellValue = $(this).find('td').eq($('th:contains(' + column + ')').index()).text().trim();
            if (selectedValues.includes(cellValue) || selectedValues.includes('All')) {
                $(this).show();
            } else {
                $(this).hide();
            }
            $('#table-body tr:visible').each(function (index) {
                $(this).attr('data-index', index);
            });
        });
    }
    closeAllFilters();
}
function ShowEntry(columnName) {
    var column = columnName;
    populateFilterOptionsDouble(column);
    $('#checkbox-container-double-' + column.replace(' ', '')).toggle();
}
function populateFilterOptionsDouble(columnName) {

    var uniqueValues = new Set();
    $('#table-body tr:visible').each(function () {
        var cellValue = $(this).find('td').eq($('th:contains(' + columnName + ')').index()).text().trim();
        uniqueValues.add(cellValue);
    });

    var checkboxContainer = $('#checkbox-container-double-' + columnName.replace(' ', ''));
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
function applyfilterdouble(columnName) {
    var column = columnName;
    var filterType = $('#filter-type-' + column.replace(' ', '')).val();
    var searchValue = $('.filter-input-double[data-column="' + column.replace(' ', '') + '"]').val().trim().toLowerCase();
    var selectedValues = [];


    $('#checkbox-container-double-' + column.replace(' ', '') + ' input:checked').each(function () {
        if ($(this).val() !== "All") {
            selectedValues.push($(this).val().toLowerCase());
        }
    });

    var useCheckboxFilter = selectedValues.length > 0;
    var useTextFilter = searchValue.length > 0;

    
    if (useCheckboxFilter || useTextFilter) {
        $('#table-body tr:visible').each(function () {
            var cellValue = $(this).find('td').eq($('th:contains(' + column + ')').index()).text().trim().toLowerCase();
            var showRow = false;

            if (useTextFilter) {
                if (filterType === 'startsWith' && cellValue.startsWith(searchValue)) {
                    showRow = true;
                } else if (filterType === 'endsWith' && cellValue.endsWith(searchValue)) {
                    showRow = true;
                } else if (filterType === 'like' && cellValue.includes(searchValue)) {
                    showRow = true;
                }
            }

            else if (useCheckboxFilter) {
                showRow = selectedValues.includes(cellValue);
            }

            $(this).toggle(showRow);
            $('#table-body tr:visible').each(function (index) {
                $(this).attr('data-index', index); 
            });
        });
    }
    closeAllFiltersDouble();
};
function closeAllFiltersDouble() {
    $('.filter-dropdown-double').hide();
    $('.checkbox-container-double').hide();
}
function applyfilterdate(columnName) {
    var column = columnName;
    var selectedValues = [];

    $('#checkbox-container-' + column.replace(' ', '') + ' input:checked').each(function () {
        if ($(this).val() != "All") {
            selectedValues.push($(this).val());
        }
    });

    columnFilters[column] = selectedValues;
    applyFilters();
    closeAllFilters();
}
function CreateDataTable(data, Button, ShowButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn) {
    const columns = Object.keys(data[0]);
    renderTableHeader(columns, Button,StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn);
    renderTable(data);
    button = Button;
    showButtons = ShowButtons;
    filteredData = data;
    renderTableWithPagination();
}
function renderTableHeader(columns, button ,StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn) {
    const $header = $('#table-header');
    $header.empty();
    let headerRow = '<tr>';
    columns.forEach(col => {
        let filterHtml = '';
        if (StringFilterColumn.includes(col)) {
            filterHtml = `<th>
                                         <div style="display: flex; justify-content: space-between; align-items: center;">
                                           ${col}
                                            <span style="display: flex;">
                                            <span onclick="sortable(this)" data-column="${col.replace(' ','')}" data-order="asc" style="display: flex;">
                                            <i class="fa-solid fa-arrow-down sort-indicator" style="display:none;"></i>
                                            <i class="fa-solid fa-arrow-up sort-indicator" style="display:block;"></i>
                                            </span><i class="fa-solid fa-filter" onclick="toggleFilter('${col}')"></i>
                                            </span>
                                            <div class="filter-dropdown" id="filter-${col.replace(' ', '')}">
                                            <input type="text" placeholder="Search..." class="filter-input" data-column="${col.replace(' ', '')}" />
                                            <div class="checkbox-container" id="checkbox-container-${col.replace(' ', '')}"></div>
                                            <button onclick="applyStringFilters('${col}')" data-column="${col.replace(' ', '')}">apply</button>
                                            <button onclick="ClearFilter('${col.replace(' ', '')}')">Clear</button>
                                            </div>
                                           </div>
                                     </th>`;
        } else if (NumericFilterColumn.includes(col)) {
            filterHtml = `<th>
                                         <div style="display: flex; justify-content: space-between; align-items: center;">
                                              ${col}
                                              <span style="display: flex;">
                                              <span onclick="sortable(this)" data-column="${col.replace(' ', '')}" data-order="asc" style="display: flex;">
                                              <i class="fa-solid fa-arrow-down sort-indicator" style="display:none;"></i>
                                              <i class="fa-solid fa-arrow-up sort-indicator" style="display:block;"></i>
                                              </span><i class="fa-solid fa-filter" onclick="toggleFilterNumeric('filter-dropdown-numeric-${col.replace(' ','')}','${col}');"></i>
                                              </span>
                                          </div>
                                         <div class="filter-dropdown" id="filter-dropdown-numeric-${col.replace(' ', '')}">
                                          <select id="numeric-filter-select-${col.replace(' ', '')}" onchange="toggleNumericInputs('${col}')">
                                                <option value="equals">=</option>
                                                <option value="greater">></option>
                                                <option value="less">&lt;</option>
                                                <option value="between">Between</option>
                                            </select>
                                            <div class="filter-inputs">
                                                <input type="number" id="filter-value-${col.replace(' ', '')}" class="filter-input" placeholder="Enter value" />
                                                <input type="number" id="min-value-${col.replace(' ', '')}" class="filter-input" placeholder="Min value" style="display:none" />
                                                <input type="number" id="max-value-${col.replace(' ', '')}" class="filter-input" placeholder="Max value" style="display:none" />
                                            </div>
                                            <button onclick="applyNumericFilter('${col}')">Apply</button>
                                            <button onclick="ClearFilter()">Clear</button>
                                         </div>
                                         </th>`;
        } else if (DateFilterColumn.includes(col)) {
            filterHtml = ` <th>
                                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                                ${col}
                                                <span style="display: flex;">
                                                <span onclick="sortable(this)" data-column="${col.replace(' ', '') }" data-order="asc" style="display: flex;">
                                                <i class="fa-solid fa-arrow-down sort-indicator" style="display:none;"></i>
                                                <i class="fa-solid fa-arrow-up sort-indicator" style="display:block;"></i>
                                                </span>
                                                <i class="fa-solid fa-filter" onclick="populateDateFilter('${col}')"></i>
                                                </span>
                                            </div>
                                            <div class="filter-dropdown" id="filter-${col.replace(' ', '') }">
                                            <div class="checkbox-container" id="checkbox-container-${col.replace(' ', '') }"></div>
                                            <button onclick="applyfilterdate('${col}')" data-column="${col.replace(' ', '') }">Apply</button>
                                            <button onclick="ClearFilter()">Clear</button>
                                            </div>
                                       </th>`;
        } else if (StringdoubleFilterColumn.includes(col)) {
            filterHtml = `<th>
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            ${col}
                                            <span style="display: flex;">
                                            <span onclick="sortable(this)" data-column="${col.replace(' ', '') }" data-order="asc" style="display: flex;">
                                            <i class="fa-solid fa-arrow-down sort-indicator" style="display:none;"></i>
                                            <i class="fa-solid fa-arrow-up sort-indicator" style="display:block;"></i>
                                            </span><i class="fa-solid fa-filter" onclick="toggleFilterDouble('${col}')"></i>
                                            </span>
                                           </div>
                                        <div class="filter-dropdown-double" onclick="stopPropagationdouble(event)" id="filter-double-${col.replace(' ', '') }">
                                         <select class="filter-type" id="filter-type-${col.replace(' ', '') }">
                                            <option value="like">Between</option>
                                            <option value="startsWith">Starts With</option>
                                            <option value="endsWith">Ends With</option>
                                        </select>
                                        <input type="text" placeholder="Search..." class="filter-input-double" data-column="${col.replace(' ', '') }" />
                                        <div class="checkbox-container-double" id="checkbox-container-double-${col.replace(' ', '') }"></div>
                                        <button onclick="applyfilterdouble('${col}')" data-column="${col.replace(' ', '') }">Apply</button>
                                        <button onclick="ShowEntry('${col}')" data-column="${col.replace(' ', '') }">Show Entries</button>
                                        <button onclick="ClearFilter()">Clear</button>
                                        </div>
                                    </th>`;
        }
        else {
            filterHtml = `<th>${col}</th>`;
        }
        headerRow += `${filterHtml}`;
    });
    if (button) {
        headerRow += '<th>Action</th></tr>';
    } else {
        headerRow += '</tr>';
    }
    $header.append(headerRow);
}
function renderTable(dataToRender, columns) {
    const $tbody = $('#table tbody');
    $tbody.empty();
    dataToRender.forEach(item => {
        let row = '<tr>';
        columns.forEach(col => {
            row += `<td>${item[col] || ''}</td>`;
        });
        row += '</tr>';
        $tbody.append(row);
    });
}
function sortable(element) {
    var column = $(element).data('column');
    var index = $(element).closest('th').index();
    var order = $(element).data('order');
    order = order === 'asc' ? 'desc' : 'asc';
    $(element).data('order', order);

    $(element).find('.sort-indicator').hide();

    if ($(element).find('.sort-indicator').length === 0) {
        $(element).append('<i class="fa-solid fa-arrow-down sort-indicator"></i>');
        $(element).append('<i class="fa-solid fa-arrow-up sort-indicator"></i>');
    }

    if (order === 'asc') {
        $(element).find('.fa-arrow-up').show();
        $(element).find('.fa-arrow-down').hide();
    } else {
        $(element).find('.fa-arrow-up').hide();
        $(element).find('.fa-arrow-down').show();
    }

    sortTable(index, order);
};
function sortTable(columnIndex, order) {
    var rows = $('#table-body tr').get();
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
        $('#table-body').append(row);
    });
}
function stopPropagationdouble(event) {
    event.stopPropagation();
};
//function renderTable(items) {
//    const rows = items.map((item, index) => {
//        const row = Object.values(item).map(val => `<td>${val}</td>`).join('');
//        if (button) {
//            return `<tr data-index="${index}">${row}<td>
//                <input class="btn btn-primary" type="button" onclick="EditData('${item.Code}')" value="Edit"/>
//                <input type="button" class="btn btn-danger" onclick="DeleteData('${item.Code}')" value="Delete">
//                <input type="button" class="btn btn-info" onclick="ViewData('${item.Code}')" value="View"/>
//            </td></tr>`;
//        } else {
//            return `<tr data-index="${index}">${row}</tr>`;
//        }
//    }).join('');

//    $('#table-body').html(rows);
//}
//function renderTable(items, showButtons) {
//    const rows = items.map((item, index) => {
//        const row = Object.values(item).map(val => `<td>${val}</td>`).join('');
//        const buttons = showButtons.length > 0 ? `<td>${showButtons.join('')}</td>` : '';
//        return `<tr data-index="${index}">${row}${buttons}</tr>`;
//    }).join('');

//    $('#table-body').html(rows);
//}
function renderTable(items) {

    const rows = items.map((item, index) => {
        const row = Object.values(item).map(val => `<td>${val}</td>`).join('');

        let buttons = '';

        if (Array.isArray(showButtons) && showButtons.length > 0) {
            buttons = '<td>';

            if (showButtons.includes('E')) {
                buttons += `<input class="btn btn-primary" type="button" onclick="EditData('${item.Code}')" value="Edit"/> `;
            }
            if (showButtons.includes('D')) {
                buttons += `<input class="btn btn-danger" type="button" onclick="DeleteData('${item.Code}')" value="Delete"/> `;
            }
            if (showButtons.includes('V')) {
                buttons += `<input class="btn btn-info" type="button" onclick="ViewData('${item.Code}')" value="View"/> `;
            }
            if (showButtons.includes('VE')) {
                buttons += `<input class="btn btn-success" type="button" onclick="ViewData('${item.Code}')" value="View"/> `;
            }
            if (showButtons.includes('M')) {
                buttons += `<input class="btn btn-info" type="button" onclick="MoreData('${item.Code}')" value="More.."/> `;
            }

            buttons += '</td>';
        }

        return `<tr data-index="${index}">${row}${buttons}</tr>`;
    }).join('');

    $('#table-body').html(rows);
}
function updatePageInfo() {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, filteredData.length);
    $('#pageInfo').text(`${start} – ${end} of ${filteredData.length}`);
}
function updateButtons() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    $('#firstBtn, #prevBtn').prop('disabled', currentPage === 1);
    $('#nextBtn, #lastBtn').prop('disabled', currentPage === totalPages);
}
function renderTableWithPagination() {
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const itemsToDisplay = filteredData.slice(start, end);

    renderTable(itemsToDisplay);
    updatePageInfo();
    updateButtons();
}
function firstBtn() {
    currentPage = 1;
    renderTableWithPagination();
};
function prevBtn() {
    if (currentPage > 1) {
        currentPage--;
        renderTableWithPagination();
    }
};
function nextBtn() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTableWithPagination();
   }
};
function lastBtn() {
    currentPage = Math.ceil(filteredData.length / itemsPerPage);
    renderTableWithPagination();
};
function pageSize() {
    itemsPerPage = parseInt($("#pageSize").val());
    currentPage = 1;
    renderTableWithPagination();
};