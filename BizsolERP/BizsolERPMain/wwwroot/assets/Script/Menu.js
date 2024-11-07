
import { MenuService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/menuservices.js';
$(document).ready(function () {
    bindMenu();
});

function bindMenu() {
    var baseUrl = `${window.location.protocol}//${window.location.host}`;
    MenuService.GetMenuList("BIZANKIT").then(function (value) {
        var menuHtml = '';
        $.each(value, function (index, item) {
            if (item.MasterCode === 0) {
                var childMenuHtml = getChildMenu(value, item.Code, baseUrl);
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
    });
}

function getChildMenu(value, masterCode, baseUrl) {
    var baseUrl = `${window.location.protocol}//${window.location.host}`;
    var childMenuHtml = '';
    $.each(value, function (index, item) {
        if (item.MasterCode === masterCode) {
            var subChildMenuHtml = getChildMenu(value, item.Code);
            var hasArrow = subChildMenuHtml ? 'has-arrow' : '';
            childMenuHtml += '<li>'; 
            childMenuHtml += '<a href="' + baseUrl+'/'+ item.FormToOpen +'" class="menu-toggle ' + hasArrow + '">';
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