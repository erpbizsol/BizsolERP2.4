$(document).ready(function () {
    const authToken = '{"ERPDBConStr":"Data Source=220.158.165.98,65446;Connection Timeout=0;Persist Security Info=true;Initial Catalog=BizSolERPDBBizDev; User ID=sa;pwd=biz1981;Packet Size=32000","ERPMainDBConStr":"data source = 220.158.165.98,65446; initial catalog = BizSolERPMainDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000","ERPDMSDBConStr":"data source = 220.158.165.98,65446; initial catalog = BizSolERPDMSDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000","ERPDB_Name":"BizSolERPDBBizDev","ERPMainDB_Name":"BizSolERPMainDB_BizDev","ERPDMSDB_Name":"BizSolERPDMSDB_BizDev","AuthToken":"xyz","UserMaster_Code":"145","CompanyCode":"104"}';
    $.ajax({
        url: 'https://web.bizsol.in/erpapidev/api/UserModule/GetUserModuleMasterByUserID?UserID=BizAnkit',
        type: 'GET',
        contentType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authToken);
        },
        success: function (response) {
            bindMenu(response);
        },
        error: function (error) {
            console.error('Error fetching menu data:', error);
        }
    });
});

function bindMenu(response) {
    var menuHtml = '';
    $.each(response, function (index, item) {
        if (item.MasterCode === 0) {
            var childMenuHtml = getChildMenu(response, item.Code);
            var hasArrow = childMenuHtml ? 'has-arrow' : '';
            menuHtml += '<li>';
            menuHtml += '<a href="javascript:void(0);" class="menu-toggle ' + hasArrow + '">';
            menuHtml += '<span class="iconBg"><i class="side-menu-icon" data-feather="grid"></i></span>';
            menuHtml += '<span>' + item.ModuleDesp + '</span>';
            // Add arrow if submenu exists (always point right initially)
            //menuHtml += childMenuHtml ? '<i class="arrow-icon" data-feather="chevron-right"></i>' : '';
            menuHtml += '</a>';
            if (childMenuHtml) {
                menuHtml += '<ul class="sub-menu" style="display: none;">' + childMenuHtml + '</ul>'; // Submenus hidden by default
            }
            menuHtml += '</li>';
        }
    });

    $('#side-menu').html(menuHtml);

    feather.replace();

    $('.menu-toggle').click(function (e) {
        var parentLi = $(this).parent();

        if (!$(this).hasClass('has-arrow')) {

            return;
        }

        e.preventDefault(); 
        parentLi.toggleClass('mm-active'); 
        parentLi.children('ul.sub-menu').slideToggle(); 

        var arrowIcon = $(this).find('.arrow-icon');
        if (parentLi.hasClass('active')) {
            arrowIcon.attr('data-feather', 'chevron-down');
        } else {
            arrowIcon.attr('data-feather', 'chevron-right');
        }
        feather.replace();
    });
}

function getChildMenu(response, masterCode) {
    var childMenuHtml = '';
    $.each(response, function (index, item) {
        if (item.MasterCode === masterCode) {
            var subChildMenuHtml = getChildMenu(response, item.Code);
            var hasArrow = subChildMenuHtml ? 'has-arrow' : '';
            childMenuHtml += '<li>';
            childMenuHtml += '<a href="HRMasters/EmployeeMaster" class="menu-toggle ' + hasArrow + '">'; 
            childMenuHtml += '<span>' + item.ModuleDesp + '</span>';
            // Add arrow if submenu exists (always point right initially) 
            //childMenuHtml += subChildMenuHtml ? '<i class="arrow-icon" data-feather="chevron-right"></i>' : '';
            childMenuHtml += '</a>';
            if (subChildMenuHtml) {
                childMenuHtml += '<ul class="sub-menu" style="display: none;">' + subChildMenuHtml + '</ul>'; 
            }
            childMenuHtml += '</li>';
        }
    });
    return childMenuHtml;
}
