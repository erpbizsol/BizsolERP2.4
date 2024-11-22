let editValue = 0;
let currentIndex = 0;
let codeValues = [];
let functionName = "";

$(document).ready(function () {
    $('#PBControls').empty();
    var filterHtml = `
    <div class="row mt-3">
        <div class="col-md-12" style="margin: 0 auto">
            <div class="row">
                <div class="col-md-6 col-sm-6 mt-1 toolbar toolbar1">
                    <button data-toggle="tooltip" data-placement="top" title="FIRST" id="First" onclick="First()" class="icon-height btn btn-success nav-btn">
                        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24" class="svg-icon">
                            <path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"></path>
                        </svg>
                    </button>
                    <button data-toggle="tooltip" data-placement="top" title="PREVIOUS" id="Previous" onclick="Previous()" class="icon-height btn btn-success nav-btn">
                        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24" class="svg-icon">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
                        </svg>
                    </button>
                    <button data-toggle="tooltip" data-placement="top" title="NEXT" id="Next" onclick="Next()" class="icon-height btn btn-success nav-btn">
                        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24" class="svg-icon">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
                        </svg>
                    </button>
                    <button data-toggle="tooltip" data-placement="top" title="LAST" id="Last" onclick="Last()" class="icon-height btn btn-success nav-btn">
                        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" width="24" height="24" class="svg-icon">
                            <path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"></path>
                        </svg>
                    </button>
                </div>
                <div class="col-md-6 col-sm-6 toolbar mt-1">
                    <button data-toggle="tooltip" data-placement="top" title="SAVE" id="btnSave" onclick="Save()" class="icon-height btn btn-success nav-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);" class="svg-icon">
                            <path d="M5 21h14a2 2 0 0 0 2-2V8a1 1 0 0 0-.29-.71l-4-4A1 1 0 0 0 16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2zm10-2H9v-5h6zM13 7h-2V5h2zM5 5h2v4h8V5h.59L19 8.41V19h-2v-5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5H5z"></path>
                        </svg>
                    </button>
                    <button data-toggle="tooltip" data-placement="top" title="DELETE" id="btnDelete" onclick="Delete()" class="icon-height btn btn-danger nav-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);" class="svg-icon">
                            <path d="M6 7H5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7H6zm4 12H8v-9h2v9zm6 0h-2v-9h2v9zm.618-15L15 2H9L7.382 4H3v2h18V4z"></path>
                        </svg>
                    </button>
                    <button data-toggle="tooltip" data-placement="top" title="BACK" id="btnBack" onclick="Back()" class="icon-height btn btn-success nav-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);" class="svg-icon">
                            <path d="M19 21a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14zM12 7v4h5v2h-5v4l-5-5 5-5z"></path>
                        </svg>
                    </button>
                    <button data-toggle="tooltip" data-placement="top" title="PRINT" id="btnPrint" onclick="Print()" class="icon-height btn btn-success nav-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);" class="svg-icon"class="svg-icon">
                            <path d="M19 7h-1V2H6v5H5c-1.654 0-3 1.346-3 3v7c0 1.103.897 2 2 2h2v3h12v-3h2c1.103 0 2-.897 2-2v-7c0-1.654-1.346-3-3-3zM8 4h8v3H8V4zm8 16H8v-4h8v4zm4-3h-2v-3H6v3H4v-7c0-.551.449-1 1-1h14c.552 0 1 .449 1 1v7z"></path>
                            <path d="M14 10h4v2h-4z"></path>
                        </svg>
                    </button>
                    <button data-toggle="tooltip" data-placement="top" title="VIEW" id="btnAttachment" onclick="ViewAttachment()" class="icon-height btn btn-success nav-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);" class="svg-icon">
                            <path d="M19.903 8.586a.997.997 0 0 0-.196-.293l-6-6a.997.997 0 0 0-.293-.196c-.03-.014-.062-.022-.094-.033a.991.991 0 0 0-.259-.051C13.04 2.011 13.021 2 13 2H6c-1.103 0-2 .897-2 2v16c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2V9c0-.021-.011-.04-.013-.062a.952.952 0 0 0-.051-.259c-.01-.032-.019-.063-.033-.093zM16.586 8H14V5.414L16.586 8zM6 20V4h6v5a1 1 0 0 0 1 1h5l.002 10H6z"></path>
                            <path d="M8 12h8v2H8zm0 4h8v2H8zm0-8h2v2H8z"></path>
                        </svg>
                    </button>
                    <button data-toggle="tooltip" data-placement="top" title="VERIFY" id="btnVerify" onclick="Verify()" class="icon-height btn btn-success nav-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);" class="svg-icon">
                            <path d="M7 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm4 10.414-2.707-2.707 1.414-1.414L11 12.586l3.793-3.793 1.414 1.414L11 15.414z"></path>
                        </svg>
                    </button>
                    <button data-toggle="tooltip" data-placement="top" title="OTHER" id="btnOther" onclick="Other()" class="icon-height btn btn-success nav-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);" class="svg-icon">
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 11h3v2h-3v3h-2v-3H8v-2h3V8h2z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    $('#PBControls').append(filterHtml);
    applyButtonProperties();
    $('[data-toggle="tooltip"]').tooltip();

});

function GetallData(EditValue, CurrentIndex, CodeValues, FunctionName) {
    editValue = EditValue;
    currentIndex = CurrentIndex;
    codeValues = CodeValues;
    functionName = FunctionName;
    displayCode();
}
function displayCode() {
    $('#currentCode').text(codeValues[currentIndex]);
    window[functionName](codeValues[currentIndex]);
    toggleNavigationButtons();
}
function First() {
    currentIndex = 0;
    displayCode();
}
function Previous() {
    if (currentIndex > 0) {
        currentIndex--;
        displayCode();
    }
}
function Next() {
    if (currentIndex < codeValues.length - 1) {
        currentIndex++;
        displayCode();
    }
}
function Last() {
    currentIndex = codeValues.length - 1;
    displayCode();
}

function toggleNavigationButtons() {
    $('#First').prop('disabled', currentIndex === 0);
    $('#Previous').prop('disabled', currentIndex === 0);
    $('#Next').prop('disabled', currentIndex === codeValues.length - 1);
    $('#Last').prop('disabled', currentIndex === codeValues.length - 1);
}

function applyButtonProperties() {
    const properties = buttonProperty();

    for (const [buttonId, props] of Object.entries(properties)) {
        const button = $(`#btn${buttonId}`);
        button
            .removeClass('btn-success btn-secondary btn-primary btn-warning btn-danger')
            .addClass(props.color);

        if (props.visible) {
            button.show();
        } else {
            button.hide();
        }

        button.prop('disabled', props.disabled);
        button.prop('title', props.title.toUpperCase()); 
    }
}


window.Last = Last;
window.Next = Next;
window.Previous = Previous;
window.First = First;
window.GetallData = GetallData;
