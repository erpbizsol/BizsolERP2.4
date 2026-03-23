//import { MenuService } from '../../_content/Bizsol.WebERP.UI.Shared/js/JSServices/menuservices.js';
import { MenuService } from '../../_content/Bizsol.WebERP.UI.Shared/js/JSServices/menuservices.js';

$(document).ready(function () {
        bindMenu();
});

function bindMenu() {
   // var baseUrl = `${window.location.protocol}//${window.location.host}`;
    var baseUrl = sessionStorage.getItem('AppBaseURL');
    let LoginGodownName = JSON.parse(sessionStorage.getItem('authKey')).WebERPLoginGodownName;
        LoginGodownName = LoginGodownName ? `(${LoginGodownName})` : '';
    //var baseUrl = window.AppBaseURL;
    MenuService.GetUserDetails()
        .then(function (res) {
            sessionStorage.setItem('UserDetails', JSON.stringify(res));
            let UserDetailsobj = JSON.parse(sessionStorage.getItem('UserDetails'));
            GetWebNotificationList();
            $('#ERPUserName')[0].innerHTML = UserDetailsobj[0].UserID;
            $('#ERPCompanyCode')[0].innerHTML = `(${UserDetailsobj[0].CompanyNameForShow})${LoginGodownName}`;
            $('#mobileERPUserName')[0].innerHTML = UserDetailsobj[0].UserID;
            $('#mobileERPCompanyCode')[0].innerHTML = `(${UserDetailsobj[0].CompanyNameForShow})${LoginGodownName}`;

            MenuService.GetMenuList(UserDetailsobj[0].UserID).then(function (value) {
                var menuHtml = '';
                var mobileMenuHtml = '';
                var mobileMenuCount = 0;
                var maxMobileItems = 5; // Limit mobile nav to 5 items

                $.each(value, function (index, item) {
                    if (item.MasterCode === 0) {
                        var childMenuHtml = getChildMenu(value, item.Code, baseUrl);
                        var hasArrow = childMenuHtml ? 'has-arrow' : '';

                        // Desktop sidebar menu with data attribute
                        menuHtml += '<a href="javascript:void(0);" class="sidebar-menu-item menu-toggle ' + hasArrow + '" data-menu-code="' + item.Code + '" data-menu-name="' + item.ModuleDesp + '">';
                        menuHtml += '<i class="' + getMenuIcon(item.ModuleDesp) + '"></i>';
                        menuHtml += '<span>' + item.ModuleDesp + '</span>';
                        menuHtml += '</a>';

                        if (childMenuHtml) {
                            menuHtml += '<div class="sub-menu" style="display: none;">' + childMenuHtml + '</div>';
                        }

                        // Mobile bottom navigation (only top-level items, limited to maxMobileItems)
                        if (mobileMenuCount < maxMobileItems) {
                            var firstChildUrl = getFirstChildUrl(value, item.Code, baseUrl);
                            var mobileHref = childMenuHtml ? 'javascript:void(0);' : (firstChildUrl || 'javascript:void(0);');
                            var mobileClass = childMenuHtml ? 'mobile-nav-item mobile-menu-toggle' : 'mobile-nav-item';

                            mobileMenuHtml += '<a href="' + mobileHref + '" class="' + mobileClass + '" data-menu-code="' + item.Code + '" data-menu-name="' + item.ModuleDesp + '">';
                            mobileMenuHtml += '<i class="' + getMenuIcon(item.ModuleDesp) + '"></i>';
                            mobileMenuHtml += '<span>' + truncateText(item.ModuleDesp, 10) + '</span>';
                            mobileMenuHtml += '</a>';

                            mobileMenuCount++;
                        }
                    }
                });

                $('#sidebar-menu').html(menuHtml);
                $('.mobile-nav-items').html(mobileMenuHtml);

                setActiveMenu();

                // Handle menu toggle for desktop sidebar
                $('.sidebar-menu-item.menu-toggle').click(function (e) {
                    var menuItem = $(this);
                    var subMenu = menuItem.next('.sub-menu');

                    if (!menuItem.hasClass('has-arrow')) {
                        return; // If it's not a parent with a submenu, do nothing
                    }

                    e.preventDefault();
                    e.stopPropagation(); // Prevent event from bubbling to parent menus

                    // Check if sidebar is collapsed
                    if ($('#modern-sidebar').hasClass('collapsed')) {
                        return; // Don't handle click when collapsed, let hover handle it
                    }

                    if (subMenu.is(":visible")) {
                        subMenu.slideUp();
                        menuItem.removeClass('active');
                    } else {
                        // Only close sibling submenus at the same level, not parent menus
                        menuItem.siblings('.menu-toggle').next('.sub-menu').slideUp();
                        menuItem.siblings('.menu-toggle').removeClass('active');

                        subMenu.slideDown();
                        menuItem.addClass('active'); 
                    }
                });

                // Handle hover for collapsed sidebar
                initCollapsedSidebarHover();

                // Handle mobile menu items with submenus - open sidebar on mobile
                $('.mobile-menu-toggle').click(function (e) {
                    e.preventDefault();

                    // Get the menu code from clicked mobile nav item
                    var menuCode = $(this).data('menu-code');
                    var menuName = $(this).data('menu-name');

                    // Open the sidebar on mobile
                    $('#modern-sidebar').addClass('show');
                    $('#sidebar-overlay').addClass('show');

                    // Find the corresponding menu item in sidebar by menu code
                    var correspondingMenuItem = $('#sidebar-menu .sidebar-menu-item[data-menu-code="' + menuCode + '"]');

                    if (correspondingMenuItem.length) {
                        // Close all submenus first
                        $('#sidebar-menu .sub-menu').slideUp();
                        $('#sidebar-menu .sidebar-menu-item').removeClass('active');

                        // Open the selected submenu
                        var subMenu = correspondingMenuItem.next('.sub-menu');
                        if (subMenu.length) {
                            subMenu.slideDown();
                            correspondingMenuItem.addClass('active');
                        }
                    }
                });
            });
        })
        
   
}

