import { GeneratePasswordService } from '../../JSServices/GeneratePasswordService.js';

var askPasswordOptions = null;
var askPasswordValidating = false;

function ensureAskPasswordModal() {
    if (document.getElementById('AskPasswordModal')) {
        return;
    }

    if (!document.getElementById('AskPasswordModalStyle')) {
        var style = document.createElement('style');
        style.id = 'AskPasswordModalStyle';
        style.textContent = ''
            + '#AskPasswordModal .ask-password-field{position:relative;}'
            + '#AskPasswordModal .ask-password-field input{padding-right:2.4rem;}'
            + '#AskPasswordModal .ask-password-toggle{'
            + 'position:absolute;right:6px;top:50%;transform:translateY(-50%);'
            + 'width:28px;height:28px;margin:0;padding:0;border:0;background:transparent;'
            + 'display:inline-flex;align-items:center;justify-content:center;'
            + 'color:#6c757d;cursor:pointer;z-index:2;line-height:1;box-shadow:none;'
            + '}'
            + '#AskPasswordModal .ask-password-toggle:hover{color:#3f51b5;}'
            + '#AskPasswordModal .ask-password-toggle i{font-size:14px;line-height:1;}';
        document.head.appendChild(style);
    }

    var html = ''
        + '<div class="modal fade" id="AskPasswordModal" tabindex="-1" role="dialog" aria-hidden="true">'
        + '  <div class="modal-dialog">'
        + '    <div class="modal-content">'
        + '      <div class="modal-header">'
        + '        <h5 class="modal-title" id="AskPasswordModalTitle">Enter Password</h5>'
        + '        <button type="button" class="close modal-close" data-bs-dismiss="modal" aria-label="Close">'
        + '          <span aria-hidden="true" class="modal-close-icon">&times;</span>'
        + '        </button>'
        + '      </div>'
        + '      <div class="modal-body">'
        + '        <p id="AskPasswordModalMessage" class="mb-2" style="display:none;"></p>'
        + '        <label for="txtAskPassword" class="col-form-label-sm fw-bold">Password <span class="text-danger">*</span></label>'
        + '        <div class="ask-password-field">'
        + '          <input type="password" id="txtAskPassword" class="form-control form-control-sm box_border" placeholder="Enter password" autocomplete="off" maxlength="6" />'
        + '          <button type="button" class="ask-password-toggle" id="btnAskPasswordToggle" title="Show/Hide password"><i class="fa fa-eye" id="iconAskPasswordToggle"></i></button>'
        + '        </div>'
        + '        <div id="divAskPasswordReason" class="mt-2" style="display:none;">'
        + '          <label for="txtAskPasswordReason" class="col-form-label-sm fw-bold">Reason <span class="text-danger">*</span></label>'
        + '          <input type="text" id="txtAskPasswordReason" class="form-control form-control-sm box_border" placeholder="Enter reason" autocomplete="off" maxlength="250" />'
        + '        </div>'
        + '      </div>'
        + '      <div class="modal-footer">'
        + '        <button type="button" class="btn btn-primary btn-height" id="btnAskPasswordOk">OK</button>'
        + '        <button type="button" class="btn btn-danger btn-height" data-bs-dismiss="modal">Cancel</button>'
        + '      </div>'
        + '    </div>'
        + '  </div>'
        + '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('btnAskPasswordOk').addEventListener('click', submitAskPassword);
    document.getElementById('btnAskPasswordToggle').addEventListener('click', toggleAskPasswordVisibility);
    document.getElementById('txtAskPassword').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitAskPassword();
        }
    });
    document.getElementById('txtAskPasswordReason').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitAskPassword();
        }
    });
    $('#AskPasswordModal').on('shown.bs.modal', function () {
        $('#txtAskPassword').trigger('focus');
    });
    $('#AskPasswordModal').on('hidden.bs.modal', function () {
        askPasswordValidating = false;
        $('#txtAskPassword').val('').attr('type', 'password');
        $('#txtAskPasswordReason').val('');
        $('#iconAskPasswordToggle').attr('class', 'fa fa-eye');
        $('#btnAskPasswordOk').prop('disabled', false);
    });
}

function toggleAskPasswordVisibility() {
    var input = document.getElementById('txtAskPassword');
    var icon = document.getElementById('iconAskPasswordToggle');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa fa-eye';
    }
}

function AskPassword_Open(options) {
    ensureAskPasswordModal();
    askPasswordOptions = options || {};
    askPasswordValidating = false;

    $('#AskPasswordModalTitle').text(askPasswordOptions.title || 'Enter Password');
    $('#txtAskPassword').val('').attr('type', 'password');
    $('#iconAskPasswordToggle').attr('class', 'fa fa-eye');
    $('#btnAskPasswordOk').prop('disabled', false);

    if (askPasswordOptions.message) {
        $('#AskPasswordModalMessage').text(askPasswordOptions.message).show();
    } else {
        $('#AskPasswordModalMessage').text('').hide();
    }

    if (askPasswordOptions.askReason === true) {
        $('#divAskPasswordReason').show();
        $('#txtAskPasswordReason').val(askPasswordOptions.reasonFor || '');
    } else {
        $('#divAskPasswordReason').hide();
        $('#txtAskPasswordReason').val('');
    }

    $('#AskPasswordModal').modal({
        backdrop: 'static',
        keyboard: false
    });
    $('#AskPasswordModal').modal('show');
}

function submitAskPassword() {
    if (askPasswordValidating) {
        return;
    }

    var password = ($('#txtAskPassword').val() || '').trim();
    if (password === '') {
        toastr.error('Please enter password.');
        $('#txtAskPassword').trigger('focus');
        return;
    }

    var options = askPasswordOptions || {};
    var reasonFor = options.reasonFor || '';
    if (options.askReason === true) {
        reasonFor = ($('#txtAskPasswordReason').val() || '').trim();
        if (reasonFor === '') {
            toastr.error('Please enter reason.');
            $('#txtAskPasswordReason').trigger('focus');
            return;
        }
    }

    askPasswordValidating = true;
    $('#btnAskPasswordOk').prop('disabled', true);
    if (typeof Showloader === 'function') {
        Showloader();
    }

    GeneratePasswordService.ValidatePassword(
        password,
        options.masterTableName || '',
        options.masterTableCode || 0,
        options.usedFor || '',
        reasonFor,
        options.entryNo || '',
        options.finYear || ''
    ).then(function (response) {
        askPasswordValidating = false;
        $('#btnAskPasswordOk').prop('disabled', false);
        if (typeof HideLoader === 'function') {
            HideLoader();
        }

        if (response && response.Status === 'Y') {
            toastr.success(response.Msg || 'Password validated.');
            $('#AskPasswordModal').modal('hide');
            if (typeof options.onSuccess === 'function') {
                options.onSuccess(response);
            }
        } else {
            toastr.error((response && response.Msg) ? response.Msg : 'Invalid password.');
            $('#txtAskPassword').trigger('focus');
        }
    }).catch(function () {
        askPasswordValidating = false;
        $('#btnAskPasswordOk').prop('disabled', false);
        if (typeof HideLoader === 'function') {
            HideLoader();
        }
    });
}

window.AskPassword_Open = AskPassword_Open;

export { AskPassword_Open };
