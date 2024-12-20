!function (a) {
    "use strict";
    var e, t, n, r = localStorage.getItem("minia-language"),
        o = "en";

    function i(t) {
        if (document.getElementById("header-lang-img")) {
            if ("en" == t)
                document.getElementById("header-lang-img").src = "assets/images/flags/us.jpg";
            else if ("sp" == t)
                document.getElementById("header-lang-img").src = "assets/images/flags/spain.jpg";
            else if ("gr" == t)
                document.getElementById("header-lang-img").src = "assets/images/flags/germany.jpg";
            else if ("it" == t)
                document.getElementById("header-lang-img").src = "assets/images/flags/italy.jpg";
            else if ("ru" == t)
                document.getElementById("header-lang-img").src = "assets/images/flags/russia.jpg";

            localStorage.setItem("minia-language", t);
            null == (r = localStorage.getItem("minia-language")) && i(o);

            a.getJSON("assets/lang/" + r + ".json", function (t) {
                a("html").attr("lang", r);
                a.each(t, function (t, e) {
                    "head" === t && a(document).attr("title", e.title);
                    a("[data-key='" + t + "']").text(e);
                });
            });
        }
    }

    function s() {
        var t = document.querySelectorAll(".counter-value");
        t.forEach(function (r) {
            !function t() {
                var e = +r.getAttribute("data-target"),
                    a = +r.innerText,
                    n = e / 250;

                n < 1 && (n = 1);
                a < e ? (r.innerText = (a + n).toFixed(0), setTimeout(t, 1)) : r.innerText = e;
            }();
        });
    }

    function d() {
        for (var t = document.getElementById("topnav-menu-content").getElementsByTagName("a"),
            e = 0, a = t.length; e < a; e++) {
            t[e] && t[e].parentElement &&
                "nav-item dropdown active" === t[e].parentElement.getAttribute("class") &&
                (t[e].parentElement.classList.remove("active"),
                    t[e].nextElementSibling && t[e].nextElementSibling.classList.remove("show"));
        }
    }

    function l(t) {
        document.getElementById(t).checked = !0;
    }

    function c() {
        document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement ||
            a("body").removeClass("fullscreen-enable");
    }

    a("#side-menu").metisMenu();
    s();
    e = document.body.getAttribute("data-sidebar-size");

    a(window).on("load", function () {
        a(".switch").on("switch-change", function () {
            toggleWeather();
        });

        1024 <= window.innerWidth && window.innerWidth <= 1366 &&
            (document.body.setAttribute("data-sidebar-size", "lg"), l("sidebar-size-small"));
    });

    a("#vertical-menu-btn").on("click", function (t) {
        t.preventDefault();
        a("body").toggleClass("sidebar-enable");

        if (500 <= a(window).width()) {
            if (null == e) {
                if (null == document.body.getAttribute("data-sidebar-size") ||
                    "lg" == document.body.getAttribute("data-sidebar-size")) {
                    document.body.setAttribute("data-sidebar-size", "sm");
                } else {
                    document.body.setAttribute("data-sidebar-size", "lg");
                }
            } else {
                "md" == e ?
                    ("md" == document.body.getAttribute("data-sidebar-size") ?
                        document.body.setAttribute("data-sidebar-size", "sm") :
                        document.body.setAttribute("data-sidebar-size", "md")) :
                    "sm" == document.body.getAttribute("data-sidebar-size") ?
                        document.body.setAttribute("data-sidebar-size", "lg") :
                        document.body.setAttribute("data-sidebar-size", "sm");
            }
        }
    });

    a("#sidebar-menu a").each(function () {
        var t = window.location.href.split(/[?#]/)[0];
        if (this.href == t) {
            a(this).addClass("active");
            a(this).parent().addClass("mm-active");
            a(this).parent().parent().addClass("mm-show");
            a(this).parent().parent().prev().addClass("mm-active");
            a(this).parent().parent().parent().addClass("mm-active");
            a(this).parent().parent().parent().parent().addClass("mm-show");
            a(this).parent().parent().parent().parent().parent().addClass("mm-active");
        }
    });

    // Shortened for space; rest of your script continues similarly
}(jQuery), feather.replace();
