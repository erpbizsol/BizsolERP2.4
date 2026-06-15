//import { MenuService } from '../../_content/Bizsol.WebERP.UI.Shared/js/JSServices/menuservices.js';
import { MenuService } from '../../_content/Bizsol.WebERP.UI.Shared/js/JSServices/menuservices.js';
import { BizSolHelperFunction } from '../../_content/Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

var _menuAllItems = [];
var _menuUserID = '';
var _favouriteMenuCodes = [];
var _FAV_COLLAPSE_KEY = 'sidebarFavouritesCollapsed';

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

    // --- Favourites section (collapsible) ---
    var favMenuHtml = buildFavouritesSection(value, baseUrl);
    if (favMenuHtml) {
        menuHtml += buildFavouritesToggleHtml(getFavouritesCount());
        menuHtml += '<div id="fav-menu-section">' + favMenuHtml + '</div>';
        menuHtml += '<div class="sidebar-section-label sidebar-static-label">All Menus</div>';
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
    bindFavouritesToggleEvents();
    applyFavouritesCollapseState(false);
}

function getFavouritesCount() {
    if (!_favouriteMenuCodes || !_favouriteMenuCodes.length) return 0;
    var count = 0;
    $.each(_favouriteMenuCodes, function (i, code) {
        if (getMenuItemByCode(_menuAllItems, code)) count++;
    });
    return count;
}

function isFavouritesCollapsed() {
    return sessionStorage.getItem(_FAV_COLLAPSE_KEY) === '1';
}

function setFavouritesCollapsed(collapsed) {
    sessionStorage.setItem(_FAV_COLLAPSE_KEY, collapsed ? '1' : '0');
}

function buildFavouritesToggleHtml(count) {
    var collapsed = isFavouritesCollapsed();
    var activeClass = collapsed ? '' : ' active';
    var ariaExpanded = collapsed ? 'false' : 'true';
    var html = '<a href="javascript:void(0);" class="sidebar-fav-toggle has-arrow' + activeClass + '" id="fav-section-toggle" aria-expanded="' + ariaExpanded + '" title="Toggle Favourites">';
    html += '<i class="fas fa-star fav-toggle-icon" aria-hidden="true"></i>';
    html += '<span>Favourites</span>';
    if (count > 0) {
        html += '<span class="fav-count">' + count + '</span>';
    }
    html += '</a>';
    return html;
}

function applyFavouritesCollapseState(animate) {
    var $toggle = $('#fav-section-toggle');
    var $section = $('#fav-menu-section');
    if (!$toggle.length || !$section.length || !$section.children().length) {
        return;
    }

    var collapsed = isFavouritesCollapsed();
    if (collapsed) {
        $toggle.removeClass('active').attr('aria-expanded', 'false');
        if (animate) {
            $section.stop(true, true).slideUp(200);
        } else {
            $section.hide();
        }
    } else {
        $toggle.addClass('active').attr('aria-expanded', 'true');
        if (animate) {
            $section.stop(true, true).slideDown(200);
        } else {
            $section.show();
        }
    }
}

function bindFavouritesToggleEvents() {
    $(document).off('click.favtoggle').on('click.favtoggle', '#fav-section-toggle', function (e) {
        e.preventDefault();
        e.stopPropagation();

        if ($('#modern-sidebar').hasClass('collapsed')) {
            return;
        }

        setFavouritesCollapsed(!isFavouritesCollapsed());
        applyFavouritesCollapseState(true);
    });
}

