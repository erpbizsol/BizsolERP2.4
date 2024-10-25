$(document).ready(function () {
    // Auth token example for headers
    const authToken = '{"ERPDBConStr":"Data Source=220.158.165.98,65446;Connection Timeout=0;Persist Security Info=true;Initial Catalog=BizSolERPDBBizDev; User ID=sa;pwd=biz1981;Packet Size=32000","ERPMainDBConStr":"data source = 220.158.165.98,65446; initial catalog = BizSolERPMainDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000","ERPDMSDBConStr":"data source = 220.158.165.98,65446; initial catalog = BizSolERPDMSDB_BizDev; uid = sa; PWD = biz1981; Max Pool Size = 5000","ERPDB_Name":"BizSolERPDBBizDev","ERPMainDB_Name":"BizSolERPMainDB_BizDev","ERPDMSDB_Name":"BizSolERPDMSDB_BizDev","AuthToken":"xyz","UserMaster_Code":"145","CompanyCode":"104"}';

    // AJAX call to fetch menu data
    $.ajax({
        url: 'https://web.bizsol.in/erpapidev/api/UserModule/GetUserModuleMasterByUserID?UserID=BizAnkit',
        type: 'GET',
        contentType: 'json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Auth-Key', authToken);
        },
        success: function (response) {
            bindMenu(response); // Call function to bind menu
        },
        error: function (error) {
            console.error('Error fetching menu data:', error);
        }
    });
});

function bindMenu(response) {
    var menuHtml = '';

    // Loop through the response to build the menu
    $.each(response, function (index, item) {
        if (item.MasterCode === 0) { // Only for top-level (MasterCode == 0)
            var childMenuHtml = getChildMenu(response, item.Code); // Get child items (submenus)
            var hasArrow = childMenuHtml ? 'has-arrow' : ''; // Check if item has submenus
            menuHtml += '<li>';
            menuHtml += '<a href="javascript:void(0);" class="menu-toggle ' + hasArrow + '">';
            menuHtml += '<i data-feather="grid"></i>';
            menuHtml += '<span>' + item.ModuleDesp + '</span>';
            // Add arrow if submenu exists (always point right initially)
            menuHtml += childMenuHtml ? '<i class="arrow-icon" data-feather="chevron-right"></i>' : '';
            menuHtml += '</a>';
            if (childMenuHtml) {
                menuHtml += '<ul class="submenu" style="display: none;">' + childMenuHtml + '</ul>'; // Submenus hidden by default
            }
            menuHtml += '</li>';
        }
    });

    // Insert generated HTML into the DOM
    $('#side-menu').html(menuHtml);

    // Replace Feather icons after inserting into DOM
    feather.replace();

    // Add click event handler to toggle submenus
    $('.menu-toggle').click(function (e) {
        var parentLi = $(this).parent(); // Get the parent <li> of the clicked <a> tag

        if (!$(this).hasClass('has-arrow')) { // Check if it's a child item
            // Allow default action (navigation) if it's a child item
            return;
        }

        e.preventDefault(); // Prevent default action for parent items with submenus
        parentLi.toggleClass('active'); // Toggle active state for open/close
        parentLi.children('ul.submenu').slideToggle(); // Toggle the submenu visibility

        // Change the arrow icon dynamically
        var arrowIcon = $(this).find('.arrow-icon');
        if (parentLi.hasClass('active')) {
            arrowIcon.attr('data-feather', 'chevron-down'); // Arrow down when active
        } else {
            arrowIcon.attr('data-feather', 'chevron-right'); // Arrow right when collapsed
        }
        feather.replace(); // Re-initialize Feather icons after change
    });
}

// Recursive function to build submenus
function getChildMenu(response, masterCode) {
    var childMenuHtml = '';
    $.each(response, function (index, item) {
        if (item.MasterCode === masterCode) { // Check if the current item is a child of masterCode
            var subChildMenuHtml = getChildMenu(response, item.Code); // Recursively get sub-submenus
            var hasArrow = subChildMenuHtml ? 'has-arrow' : ''; // Check if there are submenus

            // Create link for child menu item
            childMenuHtml += '<li>';
            childMenuHtml += '<a href="https://www.bing.com/ck/a?!&&p=01b45133efb6c4ce2c40ec4e1fe981d4ccb211f976546c2fca74fb0de9aedd79JmltdHM9MTcyOTU1NTIwMA&ptn=3&ver=2&hsh=4&fclid=191b3ea8-f84c-672d-3129-2a1cf94a6631&psq=facebook&u=a1aHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLw&ntb=1" class="menu-toggle ' + hasArrow + '" target="_blank">'; // Ensure you have a 'Link' property in the response
            childMenuHtml += '<span>' + item.ModuleDesp + '</span>';
            // Add arrow if submenu exists (always point right initially)
            childMenuHtml += subChildMenuHtml ? '<i class="arrow-icon" data-feather="chevron-right"></i>' : '';
            childMenuHtml += '</a>';
            if (subChildMenuHtml) {
                childMenuHtml += '<ul class="submenu" style="display: none;">' + subChildMenuHtml + '</ul>'; // Wrap child items and hide them
            }
            childMenuHtml += '</li>';
        }
    });
    return childMenuHtml;
}
