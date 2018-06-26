Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj));
};

Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key));
};

// Define the function here
$.fn.copyAllAttributes = function (sourceElement) {
    // 'that' contains a pointer to the destination element
    var that = this;

    // Place holder for all attributes
    var allAttributes = $(sourceElement).prop("attributes");

    if (allAttributes && $(that).length === 1) {
        $.each(allAttributes, function () {
            // Ensure that class names are not copied but rather added
            if (this.name === "class") {
                that.addClass(this.value);
            } else {
                that.attr(this.name, this.value);
            }

        });
    }

    return that;
};

var repositories = [];
var imgManager = new imageManager({ "onEmpty": imageManagerOnEmpty });
var lastScrollTop = 0;
var pageLoaded = false;
var breakpoint = {};

breakpoint.refreshValue = function () {
    this.value = window.getComputedStyle(document.querySelector('body'), ':before').getPropertyValue('content').replace(/\"/g, '');
};

$(window).resize(function () {
    breakpoint.refreshValue();
}).resize()

function setPageScroll(scrollTop) {
    if (scrollTop) lastScrollTop = scrollTop;

    $(".sub-page.page-current").off("scroll").scroll(function (event) {
        var st = $(this).scrollTop();

        if (st > lastScrollTop) {
            $("#header").addClass("scrolling-bottom").removeClass("scrolling-top");
        } else {
            $("#header").addClass("scrolling-top").removeClass("scrolling-bottom");
        }
        lastScrollTop = st;

        if ($("#blog-page").scrollTop() >= 200) {
            $(".mouse-scroll").addClass("hidden");
        }
        else {
            $(".mouse-scroll").removeClass("hidden");
        }
    });
}

function getRepos() {
    return $.ajax({
        url: "https://api.github.com/users/RBrNx/repos",
        headers: { "Accept": "application/vnd.github.v3+json", "Authorization": "token " + sessionStorage.getItem("token") },
        type: "GET",
        contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (data) {
            var filtered = data.filter(x => x.fork !== true);
            sessionStorage.setObj("repos", filtered);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status + thrownError);
        }
    });
}

function getWebsiteInfoFromRepo(repoName, repoID) {
    return $.ajax({
        url: "https://api.github.com/repos/RBrNx/" + repoName + "/contents/websiteinfo.json",
        headers: { "Accept": "application/vnd.github.v3+json", "Authorization": "token " + sessionStorage.getItem("token") },
        type: "GET",
        contentType: "application/json; charset=utf-8",
        cache: true,
        success: function (data) {
            var base64 = data.content;
            var json = b64DecodeUnicode(base64.replace(/\s/g, ''));
            json = JSON.parse(json);

            var repos = sessionStorage.getObj("repos");
            var currRepo = repos.find(r => r.id === repoID);
            currRepo.websitejson = json;
            sessionStorage.setObj("repos", repos);

            addRepositoryToPortfolio(json, repoID);
        },
        error: function (xhr, ajaxOptions, thrownError) {

        }
    });
}