function ensureFavouritesSectionChrome() {
    var $favSection = $('#fav-menu-section');
    var favHtml = $favSection.html();
    var hasFavs = favHtml && favHtml.trim().length > 0;
    var $favToggle = $('#fav-section-toggle');
    var $allMenusLabel = $favSection.next('.sidebar-static-label');

    if (hasFavs) {
        var count = getFavouritesCount();
        if ($favToggle.length === 0) {
            $favSection.before(buildFavouritesToggleHtml(count));
        } else {
            var $count = $favToggle.find('.fav-count');
            if (count > 0) {
                if ($count.length) {
                    $count.text(count);
                } else {
                    $favToggle.append('<span class="fav-count">' + count + '</span>');
                }
            } else {
                $count.remove();
            }
        }
        if ($allMenusLabel.length === 0) {
            $favSection.after('<div class="sidebar-section-label sidebar-static-label">All Menus</div>');
        }
    } else {
        $favToggle.remove();
        $allMenusLabel.remove();
    }
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
        html += '<i class="fas fa-star fav-star-icon" aria-hidden="true"></i>';
        html += '<i class="' + getMenuIcon(item.ModuleDesp) + '" aria-hidden="true"></i>';
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
            var starColor = isFav ? '' : 'menu-fav-inactive';

            childMenuHtml += '<a href="' + baseUrl + '/' + item.FormToOpen + separator + 'ModuleDesp=' + item.ModuleDesp + '" class="sidebar-menu-item menu-toggle ' + hasArrow + '" data-menu-code="' + item.Code + '">';
            if (isLeaf) {
                childMenuHtml += '<i class="' + starClass + ' menu-star-btn ' + starColor + '" data-menu-code="' + item.Code + '" data-module-desp="' + item.ModuleDesp + '" title="Add to Favourites" aria-label="Toggle favourite"></i>';
            }
            childMenuHtml += '<i class="' + getMenuIcon(item.ModuleDesp) + '" aria-hidden="true"></i>';
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
            $star.removeClass('far menu-fav-inactive').addClass('fas active-fav');
            if (_favouriteMenuCodes.indexOf(menuCode) === -1) {
                _favouriteMenuCodes.push(menuCode);
            }
        } else {
            $star.removeClass('fas active-fav').addClass('far menu-fav-inactive');
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
                    $star.removeClass('fas active-fav').addClass('far menu-fav-inactive');
                    _favouriteMenuCodes = _favouriteMenuCodes.filter(function (c) { return c !== menuCode; });
                } else {
                    $star.removeClass('far menu-fav-inactive').addClass('fas active-fav');
                    if (_favouriteMenuCodes.indexOf(menuCode) === -1) _favouriteMenuCodes.push(menuCode);
                }
                refreshFavouritesSection();
                toastr.error(res && res.Msg ? res.Msg : 'Failed to update favourites.');
            }
        }).catch(function () {
            // Revert on failure
            if (newIsFav) {
                $star.removeClass('fas active-fav').addClass('far menu-fav-inactive');
                _favouriteMenuCodes = _favouriteMenuCodes.filter(function (c) { return c !== menuCode; });
            } else {
                $star.removeClass('far menu-fav-inactive').addClass('fas active-fav');
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

    $favSection.html(favHtml);
    ensureFavouritesSectionChrome();

    if (favHtml) {
        applyFavouritesCollapseState(false);
        bindFavouritesToggleEvents();
        setActiveMenu();
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
    var activeInFavourites = false;

    $('#sidebar-menu a').each(function () {
        var menuLink = $(this).attr('href');
        if (menuLink && menuLink !== 'javascript:void(0);' && menuLinkMatchesCurrentPage(menuLink)) {
            $(this).addClass('active');

            if ($(this).closest('#fav-menu-section').length) {
                activeInFavourites = true;
            }

            // Show all parent submenus
            $(this).parents('.sub-menu').each(function() {
                $(this).show();
                // Also mark parent menu items as active
                $(this).prev('.menu-toggle').addClass('active');
            });
        }
    });

    if (activeInFavourites) {
        setFavouritesCollapsed(false);
        applyFavouritesCollapseState(false);
    }

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

    function removePopupMenu() {
        if (popupMenu) {
            popupMenu.remove();
            popupMenu = null;
        }
        $('.sidebar-popup-menu').remove();
    }

    function createFavouritesPopupMenu() {
        var favLinks = $('#fav-menu-section a.fav-menu-link');
        if (!favLinks.length) {
            return null;
        }

        var popupHtml = '<div class="sidebar-popup-menu sidebar-fav-popup">';
        popupHtml += '<div class="popup-menu-title"><i class="fas fa-star" style="margin-right:5px;font-size:0.6rem;color:#b45309;"></i>Favourites</div>';

        favLinks.each(function () {
            var $link = $(this);
            var name = $link.find('span').text();
            var href = $link.attr('href');
            var iconClass = 'fas fa-star';
            $link.find('i').each(function () {
                if (!$(this).hasClass('fav-star-icon')) {
                    iconClass = $(this).attr('class');
                    return false;
                }
            });

            popupHtml += '<a href="' + href + '" class="popup-menu-item">';
            popupHtml += '<i class="' + iconClass + '"></i>';
            popupHtml += '<span>' + name + '</span>';
            popupHtml += '</a>';
        });

        popupHtml += '</div>';
        return $(popupHtml);
    }

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

    function positionPopup($popup, $trigger) {
        var menuItemOffset = $trigger.offset();
        $popup.css({
            top: menuItemOffset.top + 'px',
            display: 'block'
        });
    }

    function bindPopupHover($popup) {
        var subMenuHideTimeout = null;

        $popup.find('.popup-menu-item.has-arrow').on('mouseenter', function () {
            clearTimeout(subMenuHideTimeout);
            var $subMenu = $(this).next('.popup-submenu');
            $popup.find('.popup-submenu').not($subMenu).slideUp(200);
            $subMenu.slideDown(200);
        }).on('mouseleave', function () {
            var $subMenu = $(this).next('.popup-submenu');
            subMenuHideTimeout = setTimeout(function () {
                $subMenu.slideUp(200);
            }, 300);
        });

        $popup.find('.popup-submenu').on('mouseenter', function () {
            clearTimeout(subMenuHideTimeout);
        }).on('mouseleave', function () {
            var $subMenu = $(this);
            subMenuHideTimeout = setTimeout(function () {
                $subMenu.slideUp(200);
            }, 300);
        });

        $popup.hover(
            function () {
                clearTimeout(hideTimeout);
            },
            function () {
                hidePopupMenu();
            }
        );

        $popup.find('a.popup-menu-item').click(function () {
            removePopupMenu();
        });
    }

    function showFavouritesPopup(triggerItem) {
        if (!$('#modern-sidebar').hasClass('collapsed')) {
            return;
        }

        removePopupMenu();
        clearTimeout(hideTimeout);

        popupMenu = createFavouritesPopupMenu();
        if (!popupMenu) {
            return;
        }

        $('body').append(popupMenu);
        positionPopup(popupMenu, triggerItem);
        bindPopupHover(popupMenu);
    }

    // Show popup menu
    function showPopupMenu(menuItem) {
        if (!$('#modern-sidebar').hasClass('collapsed')) {
            return;
        }

        removePopupMenu();
        clearTimeout(hideTimeout);

        popupMenu = createPopupMenu(menuItem);
        if (!popupMenu) {
            return;
        }

        $('body').append(popupMenu);
        positionPopup(popupMenu, menuItem);
        bindPopupHover(popupMenu);
    }

    // Hide popup menu
    function hidePopupMenu() {
        hideTimeout = setTimeout(function () {
            removePopupMenu();
        }, 300);
    }

    // Attach hover events to menu items (only parent items with submenus)
    $(document).on('mouseenter', '#sidebar-menu > a.sidebar-menu-item.has-arrow', function () {
        if ($('#modern-sidebar').hasClass('collapsed')) {
            showPopupMenu($(this));
        }
    });

    $(document).on('mouseleave', '#sidebar-menu > a.sidebar-menu-item.has-arrow', function () {
        if ($('#modern-sidebar').hasClass('collapsed')) {
            hidePopupMenu();
        }
    });

    // Favourites star — popup when sidebar collapsed
    $(document).on('mouseenter', '#fav-section-toggle', function () {
        if ($('#modern-sidebar').hasClass('collapsed')) {
            showFavouritesPopup($(this));
        }
    });

    $(document).on('mouseleave', '#fav-section-toggle', function () {
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
