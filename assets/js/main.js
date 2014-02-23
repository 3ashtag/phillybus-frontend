$(window).load(function() {
    if (document.URL.indexOf('#') == -1) {
        if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i)) {
            if (window.pageYOffset < 20) {
                window.scrollTo(0, 1);
            }
        }
    } else {
        // Better way to offset loading the page by anchor? This jumps when it loads.
        $("html, body").scrollTop($(location.hash).offset().top - 20);
    }
});

$(document).ready(function () {
    $("a.navbar-brand, ul.nav li a, .jumbotron .btn").click(function (event) {
        event.preventDefault();
        $(".navbar-collapse.in").collapse("hide");
        $("html, body").stop().animate({
            scrollTop: $($(this).attr("href")).offset().top - 20
        }, 500);
        if (history.pushState) {
            history.pushState(null, null, $(this).attr("href"));
        } else {
            location.hash = $(this).attr("href");
        }
    });
});

(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
    m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m)
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-48335809-1', 'phillybusfinder.com');
ga('send', 'pageview');
