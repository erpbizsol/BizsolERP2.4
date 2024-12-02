
let data = [];
let filteredData = [];
let currentPage = 1;
let itemsPerPage = 5;
let button = false;
let showButtons = [];
let hiddenColumns = [];
let columnAlignment = [];
const BizsolCustomFilterGrid = {
    CreateDataTable: function CreateDataTable(headerId, bodyId, data, Button, ShowButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, HiddenColumns, ColumnAlignment) {
        const columns = Object.keys(data[0]);
        const tableId = $('#' + bodyId).closest('table').attr('id');
        renderTableHeader(HiddenColumns, headerId, bodyId, columns, Button, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn);
        hiddenColumns = HiddenColumns;
        columnAlignment = ColumnAlignment;
        renderTable(data, bodyId);
        button = Button;
        showButtons = ShowButtons;
        filteredData = data;
        bodyId = bodyId;
        createPaginator(tableId, bodyId);
        renderTableWithPagination(tableId, bodyId);
    }

}
window.BizsolCustomFilterGrid = BizsolCustomFilterGrid;
//$(document).ready(function () {
    function populateFilterOptions(columnName,bodyId) {

        var uniqueValues = new Set();
        $(`#${bodyId} tr:visible`).each(function () {
            var cellValue = $(this).find('td').eq($('th:contains(' + columnName + ')').index()).text().trim();
            uniqueValues.add(cellValue);
        });

        var checkboxContainer = $('#checkbox-container-' + columnName.replace(/\s+/g, ''));
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
        $('#filter-' + columnName.replace(/\s+/g, '')).toggle();
        $('#filterDropdown-' + columnName.replace(/\s+/g, '')).toggle();
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
        if (!$(event.target).closest('.filter-dropdown, .fafilter').length) {
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
        $('#filter-double-' + columnName.replace(/\s+/g, '')).toggle();
        $('.filter-dropdown').hide();
        $('#filterDropdown-' + columnName.replace(/\s+/g, '')).toggle();
    };

    $(document).click(function (event) {
        if (!$(event.target).closest('.filter-dropdown-double, .fafilter,.filter-division').length) {
            closeAllFiltersDouble();
        }
    });
    
//});

var columnFilters = {};
window.populateDateFilter = function (columnName, bodyId) {
    closeAllFilters();
    closeAllFiltersDouble();
    $('#filter-' + columnName.replace(/\s+/g, '')).toggle();
    $('#filterDropdown-' + columnName.replace(/\s+/g, '')).toggle();

    
    var uniqueDates = new Set();

    $(`#${bodyId} tr:visible`).each(function () {
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

    var checkboxContainer1 = $('#checkbox-container-' + columnName.replace(/\s+/g, ''));
    checkboxContainer1.empty();

    checkboxContainer1.append('<label><input type="checkbox" class="filter-checkbox" value="All"> (Select All)</label>');

    for (var year in dateStructure) {
        checkboxContainer1.append(
            `<label><i class="fa-solid fa-plus toggle-icon" data-target="year-${columnName.replace(/\s+/g, '') }-${year}"></i><input type="checkbox" class="year-checkbox" value="${year}"> ${year}</label>` +
            `<div class="nested-checkbox" id="year-${columnName.replace(/\s+/g, '') }-${year}"></div>`
        );
    }

    for (var year in dateStructure) {
        for (var month in dateStructure[year]) {
            var monthCheckbox = `<label><i class="fa-solid fa-plus toggle-icon" data-target="month-${columnName.replace(/\s+/g, '') }-${year}-${month}"></i><input type="checkbox" class="month-checkbox" value="${month}"> ${month}</label>`;
            var dayCheckboxes = `<div class="nested-checkbox" id="month-${columnName.replace(/\s+/g, '') }-${year}-${month}">`;
            dateStructure[year][month].forEach(function (day) {
                dayCheckboxes += `<label><input type="checkbox" class="day-checkbox" value="${day}"> ${day}</label>`;
            });
            dayCheckboxes += '</div>';

            $('#year-' + columnName.replace(/\s+/g, '') + '-' + year).append(monthCheckbox + dayCheckboxes);
        }
    }

    checkboxContainer1.find('.year-checkbox').change(function () {
        var isChecked = $(this).is(':checked');
        var year = $(this).val();
        $('#year-' + columnName.replace(/\s+/g, '') + '-' + year + ' input[type="checkbox"]').prop('checked', isChecked);
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
function applyFilters(bodyId) {
    $(`#${bodyId} tr`).each(function () {
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
        $(`#${bodyId} tr:visible`).each(function (index) {
            $(this).attr('data-index', index);
        });
    });
}
window.toggleFilterNumeric = function (filterId, ColumnName) {
    closeAllFilters();
    closeAllFiltersDouble();
    $('#filterDropdown-' + ColumnName.replace(/\s+/g, '')).toggle();
    $('#' + filterId).toggle();
    toggleNumericInputs(ColumnName);

    
};
window.toggleNumericInputs = function (columnName) {
    const selectedOption = $('#numeric-filter-select-' + columnName.replace(/\s+/g, '')).val();
    $('#filter-value-' + columnName.replace(/\s+/g, '')).hide();
    $('#min-value-' + columnName.replace(/\s+/g, '')).hide();
    $('#max-value-' + columnName.replace(/\s+/g, '')).hide();

    if (selectedOption === 'equals' || selectedOption === 'greater' || selectedOption === 'less') {
        $('#filter-value-' + columnName.replace(/\s+/g, '')).show();
    } else if (selectedOption === 'between') {
        $('#min-value-' + columnName.replace(/\s+/g, '')).show();
        $('#max-value-' + columnName.replace(/\s+/g, '')).show();
    }
};
window.applyNumericFilter = function (columnName, bodyId) {
    const selectedOption = $('#numeric-filter-select-' + columnName.replace(/\s+/g, '')).val();
    const filterValue = parseFloat($('#filter-value-' + columnName.replace(/\s+/g, '')).val());
    const minValue = parseFloat($('#min-value-' + columnName.replace(/\s+/g, '')).val());
    const maxValue = parseFloat($('#max-value-' + columnName.replace(/\s+/g, '')).val());

    if (!isNaN(filterValue) || (!isNaN(minValue) && !isNaN(maxValue))) {
        $(`#${bodyId} tr`).each(function () {
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
            $(`#${bodyId} tr:visible`).each(function (index) {
                $(this).attr('data-index', index);
            });
        });
    }

    closeAllFilters();
};
function closeAllFilters() {
    $('.filter-dropdown').hide();
}
function ClearFilter(bodyId) {
    $(`#${bodyId} tr`).each(function () {
        $(this).show();
    });

    $('.filter-dropdown').hide();
    $('.filter-input').val('');
    $('.filter-input-double').val('');
    $('.filter-dropdown-double').hide();
    $(`#${bodyId} tr:visible`).each(function (index) {
        $(this).attr('data-index', index);
    });
}
function applyStringFilters(columnName, bodyId) {
    var column = columnName;
    var selectedValues = [];

    $('#checkbox-container-' + column.replace(/\s+/g, '') + ' input:checked').each(function () {
        if ($(this).val() != "All") {
            selectedValues.push($(this).val());
        }
    });

    if (selectedValues.length > 0) {
        $(`#${bodyId} tr:visible`).each(function () {
            var cellValue = $(this).find('td').eq($('th:contains(' + column + ')').index()).text().trim();
            if (selectedValues.includes(cellValue) || selectedValues.includes('All')) {
                $(this).show();
            } else {
                $(this).hide();
            }
            $(`#${bodyId} tr:visible`).each(function (index) {
                $(this).attr('data-index', index);
            });
        });
    }
    closeAllFilters();
}
function ShowEntry(columnName, bodyId) {
    var column = columnName;
    populateFilterOptionsDouble(column, bodyId);
    $('#checkbox-container-double-' + column.replace(/\s+/g, '')).toggle();
}
function populateFilterOptionsDouble(columnName, bodyId) {
    var uniqueValues = new Set();
    $(`#${bodyId} tr:visible`).each(function () {
        var cellValue = $(this).find('td').eq($('th:contains(' + columnName + ')').index()).text().trim();
        uniqueValues.add(cellValue);
    });

    var checkboxContainer = $('#checkbox-container-double-' + columnName.replace(/\s+/g, ''));
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
function applyfilterdouble(columnName, bodyId) {
    var column = columnName;
    var filterType = $('#filter-type-' + column.replace(/\s+/g, '')).val();
    var searchValue = $('.filter-input-double[data-column="' + column.replace(/\s+/g, '') + '"]').val().trim().toLowerCase();
    var selectedValues = [];


    $('#checkbox-container-double-' + column.replace(/\s+/g, '') + ' input:checked').each(function () {
        if ($(this).val() !== "All") {
            selectedValues.push($(this).val().toLowerCase());
        }
    });

    var useCheckboxFilter = selectedValues.length > 0;
    var useTextFilter = searchValue.length > 0;

    
    if (useCheckboxFilter || useTextFilter) {
        $(`#${bodyId} tr:visible`).each(function () {
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
            $(`#${bodyId} tr:visible`).each(function (index) {
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
function applyfilterdate(columnName, bodyId) {
    var column = columnName;
    var selectedValues = [];

    $('#checkbox-container-' + column.replace(/\s+/g, '') + ' input:checked').each(function () {
        if ($(this).val() != "All") {
            selectedValues.push($(this).val());
        }
    });

    columnFilters[column] = selectedValues;
    applyFilters(bodyId);
    closeAllFilters();
}
function renderTableHeader(hiddenColumns,headerId,bodyId,columns, button ,StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn) {
    const $header = $(`#${headerId}`);
    $header.empty();
    let headerRow = '<tr>';
    columns.forEach(col => {
        let filterHtml = '';
        if (StringFilterColumn.includes(col)) {
            filterHtml = `<th>
                                         <div class="filter-table-heading-div">
                                          <span class="filter-table-heading">${col}</span>
                                            <span class="table-filter-arrow">
                                              <i class="fa-solid fa-angle-down" onclick="OpenFilter('${col.replace(/\s+/g, '') }')" style="cursor: pointer;"></i>
                                            </span>
                                              <div class="filter-division" id="filterDropdown-${col.replace(/\s+/g, '') }" style="display:none;">
                                                <div class="dropdown-content">
                                                  <div class="dropdown-item" onclick="sortable(this)" data-column="${col.replace(/\s+/g, '') }" data-order="asc">
                                                    <i class="fa-solid fa-arrow-up-a-z sort-indicator sort-indicator-color"></i> Ascending
                                                  </div>
                                                  <div class="dropdown-item" onclick="sortable(this)" data-column="${col.replace(/\s+/g, '') }" data-order="desc">
                                                    <i class="fa-solid fa-arrow-down-z-a sort-indicator sort-indicator-color"></i> Descending
                                                  </div>
                                                  <div class="dropdown-item fafilter" onclick="toggleFilter('${col}','${bodyId}')">
                                                    <i class="fa-solid fa-filter  sort-indicator-color"></i> Filter...
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                            <div class="filter-dropdown" id="filter-${col.replace(/\s+/g, '') }">
                                            <input type="text" placeholder="Search..." class="filter-input" data-column="${col.replace(/\s+/g, '') }" />
                                            <div class="checkbox-container" id="checkbox-container-${col.replace(/\s+/g, '') }"></div>
                                            <button class="btn btn-success btn-height" onclick="applyStringFilters('${col}','${bodyId}')" data-column="${col.replace(/\s+/g, '') }">apply</button>
                                            <button class="btn btn-success btn-height" onclick="ClearFilter('${bodyId}')">Clear</button>
                                            </div>
                                           </div>
                                     </th>`;
        } else if (NumericFilterColumn.includes(col)) {
            filterHtml = `<th>
                                         <div class="filter-table-heading-div">
                                              <span class="filter-table-heading">${col}</span>
                                              <span class="table-filter-arrow">
                                                  <i class="fa-solid fa-angle-down" onclick="OpenFilter('${col.replace(/\s+/g, '') }')" style="cursor: pointer;"></i>
                                                </span>
                                                  <div class="filter-division" id="filterDropdown-${col.replace(/\s+/g, '') }" style="display:none;">
                                                    <div class="dropdown-content">
                                                      <div class="dropdown-item" onclick="sortable(this)" data-column="${col.replace(/\s+/g, '') }" data-order="asc">
                                                        <i class="fa-solid fa-arrow-up-a-z sort-indicator  sort-indicator-color"></i> Ascending
                                                      </div>
                                                      <div class="dropdown-item" onclick="sortable(this)" data-column="${col.replace(/\s+/g, '') }" data-order="desc">
                                                        <i class="fa-solid fa-arrow-down-z-a sort-indicator  sort-indicator-color"></i> Descending
                                                      </div>
                                                      <div class="dropdown-item fafilter" onclick="toggleFilterNumeric('filter-dropdown-numeric-${col.replace(/\s+/g, '') }','${col}');">
                                                        <i class="fa-solid fa-filter  sort-indicator-color"></i> Filter...
                                                      </div>
                                                    </div>
                                                  </div>
                                               </div>
                                         <div class="filter-dropdown" id="filter-dropdown-numeric-${col.replace(/\s+/g, '') }">
                                          <select id="numeric-filter-select-${col.replace(/\s+/g, '') }" onchange="toggleNumericInputs('${col}')">
                                                <option value="equals">=</option>
                                                <option value="greater">></option>
                                                <option value="less">&lt;</option>
                                                <option value="between">Between</option>
                                            </select>
                                            <div class="filter-inputs">
                                                <input type="number" id="filter-value-${col.replace(/\s+/g, '') }" class="filter-input form-control form-control-sm" placeholder="Enter value" />
                                                <input type="number" id="min-value-${col.replace(/\s+/g, '') }" class="filter-input form-control form-control-sm" placeholder="Min value" style="display:none" />
                                                <input type="number" id="max-value-${col.replace(/\s+/g, '') }" class="filter-input form-control form-control-sm" placeholder="Max value" style="display:none" />
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
                                                  <i class="fa-solid fa-angle-down" onclick="OpenFilter('${col.replace(/\s+/g, '') }')" style="cursor: pointer;"></i>
                                                </span>
                                                  <div class="filter-division" id="filterDropdown-${col.replace(/\s+/g, '') }" style="display:none;">
                                                    <div class="dropdown-content">
                                                      <div class="dropdown-item" onclick="sortable(this)" data-column="${col.replace(/\s+/g, '') }" data-order="asc">
                                                        <i class="fa-solid fa-arrow-up-a-z sort-indicator  sort-indicator-color"></i> Ascending
                                                      </div>
                                                      <div class="dropdown-item" onclick="sortable(this)" data-column="${col.replace(/\s+/g, '') }" data-order="desc">
                                                        <i class="fa-solid fa-arrow-down-z-a sort-indicator  sort-indicator-color"></i> Descending
                                                      </div>
                                                      <div class="dropdown-item fafilter" onclick="populateDateFilter('${col}','${bodyId}')">
                                                        <i class="fa-solid fa-filter  sort-indicator-color"></i> Filter...
                                                      </div>
                                                    </div>
                                                  </div>
                                               </div>
                                            <div class="filter-dropdown" id="filter-${col.replace(/\s+/g, '') }">
                                            <div class="checkbox-container" id="checkbox-container-${col.replace(/\s+/g, '') }"></div>
                                            <button class="btn btn-success btn-height" onclick="applyfilterdate('${col}','${bodyId}')" data-column="${col.replace(/\s+/g, '') }">Apply</button>
                                            <button class="btn btn-success btn-height" onclick="ClearFilter('${bodyId}')">Clear</button>
                                            </div>
                                       </th>`;
        } else if (StringdoubleFilterColumn.includes(col)) {
            filterHtml = `<th>
                                           <div class="filter-table-heading-div">
                                         <span class="filter-table-heading">${col}</span>
                                         <span class="table-filter-arrow">
                                             <i class="fa-solid fa-angle-down" onclick="OpenFilter('${col.replace(/\s+/g, '') }')" style="cursor: pointer;"></i>
                                           </span>
                                             <div class="filter-division" onclick="stopPropagationdouble(event)" id="filterDropdown-${col.replace(/\s+/g, '') }" style="display:none;">
                                               <div class="dropdown-content">
                                                 <div class="dropdown-item" onclick="sortable(this)" data-column="${col.replace(/\s+/g, '') }" data-order="asc">
                                                   <i class="fa-solid fa-arrow-up-a-z sort-indicator  sort-indicator-color"></i> Ascending
                                                 </div>
                                                 <div class="dropdown-item" onclick="sortable(this)" data-column="${col.replace(/\s+/g, '') }" data-order="desc">
                                                   <i class="fa-solid fa-arrow-down-z-a sort-indicator  sort-indicator-color"></i> Descending
                                                 </div>
                                                 <div class="dropdown-item fafilter" onclick="toggleFilterDouble('${col}','${bodyId}')">
                                                   <i class="fa-solid fa-filter  sort-indicator-color"></i> Filter...
                                                 </div>
                                               </div>
                                             </div>
                                          </div>
                                        <div class="filter-dropdown-double" onclick="stopPropagationdouble(event)" id="filter-double-${col.replace(/\s+/g, '') }">
                                         <select class="filter-type" id="filter-type-${col.replace(/\s+/g, '') }">
                                            <option value="startsWith">Starts With</option>
                                            <option value="endsWith">Ends With</option>
                                            <option value="like">Between</option>
                                        </select>
                                        <input type="text" placeholder="Search..." class="filter-input-double form-control form-control-sm" data-column="${col.replace(/\s+/g, '') }" />
                                        <div class="checkbox-container-double" id="checkbox-container-double-${col.replace(/\s+/g, '') }"></div>
                                        <button class="btn btn-success btn-height" onclick="applyfilterdouble('${col}','${bodyId}')" data-column="${col.replace(/\s+/g, '') }">Apply</button>
                                        <button class="btn btn-primary btn-height" onclick="ShowEntry('${col}','${bodyId}')" data-column="${col.replace(/\s+/g, '') }">Show Entries</button>
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
//function renderTable(dataToRender, columns) {
//    const $tbody = $('#table tbody');
//    $tbody.empty();
//    dataToRender.forEach(item => {
//        let row = '<tr>';
//        columns.forEach(col => {
//            row += `<td>${item[col] || ''}</td>`;
//        });
//        row += '</tr>';
//        $tbody.append(row);
//    });
//}
function sortable(element) {

    var column = $(element).data('column');
    var index = $(element).closest('th').index();
    var order = $(element).data('order');
    var tbodyId = $(element).closest('table').find('tbody').attr('id');
    //order = order === 'asc' ? 'desc' : 'asc';
    $(element).data('order', order);

    //$(element).find('.sort-indicator').hide();

    //if ($(element).find('.sort-indicator').length === 0) {
    //    $(element).append('<i class="fa-solid fa-arrow-down sort-indicator"></i>');
    //    $(element).append('<i class="fa-solid fa-arrow-up sort-indicator"></i>');
    //}

    //if (order === 'asc') {
    //    $(element).find('.fa-arrow-up').show();
    //    $(element).find('.fa-arrow-down').hide();
    //} else {
    //    $(element).find('.fa-arrow-up').hide();
    //    $(element).find('.fa-arrow-down').show();
    //}

    sortTable(index, order, tbodyId);
};
function sortTable(columnIndex, order, tbodyId) {
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
function stopPropagationdouble(event) {
    event.stopPropagation();
};
function renderTable(items,bodyId) {
    const rows = items.map((item, index) => {
        const row = Object.keys(item).map((key) => {
            const alignment = columnAlignment[key] || 'left';
            const style = hiddenColumns.includes(key)
                ? 'display:none'
                : `text-align:${alignment}`;

            return `<td style="${style}">${item[key]}</td>`;
        }).join('');

        let buttons = '';

        if (Array.isArray(showButtons) && showButtons.length > 0) {
            buttons = '<td>';

            //if (showButtons.includes('E')) {
            //    buttons += `<input class="btn btn-primary btn-height mb-1" type="button" onclick="EditData('${item.Code}')" value="Edit"/> `;
            //}

            if (showButtons.includes('E')) {
                buttons += ` <button class="btn btn-primary icon-height mb-1"><i aria-hidden="true" class="fa fa-pencil" type="button" onclick="EditData('${item.Code}')" /></i></button> `;
            }
            if (showButtons.includes('D')) {
                buttons += ` <button class="btn btn-danger icon-height mb-1"><i aria-hidden="true" class="fa fa-trash" type="button" onclick="DeleteData('${item.Code}')" /></i></button> `;
            }
            if (showButtons.includes('V')) {
                buttons += `<button class="btn btn-info icon-height mb-1"> <i aria-hidden="true" class="fa fa-eye" type="button" onclick="ViewData('${item.Code}')" value="View"/></i></button> `;
            }
            if (showButtons.includes('VE')) {
                buttons += `<button class="btn btn-success icon-height mb-1"><i class="fa fa-check" type="button" onclick="VerifyData('${item.Code}')" value="Verify"/></i></button> `;
            }
            if (showButtons.includes('A')) {
                buttons += `<button class="btn btn-warning icon-height mb-1"><i class="fa fa-check-square-o" type="button" onclick="ApproveData('${item.Code}')" value="Approve"/></i></button> `;
            }
            if (showButtons.includes('M')) {
                buttons += `<button class="btn btn-info icon-height mb-1"><i class="" type="button" onclick="MoreData('${item.Code}')" value="..."/></i></button> `;
            }

            buttons += '</td>';
        }

        return `<tr data-index="${index}">${row}${buttons}</tr>`;
    }).join('');

    $(`#${bodyId}`).html(rows);
}
//function updatePageInfo(tableId) {
//    const start = (currentPage - 1) * itemsPerPage + 1;
//    const end = Math.min(start + itemsPerPage - 1, filteredData.length);
//    $('#pageInfo').text(`${start} – ${end} of ${filteredData.length}`);
//}
//function updateButtons() {
//    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
//    $('#firstBtn, #prevBtn').prop('disabled', currentPage === 1);
//    $('#nextBtn, #lastBtn').prop('disabled', currentPage === totalPages);
//}
function updatePageInfo(tableId) {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, filteredData.length);
    $(`#pageInfo-${tableId}`).text(`${start} – ${end} of ${filteredData.length}`);
}
function updateButtons(tableId) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    $(`#firstBtn-${tableId}, #prevBtn-${tableId}`).prop('disabled', currentPage === 1);
    $(`#nextBtn-${tableId}, #lastBtn-${tableId}`).prop('disabled', currentPage === totalPages);
}
function renderTableWithPagination(tableId, bodyId) {
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const itemsToDisplay = filteredData.slice(start, end);

    renderTable(itemsToDisplay,bodyId);
    updatePageInfo(tableId);
    updateButtons(tableId);
}
function firstBtn(tableId,bodyId) {
    currentPage = 1;
    renderTableWithPagination(tableId, bodyId);
};
function prevBtn(tableId, bodyId) {
    if (currentPage > 1) {
        currentPage--;
        renderTableWithPagination(tableId, bodyId);
    }
};
function nextBtn(tableId, bodyId) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTableWithPagination(tableId, bodyId);
   }
};
function lastBtn(tableId, bodyId) {
    currentPage = Math.ceil(filteredData.length / itemsPerPage);
    renderTableWithPagination(tableId, bodyId);
};
function pageSize(tableId, bodyId) {
    //itemsPerPage = parseInt($("#pageSize-tableId").val());
    itemsPerPage = parseInt($(`#pageSize-${tableId}`).val());
    currentPage = 1;
    renderTableWithPagination(tableId, bodyId);
};

function createPaginator(tableId, bodyId) {
    $('#paginator-' + tableId).empty();
    var filterHtml = `
        <div class="page-size-select">
            <label for="pageSize-${tableId}">Lines Per Page:</label>
            <select onchange="pageSize('${tableId}','${bodyId}')" class="pageSize" id="pageSize-${tableId}">
            <option value="5">5</option>   
            <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
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

function OpenFilter(columnName) {
    $(".filter-division").hide();
    $("#filterDropdown-" + columnName).show();
}
function CloseFilter() {
    $(".filter-division").hide();
}