function addRepositoryToPortfolio(infoJSON, repoID) {
    if (infoJSON.show !== true) return;

    var column = $("#portfolio .grid-container-left");

    var gridItem = $("<div class='grid-item' data-repoid='" + repoID + "' data-pagename='" + infoJSON.title.replace(/ /g, "-") + "'></div>").appendTo(column);
    var imageMain = $("<img class='imageMain' src='" + infoJSON.imageMain + "'/>").appendTo(gridItem);
    var imageDrop = $("<img class='imageDrop' src='" + infoJSON.imageDrop + "'/>").appendTo(gridItem);
    var captionContainer = $("<div class='captions'></div>").appendTo(gridItem);
    var titleCaption = $("<div class='title-caption'>" + infoJSON.title + "</div>").appendTo(captionContainer);
    var descriptionCaption = $("<div class='description-caption'>" + infoJSON.description + "</div>").appendTo(captionContainer);
    var captionButton = $("<div class='caption-button'>Learn More<i class='fas fa-angle-right'></i></div>").appendTo(captionContainer);

    imgManager.addImage(imageMain, infoJSON.imageMain);
    imgManager.addImage(imageDrop, infoJSON.imageDrop);

    function gridItemOnClick() {
        event.stopPropagation();

        var gridItem = null;

        if ($(this).is(".grid-item")) {
            gridItem = $(this);
        }
        else {
            gridItem = $(this).parents(".grid-item");
        }

        var pagename = gridItem.attr("data-pagename");

        gridItem.find(".captions, .caption-button").off("click");

        page("/Portfolio/" + pagename);
    }

    gridItem.click(function (event) {
        //event.stopPropagation();

        if(breakpoint.value == "desktop"){
            var func = $.proxy(gridItemOnClick, this);
            func();
        }
        else {
            var item = $(this);
            var lastItem = $(".grid-item.clicked");

            lastItem.removeClass("clicked");
            setTimeout(function () { lastItem.removeClass("finishedEnter") }, 900);

            item.addClass("clicked");
            setTimeout(function () { item.addClass("finishedEnter") }, 900);

            $(".main-container").off("click").click(function () {
                var item = $(".grid-item.clicked");
                item.removeClass("clicked");
                setTimeout(function () { item.removeClass("finishedEnter") }, 900);
            });
        }

        $(this).find(".captions, .caption-button").off().click(gridItemOnClick);
    });

    //gridItem.find(".captions").click(gridItemOnClick);
}

function loadRepoPage(portfolioItem) {
    var repoID = $(portfolioItem).attr("data-repoid");

    var repos = sessionStorage.getObj("repos");
    var currRepo = repos.find(r => r.id == repoID);
    var websiteJSON = currRepo.websitejson;

    $("#portfolio-item-page #title").text(websiteJSON.title);
    $("#portfolio-item-page #subtitle").text(websiteJSON.description);

    $("#portfolio-item-page #page-wrapper .carousel").empty();
    for (var i = 0; i < websiteJSON.carouselImages.length; i++) {
        $("<div class='image'><img src='/img/" + websiteJSON.carouselImages[i] + "'/></div>").appendTo("#portfolio-item-page #page-wrapper .carousel")
    }

    $("#portfolio-item-page #page-wrapper .info .description .text").html(websiteJSON.aboutProject);

    $("#portfolio-item-page #page-wrapper .info .techSheet .list").empty();
    for (var i = 0; i < websiteJSON.techSheet.length; i++) {
        $("<li>" + websiteJSON.techSheet[i] + "</li>").appendTo("#portfolio-item-page #page-wrapper .info .techSheet .list");
    }

    $("#portfolio-item-page #page-wrapper .info .links").empty();
    for (var i = 0; i < websiteJSON.links.length; i++) {
        var linkIcon = null;

        switch (websiteJSON.links[i].linkType) {
            case "github":
                linkIcon = '<i class="fab fa-github"></i>';
                break;
            case "youtube":
                linkIcon = '<i class="fab fa-youtube"></i>';
                break;
            case "external":
            default:
                linkIcon = '<i class="fas fa-external-link-alt"></i>';
                break;
        }

        var link = $("<a href='" + websiteJSON.links[i].link + "' target='_blank'>" + websiteJSON.links[i].linkText + "</a>").appendTo("#portfolio-item-page #page-wrapper .info .links");
        $(linkIcon).prependTo(link);
    }
}

function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

function imageManagerOnEmpty() {
    sortPortfolio();
    //hideOverlay();
    pageLoaded = true;
}