function getChildMenu(value, masterCode, baseUrl) {
   
    var baseUrl = sessionStorage.getItem('AppBaseURL');
    var childMenuHtml = '';
    $.each(value, function (index, item) {
        if (item.MasterCode === masterCode && item.NotificationApplicable==='N') {
            var subChildMenuHtml = getChildMenu(value, item.Code);
            var hasArrow = subChildMenuHtml ? 'has-arrow' : '';
            
            // Check if FormToOpen already contains a query parameter
            var separator = item.FormToOpen.indexOf('?') !== -1 ? '&' : '?';
            
            childMenuHtml += '<a href="' + baseUrl + '/' + item.FormToOpen + separator + 'ModuleDesp=' + item.ModuleDesp +'" class="sidebar-menu-item menu-toggle ' + hasArrow + '">';
            childMenuHtml += '<i class="' + getMenuIcon(item.ModuleDesp) + '"></i>';
            childMenuHtml += '<span>' + item.ModuleDesp + '</span>';
            childMenuHtml += '</a>';
            
            if (subChildMenuHtml) {
                childMenuHtml += '<div class="sub-menu" style="display: none;">' + subChildMenuHtml + '</div>';
            }
        }
    });
    return childMenuHtml;
}

function setActiveMenu() {
    var currentUrl = window.location.pathname;
    const LastChar = currentUrl.slice(-1);

    // Initially hide all submenus
    $('#sidebar-menu .sub-menu').hide();
    $('#sidebar-menu .sidebar-menu-item').removeClass('active');
    $('.mobile-nav-item').removeClass('active');

    // Find and activate the current page menu item
    $('#sidebar-menu a').each(function () {
        var menuLink = $(this).attr('href');
        if (menuLink && menuLink !== 'javascript:void(0);' && (currentUrl === new URL(menuLink, window.location.origin).pathname) && currentUrl !== "/" && LastChar !='/') {
            $(this).addClass('active');

            // Show all parent submenus
            $(this).parents('.sub-menu').each(function() {
                $(this).show();
                // Also mark parent menu items as active
                $(this).prev('.menu-toggle').addClass('active');
            });
        }
    });

    // Set active state for mobile nav
    $('.mobile-nav-item').each(function () {
        var menuLink = $(this).attr('href');
        if (menuLink && menuLink !== 'javascript:void(0);' && (currentUrl === new URL(menuLink, window.location.origin).pathname) && currentUrl !== "/" && LastChar !='/') {
            $(this).addClass('active');
        }
    });
}

