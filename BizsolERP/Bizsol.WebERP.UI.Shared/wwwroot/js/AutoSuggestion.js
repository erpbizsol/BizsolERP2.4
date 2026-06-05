// Import multi-select controller
// import { MultiAutoSuggestionControl } from './MultiAutoSuggestion.js';

const AutoSuggestionControl = {
    SetUpAutoSuggestion: function SetUpAutoSuggestion(AutoSuggestionInputElement, AutoSuggestionListElement, data, serachMode, IsEnableBizSolhandleEnterKey=true, onSelect, IsEnableMultiSelectOption = false) {
        if (IsEnableMultiSelectOption === true) {
            populateMultiAutoSuggestionList(data, AutoSuggestionListElement);
            setupMultiSearchFunction(AutoSuggestionInputElement, AutoSuggestionListElement, IsEnableBizSolhandleEnterKey, data, onSelect);
            return;
        }

        populateAutoSuggestionList(data, AutoSuggestionListElement);
        setupSearchFunction(AutoSuggestionInputElement, AutoSuggestionListElement, IsEnableBizSolhandleEnterKey, data, onSelect);
    }
}   

export { AutoSuggestionControl }

var AutoSuggestionListId = '';
var MultiAutoSuggestionListId = '';
var selectedItems = [];

function populateAutoSuggestionList(data, AutoSuggestionListElement) {
    const AutoSuggestionList = AutoSuggestionListElement;
    AutoSuggestionList.empty();

    const uniqueDataItem = new Set();
    data.forEach(item => {
        if (item['Desp']) {
            uniqueDataItem.add(item['Desp']);
        }
    });

    uniqueDataItem.forEach(item => {
        AutoSuggestionList.append(`<li>${item}</li>`);
    });
    AutoSuggestionListId = AutoSuggestionListElement[0].id;
}

function setupSearchFunction(AutoSuggestionInputElement, AutoSuggestionListElement, IsEnableBizSolhandleEnterKey = true, data = [], onSelect) {
    const AutoSuggestionInput = AutoSuggestionInputElement;
    const AutoSuggestionList = AutoSuggestionListElement;
    let currentIndex = -1;

    // Trigger on focus
    AutoSuggestionInput.on('focus', function () {
        if ($(this).is('[readonly]') || $(this).prop('readonly')) { return; }
        const inputValue = normalizeText($(this).val());
        const allItems = AutoSuggestionList.children();

        if (allItems.length > 0) {
            AutoSuggestionList.show();
            allItems.each(function (index) {
                if (normalizeText($(this).text()).startsWith(inputValue)) {
                    currentIndex = index;
                    highlightItem($(this));
                    return false;
                }
            });
        }
    });

    // Trigger on input
    AutoSuggestionInput.on('input', function () {
        if ($(this).is('[readonly]') || $(this).prop('readonly')) { return; }
        const inputValue = normalizeText($(this).val());
        const allItems = AutoSuggestionList.children();

        if (inputValue) {
            const matches = allItems.filter(function () {
                return normalizeText($(this).text()).startsWith(inputValue); // Modified to startWith
            });

            if (matches.length > 0) {
                allItems.hide();
                matches.show();
                currentIndex = -1;
            } else {
                allItems.hide();
            }
        } else {
            allItems.show();
            currentIndex = -1;
        }
    });

    // Handle keyboard navigation
    AutoSuggestionInput.on('keydown', function (event) {
        const items = AutoSuggestionList.children(':visible');
        const itemCount = items.length;

        if (event.key === 'ArrowDown') {
            event.preventDefault(); // Prevent default scroll behavior
            if (itemCount > 0) {
                currentIndex = (currentIndex + 1) % itemCount; // Circular increment
                highlightItem(items.eq(currentIndex));
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault(); // Prevent default scroll behavior
            if (itemCount > 0) {
                currentIndex = (currentIndex - 1 + itemCount) % itemCount; // Circular decrement
                highlightItem(items.eq(currentIndex));
            }
        } else if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission
            if (currentIndex > -1 && itemCount > 0) {
                const selectedText = items.eq(currentIndex).text();
                AutoSuggestionInput.val(selectedText);
                AutoSuggestionList.hide(); // Hide dropdown after selection
                currentIndex = -1;
                if (typeof onSelect === 'function') {
                    // Find the full data object by Desp
                    const selectedObj = data.find(x => x.Desp === selectedText);
                    onSelect(selectedObj);
                }
                if (IsEnableBizSolhandleEnterKey == true) { BizSolhandleEnterKey(event); }
            }
        }
    });

    // Handle item click
    $(document).on('click', '#' + AutoSuggestionListId + ' li', function () {
        const selectedText = $(this).text();
        AutoSuggestionInput.val(selectedText);
        AutoSuggestionList.hide();
        currentIndex = -1;
        if (typeof onSelect === 'function') {
            const selectedObj = data.find(x => x.Desp == selectedText);
            onSelect(selectedObj);
        }
    });

    // Hide dropdown if clicked outside
    $(document).on('click', function (event) {
        if (!$(event.target).closest(AutoSuggestionInput).length && !$(event.target).closest(AutoSuggestionList).length) {
            AutoSuggestionList.hide();
        }
    });

    // Highlight the currently selected item
    function highlightItem(item) {
        const items = $('#' + AutoSuggestionListId + ' li');
        items.removeClass('AutoSuggestion-list-highlighted');
        item.addClass('AutoSuggestion-list-highlighted');

        // Handle dropdown scroll
        const dropdownHeight = AutoSuggestionList.height();
        const itemOffset = item.position().top + item.outerHeight();

        if (itemOffset > dropdownHeight) {
            AutoSuggestionList.scrollTop(AutoSuggestionList.scrollTop() + item.outerHeight());
        }

        const itemPosition = item.position().top;
        if (itemPosition < 0) {
            AutoSuggestionList.scrollTop(AutoSuggestionList.scrollTop() + itemPosition);
        }
    }


}