function animateBond() {
    var width = $(".timeline").width();
    var circlesToFlash = $(".circle").not(".circle-main");
    var currCircle = 0;

    $(".circle-main").animate({
        left: (width + 50) + "px"
    }, {
        duration: 5000,
        easing: "linear",
        step: function () {
            var currLeft = $(".circle-main").position().left;
            var targetLeft = 0;

            if (circlesToFlash.eq(currCircle).length) {
                targetLeft = circlesToFlash.eq(currCircle).offset().left;

                if (currLeft >= targetLeft) {

                    if (currCircle == 4 && pageLoaded) {
                        $(".circle-main").stop();
                        $(".circle-main").addClass("scale-mid");

                        setTimeout(function () {
                            var currTransform = $(".circle-main").css('transform').split(/[()]/)[1];
                            var TransX = parseFloat(currTransform.split(',')[4]);

                            var pos = ($(".loading-overlay").width() / 2) - ($(".circle-main")[0].getBoundingClientRect().width / 2) - TransX;

                            $(".circle-main").animate({
                                left: pos + "px"
                            }, 1500, "linear", function () {
                                
                                setTimeout(function () {
                                    onLoadComplete();
                                }, 0);

                                $(".loading-overlay").addClass("circle-intro");

                                $(".loading-overlay").animate({
                                    backgroundColor: "rgba(255,255,255,0)"
                                }, 1250, "linear");

                                setTimeout(function () {
                                    var realCircleSize = $(".circle-main").width();

                                    $(".loading-overlay").animate({
                                        width: realCircleSize + (realCircleSize / 2),
                                        height: realCircleSize + (realCircleSize / 2)
                                    }, {
                                        duration: 750,
                                        queue: false,
                                        easing: "linear"
                                    });
                                }, 750);
                            });
                        }, 1000)
                        
                        
                    }
                    else {
                        circlesToFlash.eq(currCircle).css("background", "white");
                        circlesToFlash.eq(currCircle).animate({ backgroundColor: 'rgba(255,255,255,0)' }, 1000);
                        currCircle++;
                    }

                }
            }
        },
        complete: function () {
            if (!pageLoaded || !$(".circle-main").hasClass("scale-mid")) {
                $(".circle-main").css("left", "-50px");
                animateBond();
            }
        }
    });
}
animateBond();

function getNavigationType(urlFrom, urlTo) {
    if (urlFrom == null) return "onLoad";

    var urlFromSplit = urlFrom.split("/");
    var urlToSplit = urlTo.split("/");

    if (urlFromSplit[1].toLowerCase() != urlToSplit[1].toLowerCase()) return "fromDiffPage";

    return "fromSamePage";
}

function preNavigation(ctx, next) {
    if ($("#header").hasClass("animate-left")) {
        $("#side-menu .close").click();
        setTimeout(next, 400);
    }
    else {
        next();
    }
}

function navigateToPortfolioGrid(ctx, next) {
    var urlFrom = previousURL;
    var urlTo = ctx.path;
    var type = getNavigationType(urlFrom, urlTo);

    var pageFrom = null;
    var pageTo = null;
    var animation = null;
    var beforeAnimStart = function () { };
    var onAnimEnd = function () { };

    $(".menu-item.active, .nav-item.active").removeClass("active");
    $(".menu-item[href='/Portfolio'], .nav-item[href='/Portfolio']").addClass("active");

    if (type == "onLoad") {
        $("#portfolio-grid-page .portfolio-grid").addClass("fadeInUp");
        $("#portfolio-grid-page .title-container").addClass("fadeInDown");
        next();
        return;
    }
    else if(type == "fromSamePage") {
        animation = "Scale Up / Scale Up";
        pageFrom = "#portfolio .sub-page.page-current";
        pageTo = "#portfolio-grid-page";
        beforeAnimStart = function () {
            $("#header").addClass("scrolling-top").removeClass("scrolling-bottom");
            $(".carousel").css({ "height": "500px" });
        };
        onAnimEnd = function () {
            $(".carousel").slick("unslick");
            setPageScroll(0);
        };
    }
    else if (type == "fromDiffPage") {
        switch (urlFrom.split("/")[1]) {
            case "Blog":
                animation = "Fade Right / Fade Left";
                break;
        }
        pageFrom = ".main-page.page-current";
        pageTo = "#portfolio";
        beforeAnimStart = function () {
            makePageCurrent("#portfolio-grid-page");
        }
        onAnimEnd = function () {
            setPageScroll(0);
        };
    }

    animatePages(pageFrom, pageTo, {
        animation: animation,
        beforeAnimStart: beforeAnimStart,
        onAnimEnd: onAnimEnd
    });

    next();
}