// Helper function to get the first child URL for mobile navigation
function getFirstChildUrl(value, masterCode, baseUrl) {
    var firstUrl = null;
    $.each(value, function (index, item) {
        if (item.MasterCode === masterCode && item.NotificationApplicable === 'N') {
            if (!firstUrl && item.FormToOpen) {
                var separator = item.FormToOpen.indexOf('?') !== -1 ? '&' : '?';
                firstUrl = baseUrl + '/' + item.FormToOpen + separator + 'ModuleDesp=' + item.ModuleDesp;
                return false; // Break the loop
            }
        }
    });
    return firstUrl;
}

// Helper function to truncate text for mobile display
function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substr(0, maxLength);
}

// Helper function to get appropriate icon based on menu name
function getMenuIcon(moduleDesp) {
    const iconMap = {
        'dashboard': 'fas fa-home',
        'master': 'fas fa-database',
        'masters': 'fas fa-database',
        'transaction': 'fas fa-exchange-alt',
        'transactions': 'fas fa-exchange-alt',
        'report': 'fas fa-chart-bar',
        'reports': 'fas fa-chart-bar',
        'tool': 'fas fa-tools',
        'tools': 'fas fa-tools',
        'setting': 'fas fa-cog',
        'settings': 'fas fa-cog',
        'account': 'fas fa-user',
        'accounts': 'fas fa-user',
        'inventory': 'fas fa-boxes',
        'sales': 'fas fa-shopping-cart',
        'purchase': 'fas fa-shopping-bag',
        'party': 'fas fa-users',
        'parties': 'fas fa-users',
        'product': 'fas fa-box',
        'products': 'fas fa-box',
        'order': 'fas fa-file-invoice',
        'orders': 'fas fa-file-invoice',
        'invoice': 'fas fa-file-invoice-dollar',
        'invoices': 'fas fa-file-invoice-dollar',
        'payment': 'fas fa-credit-card',
        'payments': 'fas fa-credit-card',
        'receipt': 'fas fa-receipt',
        'receipts': 'fas fa-receipt'
    };

    // Convert to lowercase and check for matches
    const lowerDesp = moduleDesp.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
        if (lowerDesp.includes(key)) {
            return icon;
        }
    }

    // Default icon
    return 'fas fa-circle';
}