// --- Multi-select implementation (self-contained) ---
function populateMultiAutoSuggestionList(data, AutoSuggestionListElement) {
    const AutoSuggestionList = AutoSuggestionListElement;
    AutoSuggestionList.empty();

    const uniqueDataItem = new Set();
    data.forEach(item => {
        if (item['Desp']) {
            uniqueDataItem.add(item['Desp']);
        }
    });

    uniqueDataItem.forEach(item => {
        AutoSuggestionList.append(`<li data-value="${item}">${item}</li>`);
    });
    MultiAutoSuggestionListId = AutoSuggestionListElement[0].id;
}

function setupMultiSearchFunction(AutoSuggestionInputElement, AutoSuggestionListElement, IsEnableBizSolhandleEnterKey = true, data = [], onSelect) {
    const AutoSuggestionInput = AutoSuggestionInputElement;
    const AutoSuggestionList = AutoSuggestionListElement;
    let currentIndex = -1;
    selectedItems = [];

    // Trigger on focus
    AutoSuggestionInput.on('focus', function () {
        if ($(this).is('[readonly]') || $(this).prop('readonly')) { return; }
        const inputValue = getCurrentInputValue($(this).val());
        const normalizedInput = normalizeText(inputValue);
        const allItems = AutoSuggestionList.children();

        if (allItems.length > 0) {
            AutoSuggestionList.show();
            allItems.each(function (index) {
                if (normalizeText($(this).text()).startsWith(normalizedInput)) {
                    currentIndex = index;
                    highlightMultiItem($(this));
                    return false;
                }
            });
        }
    });

    // Trigger on input
    AutoSuggestionInput.on('input', function () {
        if ($(this).is('[readonly]') || $(this).prop('readonly')) { return; }
        const inputValue = getCurrentInputValue($(this).val());
        const normalizedInput = normalizeText(inputValue);
        const allItems = AutoSuggestionList.children();

        if (inputValue) {
            const matches = allItems.filter(function () {
                return normalizeText($(this).text()).startsWith(normalizedInput);
            });

            if (matches.length > 0) {
                allItems.hide();
                matches.show();
                currentIndex = -1;
            } else {
                allItems.hide();
            }
        } else {
            allItems.show();
            currentIndex = -1;
        }

        updateListItemStyles();
    });

    // Handle keyboard navigation
    AutoSuggestionInput.on('keydown', function (event) {
        const items = AutoSuggestionList.children(':visible');
        const itemCount = items.length;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (itemCount > 0) {
                currentIndex = (currentIndex + 1) % itemCount;
                highlightMultiItem(items.eq(currentIndex));
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (itemCount > 0) {
                currentIndex = (currentIndex - 1 + itemCount) % itemCount;
                highlightMultiItem(items.eq(currentIndex));
            }
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (currentIndex > -1 && itemCount > 0) {
                const selectedText = items.eq(currentIndex).text();
                addSelectedItem(selectedText, AutoSuggestionInput);
                AutoSuggestionList.hide();
                currentIndex = -1;
                if (typeof onSelect === 'function') {
                    const selectedObjects = selectedItems.map(item => data.find(x => x.Desp === item)).filter(x => x);
                    onSelect(selectedObjects);
                }
                if (IsEnableBizSolhandleEnterKey == true) { BizSolhandleEnterKey(event); }
            }
        } else if (event.key === 'Backspace') {
            const currentValue = $(this).val();
            if (currentValue.endsWith(', ') || currentValue.endsWith(',')) {
                const items = currentValue.split(',').map(s => s.trim()).filter(s => s);
                if (items.length > 0) {
                    items.pop();
                    selectedItems = items;
                    $(this).val(items.length > 0 ? items.join(', ') + ', ' : '');
                    updateListItemStyles();
                }
            }
        }
    });

    // Handle item click
    $(document).on('click', '#' + MultiAutoSuggestionListId + ' li', function () {
        const selectedText = $(this).text();
        addSelectedItem(selectedText, AutoSuggestionInput);
        AutoSuggestionList.hide();
        currentIndex = -1;
        if (typeof onSelect === 'function') {
            const selectedObjects = selectedItems.map(item => data.find(x => x.Desp == item)).filter(x => x);
            onSelect(selectedObjects);
        }
    });

    // Hide dropdown if clicked outside
    $(document).on('click', function (event) {
        if (!$(event.target).closest(AutoSuggestionInput).length && !$(event.target).closest(AutoSuggestionList).length) {
            AutoSuggestionList.hide();
        }
    });

    function addSelectedItem(itemText, inputElement) {
        if (!selectedItems.includes(itemText)) {
            selectedItems.push(itemText);
            inputElement.val(selectedItems.join(', ') + ', ');
            updateListItemStyles();
        }
    }

    function getCurrentInputValue(fullValue) {
        const parts = fullValue.split(',');
        return parts[parts.length - 1].trim();
    }

    function updateListItemStyles() {
        const allItems = $('#' + MultiAutoSuggestionListId + ' li');
        allItems.each(function () {
            const itemValue = $(this).data('value');
            if (selectedItems.includes(itemValue)) {
                $(this).addClass('AutoSuggestion-list-selected');
            } else {
                $(this).removeClass('AutoSuggestion-list-selected');
            }
        });
    }

    function highlightMultiItem(item) {
        const items = $('#' + MultiAutoSuggestionListId + ' li');
        items.removeClass('AutoSuggestion-list-highlighted');
        item.addClass('AutoSuggestion-list-highlighted');

        const dropdownHeight = AutoSuggestionList.height();
        const itemOffset = item.position().top + item.outerHeight();

        if (itemOffset > dropdownHeight) {
            AutoSuggestionList.scrollTop(AutoSuggestionList.scrollTop() + item.outerHeight());
        }

        const itemPosition = item.position().top;
        if (itemPosition < 0) {
            AutoSuggestionList.scrollTop(AutoSuggestionList.scrollTop() + itemPosition);
        }
    }
}

function normalizeText(text) {
    if (!text) return '';
    var newValue = '';
    var specialChars = "-#,=}]')[(*&$/@@ ";

    for (var i = 0; i < text.length; i++) {
        if (!specialChars.includes(text[i])) {
            newValue += text[i];
        }
    }
    return newValue.toLowerCase();
}