function navigateToPortfolioItem(ctx, next) {
    var navPage = ctx.params.page;
    var gridItem = $("#portfolio-grid-page .grid-item[data-pagename='" + navPage + "']");

    if (gridItem.length > 0) {
        loadRepoPage(gridItem);

        var urlFrom = previousURL;
        var urlTo = ctx.path;
        var type = getNavigationType(urlFrom, urlTo);

        var pageFrom = null;
        var pageTo = null;
        var animation = null;
        var beforeAnimStart = function () { };
        var onAnimEnd = function () { };

        setTimeout(function () {
            $(".portfolio-home").addClass("show").click(function () {
                $(this).removeClass("show").off("click");
            });
        }, 800);

        $(".menu-item.active, .nav-item.active").removeClass("active");
        $(".menu-item[href='/Portfolio'], .nav-item[href='/Portfolio']").addClass("active");

        function setupCarousel() {
            if ($(".carousel").hasClass("slick-initialized")) $(".carousel").slick("unslick");

            $(".carousel").slick({
                arrows: true,
                swipe: true,
                //infinite: true,
                dots: true,
                speed: 500
            });

            $(".slick-list").css({ "top": "50%", "transform": "translateY(-50%)" });

            var carouselHeight = 0;
            $(".carousel").find("img").each(function () {
                if ($(this).height() > carouselHeight) carouselHeight = $(this).height();
            });
            $(".carousel").css({ "height": carouselHeight });

            $("#header").addClass("scrolling-top").removeClass("scrolling-bottom");
            $("#portfolio-item-page").scrollTop(0);
        }

        if (type == "onLoad") {
            makePageCurrent("#portfolio-item-page");
            setupCarousel();
            next();
            return;
        }
        else if (type == "fromSamePage") {
            animation = "Scale Up / Scale Up";
            pageFrom = "#portfolio .sub-page.page-current";
            pageTo = "#portfolio-item-page";
            beforeAnimStart = function () {
                setupCarousel();
            };
            onAnimEnd = function () {
                setPageScroll(0);
            };
        }
        else if (type == "fromDiffPage") {
            switch (urlFrom.split("/")[1]) {
                case "Blog":
                    animation = "Fade Right / Fade Left";
                    break;
            }
            pageTo = "#portfolio";
            pageFrom = ".main-page.page-current";
            beforeAnimStart = function () {
                makePageCurrent("#portfolio-item-page");
                setupCarousel();
            };
            onAnimEnd = function () {
                setPageScroll(0);
            };
        }

        animatePages(pageFrom, pageTo, {
            animation: animation,
            beforeAnimStart: beforeAnimStart,
            onAnimEnd: onAnimEnd
        });
    }
    else {
        page("/Portfolio");
    }

    next();
}

function makePageCurrent(page) {
    if($(page).is(".main-page")){
        $(".main-page").removeClass("page-current");
        $(page).addClass("page-current");
    }
    else if ($(page).is(".sub-page")) {
        var parent = $(page).parents(".main-page");
        parent.find(".sub-page").removeClass("page-current");
        $(page).addClass("page-current");
    }
}

var previousURL = null;
function addToHistory(ctx, next) {
    previousURL = ctx.path;
}

function onLoadComplete() {
    setTimeout(function () { $(".loading-overlay").hide(); }, 1010);

    page("/", preNavigation, navigateToPortfolioGrid, addToHistory);
    page("/Portfolio", preNavigation, navigateToPortfolioGrid, addToHistory);
    page("/Portfolio/:page", preNavigation, navigateToPortfolioItem, addToHistory);
    page("/Blog", preNavigation, navigateToBlogGrid, addToHistory);
    page("/Blog/:page", preNavigation, navigateToBlogItem, addToHistory);
    page('*', preNavigation, navigateToPortfolioGrid, addToHistory);
    page();
}

function sortPortfolio() {
    var leftContainer = $("#portfolio .grid-container-left");
    var rightContainer = $("#portfolio .grid-container-right");
    var lastChildLeft = $("#portfolio .grid-container-left").children().last();
    var lastChildRight = $("#portfolio .grid-container-right").children().last();

    if (lastChildRight.length === 0) {
        lastChildLeft.appendTo("#portfolio .grid-container-right");

        lastChildLeft = $("#portfolio .grid-container-left").children().last();
        lastChildRight = $("#portfolio .grid-container-right").children().last();
    }

    while (leftContainer.height() > rightContainer.height() && lastChildLeft.position().top > lastChildRight.position().top + lastChildRight.height()) {
        lastChildLeft.appendTo("#portfolio .grid-container-right");

        lastChildLeft = $("#portfolio .grid-container-left").children().last();
        lastChildRight = $("#portfolio .grid-container-right").children().last();
    }
}