// Function to handle popup menu for collapsed sidebar
function initCollapsedSidebarHover() {
    var popupMenu = null;
    var hideTimeout = null;

    // Create popup menu element
    function createPopupMenu(menuItem) {
        var menuName = menuItem.find('span').text();
        var subMenu = menuItem.next('.sub-menu');

        if (!subMenu.length || !menuItem.hasClass('has-arrow')) {
            return null; // No submenu to show
        }

        var popupHtml = '<div class="sidebar-popup-menu">';
        popupHtml += '<div class="popup-menu-title">' + menuName + '</div>';

        // Get all submenu items
        subMenu.find('> a.sidebar-menu-item').each(function() {
            var subMenuItem = $(this);
            var subMenuName = subMenuItem.find('span').text();
            var subMenuIcon = subMenuItem.find('i').attr('class');
            var subMenuHref = subMenuItem.attr('href');
            var hasSubMenu = subMenuItem.hasClass('has-arrow');

            popupHtml += '<a href="' + subMenuHref + '" class="popup-menu-item' + (hasSubMenu ? ' has-arrow' : '') + '">';
            popupHtml += '<i class="' + subMenuIcon + '"></i>';
            popupHtml += '<span>' + subMenuName + '</span>';
            popupHtml += '</a>';

            // Handle nested submenus
            var nestedSubMenu = subMenuItem.next('.sub-menu');
            if (nestedSubMenu.length) {
                popupHtml += '<div class="popup-submenu">';
                nestedSubMenu.find('> a.sidebar-menu-item').each(function() {
                    var nestedItem = $(this);
                    var nestedName = nestedItem.find('span').text();
                    var nestedIcon = nestedItem.find('i').attr('class');
                    var nestedHref = nestedItem.attr('href');

                    popupHtml += '<a href="' + nestedHref + '" class="popup-menu-item">';
                    popupHtml += '<i class="' + nestedIcon + '"></i>';
                    popupHtml += '<span>' + nestedName + '</span>';
                    popupHtml += '</a>';
                });
                popupHtml += '</div>';
            }
        });

        popupHtml += '</div>';

        return $(popupHtml);
    }

    // Show popup menu
    function showPopupMenu(menuItem) {
        if (!$('#modern-sidebar').hasClass('collapsed')) {
            return; // Only show popup when sidebar is collapsed
        }

        // Remove existing popup
        $('.sidebar-popup-menu').remove();
        clearTimeout(hideTimeout);

        popupMenu = createPopupMenu(menuItem);
        if (!popupMenu) {
            return;
        }

        $('body').append(popupMenu);

        // Position the popup
        var menuItemOffset = menuItem.offset();
        var menuItemHeight = menuItem.outerHeight();

        popupMenu.css({
            top: menuItemOffset.top + 'px',
            display: 'block'
        });

        // Handle popup menu item hover to show nested submenus
        var subMenuHideTimeout = null;

        popupMenu.find('.popup-menu-item.has-arrow').on('mouseenter', function() {
            clearTimeout(subMenuHideTimeout);
            var $subMenu = $(this).next('.popup-submenu');
            popupMenu.find('.popup-submenu').not($subMenu).slideUp(200);
            $subMenu.slideDown(200);
        }).on('mouseleave', function() {
            var $subMenu = $(this).next('.popup-submenu');
            subMenuHideTimeout = setTimeout(function() {
                $subMenu.slideUp(200);
            }, 300);
        });

        popupMenu.find('.popup-submenu').on('mouseenter', function() {
            clearTimeout(subMenuHideTimeout);
        }).on('mouseleave', function() {
            var $subMenu = $(this);
            subMenuHideTimeout = setTimeout(function() {
                $subMenu.slideUp(200);
            }, 300);
        });

        // Keep popup visible when hovering over it
        popupMenu.hover(
            function() {
                clearTimeout(hideTimeout);
            },
            function() {
                hideTimeout = setTimeout(function() {
                    popupMenu.fadeOut(200, function() {
                        $(this).remove();
                    });
                }, 300);
            }
        );

        // Close popup when clicking a link
        popupMenu.find('a').click(function() {
            popupMenu.remove();
        });
    }

    // Hide popup menu
    function hidePopupMenu() {
        hideTimeout = setTimeout(function() {
            if (popupMenu) {
                popupMenu.fadeOut(200, function() {
                    $(this).remove();
                });
            }
        }, 300);
    }

    // Attach hover events to menu items (only parent items with submenus)
    $(document).on('mouseenter', '#sidebar-menu > a.sidebar-menu-item.has-arrow', function() {
        if ($('#modern-sidebar').hasClass('collapsed')) {
            showPopupMenu($(this));
        }
    });

    $(document).on('mouseleave', '#sidebar-menu > a.sidebar-menu-item.has-arrow', function() {
        if ($('#modern-sidebar').hasClass('collapsed')) {
            hidePopupMenu();
        }
    });

    // Close popup when sidebar is expanded
    $(document).on('click', '#vertical-menu-btn', function() {
        setTimeout(function() {
            if (!$('#modern-sidebar').hasClass('collapsed')) {
                $('.sidebar-popup-menu').remove();
            }
        }, 100);
    });
}
