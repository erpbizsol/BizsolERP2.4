//import { MenuService } from '../../_content/Bizsol.WebERP.UI.Shared/js/JSServices/menuservices.js';
import { MenuService } from '../../_content/Bizsol.WebERP.UI.Shared/js/JSServices/menuservices.js';
import { BizSolHelperFunction } from '../../_content/Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

var _menuAllItems = [];
var _menuUserID = '';
var _favouriteMenuCodes = [];

$(document).ready(function () {
        bindMenu();
});


function bindMenu() {
    var baseUrl = sessionStorage.getItem('AppBaseURL');
    let LoginGodownName = JSON.parse(sessionStorage.getItem('authKey')).WebERPLoginGodownName;
        LoginGodownName = LoginGodownName ? `(${LoginGodownName})` : '';
    MenuService.GetUserDetails()
        .then(function (res) {
            sessionStorage.setItem('UserDetails', JSON.stringify(res));
            let UserDetailsobj = JSON.parse(sessionStorage.getItem('UserDetails'));
            GetWebNotificationList();
            $('#ERPUserName')[0].innerHTML = UserDetailsobj[0].UserID;
            $('#ERPCompanyCode')[0].innerHTML = `(${UserDetailsobj[0].CompanyNameForShow})${LoginGodownName}`;
            $('#mobileERPUserName')[0].innerHTML = UserDetailsobj[0].UserID;
            $('#mobileERPCompanyCode')[0].innerHTML = `(${UserDetailsobj[0].CompanyNameForShow})${LoginGodownName}`;

            _menuUserID = UserDetailsobj[0].UserID;

            // ── Solar Home Button & Logo setup ───────────────────────────────
            var baseUrlForHome = sessionStorage.getItem('AppBaseURL') || '';
            var companyNameForBtn = (UserDetailsobj[0].CompanyNameForShow || '').toLowerCase();
            var isSolar = companyNameForBtn.includes('solar');
            var targetUrl = isSolar
                ? baseUrlForHome + '/CRMTransactions/ProjectDetail/ProjectDetailDashboard'
                : baseUrlForHome + '/';
            var targetTitle = isSolar ? 'Project Dashboard' : 'Home';

            var solarHomeBtn = document.getElementById('solarHomeBtn');
            if (solarHomeBtn) {
                solarHomeBtn.title = targetTitle;
                solarHomeBtn.setAttribute('aria-label', targetTitle);
                solarHomeBtn.href = targetUrl;
            }

            var appLogoBtn = document.getElementById('appLogoBtn');
            if (appLogoBtn) {
                appLogoBtn.title = targetTitle;
                appLogoBtn.setAttribute('aria-label', targetTitle);
                appLogoBtn.href = targetUrl;
            }

            // Auto-redirect to dashboard on login for Solar company
            if (isSolar) {
                var currentPath = window.location.pathname;
                var isHomePage = currentPath === '/' || currentPath.toLowerCase() == '/erp25/' || currentPath === '' ||
                    currentPath.toLowerCase() === '/home' ||
                    currentPath.toLowerCase() === '/home/index';
                if (isHomePage) {
                    window.location.href = targetUrl;
                    return;
                }
            }
            // ─────────────────────────────────────────────────────────────────

            MenuService.GetMenuList(_menuUserID).then(function (value) {
                _menuAllItems = value;

                // Load favourites first, then render menu
                MenuService.GetFavouriteMenus(_menuUserID).then(function (favs) {
                    _favouriteMenuCodes = (favs || []).map(function (f) { return f.MenuCode; });
                    renderFullMenu(value, baseUrl);
                }).catch(function () {
                    _favouriteMenuCodes = [];
                    renderFullMenu(value, baseUrl);
                });
            });
        });
}