function imageManager(options) {
    this.imageList = [];
    this.options = options || {};

    this.addImage = function (imgElement, srcValue) {
        var thisManager = this;
        var img = new Image();
        $(img).copyAllAttributes(imgElement);

        img.onload = function () {
            $(imgElement).replaceWith(this);
            thisManager.removeImage(this);
        };
        img.onerror = function () {
            console.log(img.src + " Failed to download");
            thisManager.removeImage(this);
        };

        //Set image src to the value.
        //This is done after the .onload is bound as otherwise the image may download before the .onload can be bound.
        img.src = srcValue;

        //Add image to global imageList
        this.imageList.push(img);
    };

    this.removeImage = function (img) {
        //Remove image from global imageList
        var ind = this.imageList.indexOf(img);
        this.imageList.splice(ind, 1);

        if (this.isEmpty()) {
            this.onEmpty();
        }
    };

    this.isEmpty = function () {
        return this.imageList.length === 0;
    };
    if (this.options["onEmpty"] !== null) this.onEmpty = options.onEmpty;
}

function animatePages(fromPage, toPage, options) {
    var _fromP = $(fromPage);
    var _toP = $(toPage);
    var _options = options || { animation: "Fade Left / Fade Right" };
    var fromAnimation = null;
    var toAnimation = null;

    switch (_options.animation) {
        case "Scale Down / Scale Down":
            fromAnimation = "pt-page-scaleDown";
            toAnimation = "pt-page-scaleUpDown";
            break;
        case "Scale Up / Scale Up":
            fromAnimation = "pt-page-scaleDownUp";
            toAnimation = "pt-page-scaleUp";
            break;
        case "Fade Left / Fade Right":
            fromAnimation = "pt-page-moveToLeftFade";
            toAnimation = "pt-page-moveFromRightFade";
            break;
        case "Fade Right / Fade Left":
            fromAnimation = "pt-page-moveToRightFade";
            toAnimation = "pt-page-moveFromLeftFade";
            break;
    }
    
    _toP.addClass("page-current");
    $(".main-page").addClass("animating");


    if (_options.beforeAnimStart) {
        var func = _options.beforeAnimStart;
        func();
    }

    _fromP.addClass(fromAnimation).on("animationend", function () {
        _fromP.off("animationend");
        _fromP.removeClass("page-current " + fromAnimation);
    });
    $(toPage).addClass(toAnimation + " pt-page-delay300").on("animationend", function () {
        _toP.off("animationend");
        _toP.removeClass(toAnimation + " pt-page-delay300");

        $(".main-page").removeClass("animating");

        if (_options.onAnimEnd) {
            var func = _options.onAnimEnd;
            func();
        }
    });
}

$(document).ready(function () {
    $.getJSON("/github.json", function (data) {
        sessionStorage.setItem("token", data.token);

        $.when(getRepos()).done(function () {
            var repos = sessionStorage.getObj("repos");

            for (var i = 0; i < repos.length; i++) {
                repositories.push(repos[i].name);
                getWebsiteInfoFromRepo(repos[i].name, repos[i].id);
            }
        });
    });

    setPageScroll();

    $(".navbar-toggle").click(function (event) {
        event.stopPropagation();
        $("#side-menu").css({ "display": "block" });
        $(".page-current, #header").addClass("animate-left");

        function closeSidebar(event) {
            event.stopPropagation();
            $(".page-current, #header").removeClass("animate-left");
            setTimeout(function () { $("#side-menu").css({ "display": "none" }); }, 350);
            $("#side-menu .close, .page-current").off("click");
        }

        $("#side-menu .close, .page-current").click(closeSidebar);
    });

    //$(".menu-item, .nav-item").click(function () {
    //    $(".menu-item.active, .nav-item.active").removeClass("active");
    //    var href = $(this).attr("href");
    //    $(".menu-item[href='" + href + "'], .nav-item[href='" + href + "']").addClass("active");
    //});
});
