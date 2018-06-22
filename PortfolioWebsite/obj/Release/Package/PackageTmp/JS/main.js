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

function setPageScroll(scrollTop) {
    if (scrollTop) lastScrollTop = scrollTop;

    $(".page-current").off("scroll").scroll(function (event) {
        var st = $(this).scrollTop();

        if (st > lastScrollTop) {
            $("#header").addClass("scrolling-bottom").removeClass("scrolling-top");
        } else {
            $("#header").addClass("scrolling-top").removeClass("scrolling-bottom");
        }
        lastScrollTop = st;
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

    function gridItemOnClick(){
        var gridItem = $(this).parents(".grid-item");
        var pagename = gridItem.attr("data-pagename");

        loadRepoPage(gridItem);

        var currURL = window.location.href;
        history.pushState(pagename, null, currURL + "#" + pagename);
    }

    gridItem.click(function (event) {
        event.stopPropagation();
        var item = $(this);
        var lastItem = $(".grid-item.clicked");

        lastItem.removeClass("clicked");
        setTimeout(function () { lastItem.removeClass("finishedEnter") }, 900);

        item.addClass("clicked");
        setTimeout(function () { item.addClass("finishedEnter") }, 900);

        item.find(".captions, .caption-button").off().click(gridItemOnClick);

        $(".main-container").off("click").click(function () {
            var item = $(".grid-item.clicked");
            item.removeClass("clicked");
            setTimeout(function () { item.removeClass("finishedEnter") }, 900);
        });
    });

    gridItem.find(".captions").click(gridItemOnClick);
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
        $("<div class='image'><img src='img/" + websiteJSON.carouselImages[i] + "'/></div>").appendTo("#portfolio-item-page #page-wrapper .carousel")
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

    setTimeout(function () {
        $(".portfolio-home").addClass("show").click(function () {
            animatePages("#portfolio-item-page", "#portfolio-grid-page", {
                animation: "Scale Up / Scale Up",
                beforeAnimStart: function () {
                    $("#header").addClass("scrolling-top").removeClass("scrolling-bottom");
                    $(".carousel").css({ "height": "400px" });
                },
                onAnimEnd: function () {
                    $(".carousel").slick("unslick");
                    setPageScroll(0);
                }
            });
            history.pushState("Portfolio", null, "Portfolio");
            $(this).removeClass("show").off("click");
        });
    }, 800);

    //animateToSubpage();
    animatePages("#portfolio-grid-page", "#portfolio-item-page", {
        animation: "Scale Down / Scale Down",
        beforeAnimStart: function () {
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
        },
        onAnimEnd: function () {
            setPageScroll(0);
        }
    });
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
                                }, 100);

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
//$(".loading-overlay").hide();
//$(".portfolio-grid").css("opacity", "1");

function onLoadComplete() {
    var urlPath = window.location.pathname;
    var urlHash = window.location.hash.replace("#", "");

    //$(".circle-main").removeClass("scale-mid").addClass("scale-max");
    //$(".loading-overlay").css("opacity", "0");
    setTimeout(function () { $(".loading-overlay").hide(); }, 1010);
    $(".portfolio-grid").addClass("fadeInUp");
    $(".title-container").addClass("fadeInDown");

    if (urlHash != "") {
        if (urlPath.startsWith("/Portfolio")) {
            var portfolioItem = $(".grid-item[data-pagename='" + urlHash + "']");
            loadRepoPage(portfolioItem);
        }
    }
    else {

    }
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
    
    $(toPage).addClass("page-current");


    if (_options.beforeAnimStart) {
        var func = _options.beforeAnimStart;
        func();
    }

    $(fromPage).addClass(fromAnimation).on("animationend", function () {
        $(fromPage).off("animationend");
        $(fromPage).removeClass("page-current " + fromAnimation);
    });
    $(toPage).addClass(toAnimation + " pt-page-delay300").on("animationend", function () {
        $(toPage).off("animationend");
        $(toPage).removeClass(toAnimation + " pt-page-delay300");

        if (_options.onAnimEnd) {
            var func = _options.onAnimEnd;
            func();
        }
    });
}

$(document).ready(function () {
    $.getJSON("github.json", function (data) {
        sessionStorage.setItem("token", data.token);

        $.when(getRepos()).done(function () {
            var repos = sessionStorage.getObj("repos");

            for (var i = 0; i < repos.length; i++) {
                repositories.push(repos[i].name);
                getWebsiteInfoFromRepo(repos[i].name, repos[i].id);
            }
        });
    });

    window.addEventListener('popstate', function (e) {
        // e.state is equal to the data-attribute of the last image we clicked
        if (e.state == null || e.state == "Portfolio") {
            //animateToHomepage();
            animatePages(".main-page.page-current", "#portfolio");
        }
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

    $(".menu-item").click(function () {
        var currActive = $(".menu-item.active");
        var newActive = $(this);

        var pageFrom = currActive.attr("data-page");
        var pageTo = newActive.attr("data-page");
        var options = {
            beforeAnimStart: function () { },
            onAnimEnd: function () { }
        };

        if ($(".menu-item").index(currActive) > $(".menu-item").index(newActive)) {
            options.animation = "Fade Right / Fade Left";
        }
        else {
            options.animation = "Fade Left / Fade Right";
        }

        //TODO: Push to history, change URL
        //TODO: Add fade-in for blog

        currActive.removeClass("active");
        newActive.addClass("active");

        $("#side-menu .close").click();

        setTimeout(function () {
            animatePages(pageFrom, pageTo, options);
        }, 400);
    });
});