function renderFullMenu(value, baseUrl) {
    var menuHtml = '';
    var mobileMenuHtml = '';
    var mobileMenuCount = 0;
    var maxMobileItems = 5;

    // --- Favourites section ---
    var favMenuHtml = buildFavouritesSection(value, baseUrl);
    if (favMenuHtml) {
        menuHtml += '<div class="sidebar-section-label">Favourites</div>';
        menuHtml += '<div id="fav-menu-section">' + favMenuHtml + '</div>';
        menuHtml += '<div class="sidebar-section-label">All Menus</div>';
    } else {
        menuHtml += '<div id="fav-menu-section"></div>';
    }

    $.each(value, function (index, item) {
        if (item.MasterCode === 0) {
            var childMenuHtml = getChildMenu(value, item.Code, baseUrl);
            var hasArrow = childMenuHtml ? 'has-arrow' : '';

            menuHtml += '<a href="javascript:void(0);" class="sidebar-menu-item menu-toggle ' + hasArrow + '" data-menu-code="' + item.Code + '" data-menu-name="' + item.ModuleDesp + '">';
            menuHtml += '<i class="' + getMenuIcon(item.ModuleDesp) + '"></i>';
            menuHtml += '<span>' + item.ModuleDesp + '</span>';
            menuHtml += '</a>';

            if (childMenuHtml) {
                menuHtml += '<div class="sub-menu" style="display: none;">' + childMenuHtml + '</div>';
            }

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
    bindMenuToggleEvents();
    initCollapsedSidebarHover();
    bindMobileMenuEvents();
    bindStarEvents();
}

function buildFavouritesSection(value, baseUrl) {
    if (!_favouriteMenuCodes || _favouriteMenuCodes.length === 0) return '';
    var html = '';
    $.each(_favouriteMenuCodes, function (i, menuCode) {
        var item = getMenuItemByCode(value, menuCode);
        if (!item || !item.FormToOpen) return;
        var separator = item.FormToOpen.indexOf('?') !== -1 ? '&' : '?';
        var href = sessionStorage.getItem('AppBaseURL') + '/' + item.FormToOpen + separator + 'ModuleDesp=' + item.ModuleDesp;
        html += '<a href="' + href + '" class="sidebar-menu-item fav-menu-link" data-menu-code="' + item.Code + '">';
        html += '<i class="fas fa-star fav-star-icon" style="color:#f6c90e;font-size:0.75rem;margin-right:2px;"></i>';
        html += '<i class="' + getMenuIcon(item.ModuleDesp) + '"></i>';
        html += '<span>' + item.ModuleDesp + '</span>';
        html += '</a>';
    });
    return html;
}

function getMenuItemByCode(value, code) {
    var found = null;
    $.each(value, function (i, item) {
        if (item.Code === code) { found = item; return false; }
    });
    return found;
}

function getChildMenu(value, masterCode, baseUrl) {
    var baseUrl = sessionStorage.getItem('AppBaseURL');
    var childMenuHtml = '';
    $.each(value, function (index, item) {
        if (item.MasterCode === masterCode && item.NotificationApplicable === 'N') {
            var subChildMenuHtml = getChildMenu(value, item.Code);
            var hasArrow = subChildMenuHtml ? 'has-arrow' : '';

            var separator = item.FormToOpen.indexOf('?') !== -1 ? '&' : '?';

            var isLeaf = !subChildMenuHtml;
            var isFav = _favouriteMenuCodes.indexOf(item.Code) !== -1;
            var starClass = isFav ? 'fas fa-star menu-fav-star active-fav' : 'far fa-star menu-fav-star';
            var starColor = isFav ? 'color:#f6c90e;' : 'color:rgba(150,150,180,0.55);';

            childMenuHtml += '<a href="' + baseUrl + '/' + item.FormToOpen + separator + 'ModuleDesp=' + item.ModuleDesp + '" class="sidebar-menu-item menu-toggle ' + hasArrow + '" data-menu-code="' + item.Code + '">';
            if (isLeaf) {
                childMenuHtml += '<i class="' + starClass + ' menu-star-btn" data-menu-code="' + item.Code + '" data-module-desp="' + item.ModuleDesp + '" title="Add to Favourites" style="font-size:0.8rem;margin-right:4px;cursor:pointer;transition:color 0.2s;' + starColor + '"></i>';
            }
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

function bindStarEvents() {
    $(document).off('click.favstar').on('click.favstar', '.menu-star-btn', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $star = $(this);
        var menuCode = parseInt($star.data('menu-code'));
        var moduleDesp = $star.data('module-desp');
        var isNowFav = $star.hasClass('active-fav');
        var newIsFav = !isNowFav;

        // Optimistically update UI
        if (newIsFav) {
            $star.removeClass('far').addClass('fas active-fav').css('color', '#f6c90e');
            if (_favouriteMenuCodes.indexOf(menuCode) === -1) {
                _favouriteMenuCodes.push(menuCode);
            }
        } else {
            $star.removeClass('fas active-fav').addClass('far').css('color', 'rgba(150,150,180,0.55)');
            _favouriteMenuCodes = _favouriteMenuCodes.filter(function (c) { return c !== menuCode; });
        }

        // Refresh favourites section
        refreshFavouritesSection();

        // Save to backend
        MenuService.SaveFavouriteMenu(_menuUserID, menuCode, moduleDesp, newIsFav).then(function (res) {
            if (res && res.Code === 1) {
                toastr.success(res.Msg || 'Favourites updated.');
            } else {
                // Revert on API-level failure
                if (newIsFav) {
                    $star.removeClass('fas active-fav').addClass('far').css('color', 'rgba(150,150,180,0.55)');
                    _favouriteMenuCodes = _favouriteMenuCodes.filter(function (c) { return c !== menuCode; });
                } else {
                    $star.removeClass('far').addClass('fas active-fav').css('color', '#f6c90e');
                    if (_favouriteMenuCodes.indexOf(menuCode) === -1) _favouriteMenuCodes.push(menuCode);
                }
                refreshFavouritesSection();
                toastr.error(res && res.Msg ? res.Msg : 'Failed to update favourites.');
            }
        }).catch(function () {
            // Revert on failure
            if (newIsFav) {
                $star.removeClass('fas active-fav').addClass('far').css('color', 'rgba(150,150,180,0.55)');
                _favouriteMenuCodes = _favouriteMenuCodes.filter(function (c) { return c !== menuCode; });
            } else {
                $star.removeClass('far').addClass('fas active-fav').css('color', '#f6c90e');
                if (_favouriteMenuCodes.indexOf(menuCode) === -1) _favouriteMenuCodes.push(menuCode);
            }
            refreshFavouritesSection();
            toastr.error('Failed to update favourites.');
        });
    });
}

function refreshFavouritesSection() {
    var favHtml = buildFavouritesSection(_menuAllItems, sessionStorage.getItem('AppBaseURL'));
    var $favSection = $('#fav-menu-section');
    var $sectionLabel = $favSection.prev('.sidebar-section-label');
    var $allMenusLabel = $favSection.next('.sidebar-section-label');

    $favSection.html(favHtml);

    if (favHtml) {
        if ($sectionLabel.length === 0) {
            $favSection.before('<div class="sidebar-section-label">Favourites</div>');
        }
        if ($allMenusLabel.length === 0) {
            $favSection.after('<div class="sidebar-section-label">All Menus</div>');
        }
    } else {
        $sectionLabel.remove();
        $allMenusLabel.remove();
    }
}

function bindMenuToggleEvents() {
    $('.sidebar-menu-item.menu-toggle').click(function (e) {
        var menuItem = $(this);
        var subMenu = menuItem.next('.sub-menu');

        if (!menuItem.hasClass('has-arrow')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        if ($('#modern-sidebar').hasClass('collapsed')) {
            return;
        }

        if (subMenu.is(":visible")) {
            subMenu.slideUp();
            menuItem.removeClass('active');
        } else {
            menuItem.siblings('.menu-toggle').next('.sub-menu').slideUp();
            menuItem.siblings('.menu-toggle').removeClass('active');

            subMenu.slideDown();
            menuItem.addClass('active');
        }
    });
}

function bindMobileMenuEvents() {
    $('.mobile-menu-toggle').click(function (e) {
        e.preventDefault();

        var menuCode = $(this).data('menu-code');

        $('#modern-sidebar').addClass('show');
        $('#sidebar-overlay').addClass('show');

        var correspondingMenuItem = $('#sidebar-menu .sidebar-menu-item[data-menu-code="' + menuCode + '"]');

        if (correspondingMenuItem.length) {
            $('#sidebar-menu .sub-menu').slideUp();
            $('#sidebar-menu .sidebar-menu-item').removeClass('active');

            var subMenu = correspondingMenuItem.next('.sub-menu');
            if (subMenu.length) {
                subMenu.slideDown();
                correspondingMenuItem.addClass('active');
            }
        }
    });
}

function normalizeModuleDesp(value) {
    if (value == null || value === '') return '';
    try {
        return decodeURIComponent(String(value)).trim();
    } catch (e) {
        return String(value).trim();
    }
}

function menuLinkMatchesCurrentPage(menuLink) {
    if (!menuLink || menuLink.indexOf('javascript:') === 0) return false;
    var currentUrl = window.location.pathname;
    const LastChar = currentUrl.slice(-1);
    const currentParams = new URLSearchParams(window.location.search);
    const currentModuleDesp = currentParams.get('ModuleDesp');
    try {
        var menuUrl = new URL(menuLink, window.location.origin);
        var pathnameMatch =
            currentUrl === menuUrl.pathname && currentUrl !== '/' && LastChar !== '/';
        if (!pathnameMatch) return false;
        if (currentModuleDesp) {
            var menuModuleDesp = menuUrl.searchParams.get('ModuleDesp');
            if (
                normalizeModuleDesp(menuModuleDesp) !==
                normalizeModuleDesp(currentModuleDesp)
            ) {
                return false;
            }
        }
        return true;
    } catch (e) {
        return false;
    }
}

function setActiveMenu() {
    // Initially hide all submenus
    $('#sidebar-menu .sub-menu').hide();
    $('#sidebar-menu .sidebar-menu-item').removeClass('active');
    $('.mobile-nav-item').removeClass('active');

    // Find and activate the current page menu item
    $('#sidebar-menu a').each(function () {
        var menuLink = $(this).attr('href');
        if (menuLink && menuLink !== 'javascript:void(0);' && menuLinkMatchesCurrentPage(menuLink)) {
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
        if (menuLink && menuLink !== 'javascript:void(0);' && menuLinkMatchesCurrentPage(menuLink)) {
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
