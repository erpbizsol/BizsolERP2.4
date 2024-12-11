
const AutoSuggestionControl = {
    SetUpAutoSuggestion: function SetUpAutoSuggestion(AutoSuggestionInputElement, AutoSuggestionListElement, data,serachMode) {
        populateAutoSuggestionList(data, AutoSuggestionListElement);
        setupSearchFunction(AutoSuggestionInputElement, AutoSuggestionListElement);
    }
}   

export { AutoSuggestionControl }

var AutoSuggestionListId = '';
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

function setupSearchFunction(AutoSuggestionInputElement, AutoSuggestionListElement) {
    const AutoSuggestionInput = AutoSuggestionInputElement;
    const AutoSuggestionList = AutoSuggestionListElement;
    let currentIndex = -1;

    // Trigger on focus
    AutoSuggestionInput.on('focus', function () {
        const inputValue = normalizeText($(this).val());
        const allItems = AutoSuggestionList.children();

        if (allItems.length > 0) {
            AutoSuggestionList.show();
            allItems.each(function (index) {
                if (normalizeText($(this).text()).startsWith(inputValue)) {
                    // Modified to startWith
                    currentIndex = index;
                    highlightItem($(this));
                    return false;
                }
            });
        }
    });

    // Trigger on input
    AutoSuggestionInput.on('input', function () {
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
            if (currentIndex > -1) {
                const selectedItem = items.eq(currentIndex).text();
                AutoSuggestionInput.val(selectedItem);
                AutoSuggestionList.hide(); // Hide dropdown after selection
                currentIndex = -1;
            }
        }
    });

    // Handle item click
    $(document).on('click', '#' + AutoSuggestionListId+' li', function () {
        const selectedItem = $(this).text();
        AutoSuggestionInput.val(selectedItem);
        AutoSuggestionList.hide();
        currentIndex = -1;
    });

    // Hide dropdown if clicked outside
    $(document).on('click', function (event) {
        if (!$(event.target).closest(AutoSuggestionInput).length && !$(event.target).closest(AutoSuggestionList).length) {
            AutoSuggestionList.hide();
        }
    });

    // Highlight the currently selected item
    function highlightItem(item) {
        const items = $('#'+ AutoSuggestionListId+' li');
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

function normalizeText(text) {
    var newValue = '';
    var specialChars = "-#,=}]')[(*&$/@@ ";

    for (var i = 0; i < text.length; i++) {
        if (!specialChars.includes(text[i])) {
            newValue += text[i];
        }
    }
    return newValue.toLowerCase();
}

