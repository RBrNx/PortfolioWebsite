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

function setPageScroll(scrollTop) {
    if (scrollTop) lastScrollTop = scrollTop;

    $(".pt-page-current").scroll(function (event) {
        var st = $(this).scrollTop();

        if (st > lastScrollTop) {
            $("#header").addClass("scrolling-bottom").removeClass("scrolling-top");
        } else {
            $("#header").addClass("scrolling-top").removeClass("scrolling-bottom");
        }
        lastScrollTop = st;

        //$(".grid-item").removeClass("inViewport")
        //$(".grid-item").isInViewport({ tolerance: 100, viewport: $("#viewport-tolerance") }).addClass("inViewport");
    });
}

function getRepos() {
    return $.ajax({
        url: "https://api.github.com/users/RBrNx/repos",
        headers: { "Accept": "application/vnd.github.v3+json", "Authorization": "token 29c51fd68b37d7b76866ef6bb7ab6538d3b7d9c7" },
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
        headers: { "Accept": "application/vnd.github.v3+json", "Authorization": "token 29c51fd68b37d7b76866ef6bb7ab6538d3b7d9c7" },
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

    var column = $(".grid-container-left");

    var gridItem = $("<div class='grid-item' data-repoid='" + repoID + "'></div>").appendTo(column);
    //var title = $("<div class='title'>" + infoJSON.title + "</div>").appendTo(gridItem);
    //var body = $("<div class='body'></div>").appendTo(gridItem);
    var imageMain = $("<img class='imageMain' src='" + infoJSON.imageMain + "'/>").appendTo(gridItem);
    var imageDrop = $("<img class='imageDrop' src='" + infoJSON.imageDrop + "'/>").appendTo(gridItem);
    var captionContainer = $("<div class='captions'></div>").appendTo(gridItem);
    var titleCaption = $("<div class='title-caption'>" + infoJSON.title + "</div>").appendTo(captionContainer);
    var descriptionCaption = $("<div class='description-caption'>" + infoJSON.description + "</div>").appendTo(captionContainer);
    var captionButton = $("<div class='caption-button'>Learn More<i class='fas fa-angle-right'></i></div>").appendTo(captionContainer);

    imgManager.addImage(imageMain, infoJSON.imageMain);
    imgManager.addImage(imageDrop, infoJSON.imageDrop);

    gridItem.click(function (event) {
        event.stopPropagation();
        var item = $(this);
        var lastItem = $(".grid-item.clicked");

        lastItem.removeClass("clicked");
        setTimeout(function () { lastItem.removeClass("finishedEnter") }, 900);

        item.addClass("clicked");
        setTimeout(function () { item.addClass("finishedEnter") }, 900);

        item.find(".caption-button").off().click(function () {
            loadRepoPage($(this).parents(".grid-item"));
        })

        $(".main-container").off("click").click(function () {
            var item = $(".grid-item.clicked");
            item.removeClass("clicked");
            setTimeout(function () { item.removeClass("finishedEnter") }, 900);
        });
    });
}

function loadRepoPage(portfolioItem) {
    var repoID = $(portfolioItem).attr("data-repoid");

    var repos = sessionStorage.getObj("repos");
    var currRepo = repos.find(r => r.id == repoID);
    var websiteJSON = currRepo.websitejson;

    $(".portfolio-page #title").text(websiteJSON.title);
    $(".portfolio-page #subtitle").text(websiteJSON.description);

    $(".portfolio-page #page-wrapper .carousel").empty();
    for (var i = 0; i < websiteJSON.carouselImages.length; i++) {
        $("<div class='image'><img src='img/" + websiteJSON.carouselImages[i] + "'/></div>").appendTo(".portfolio-page #page-wrapper .carousel")
    }

    $(".portfolio-page #page-wrapper .info .description .text").html(websiteJSON.aboutProject);

    $(".portfolio-page #page-wrapper .info .techSheet .list").empty();
    for (var i = 0; i < websiteJSON.techSheet.length; i++) {
        $("<li>" + websiteJSON.techSheet[i] + "</li>").appendTo(".portfolio-page #page-wrapper .info .techSheet .list");
    }

    $(".portfolio-page #page-wrapper .info .links").empty();
    for (var i = 0; i < websiteJSON.links.length; i++) {
        $("<a href='" + websiteJSON.links[i].link + "' target='websiteJSON.links'><i class='fas fa-external-link-alt'></i>" + websiteJSON.links[i].linkText + "</a>").appendTo(".portfolio-page #page-wrapper .info .links");
    }

    animateToSubpage();
}

function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

function imageManagerOnEmpty() {
    sortPortfolio();
    hideOverlay();
}

function hideOverlay() {
    $(".loading-overlay").css({ "opacity": "0" });
    setTimeout(function () { $(".loading-overlay").hide(); }, 510);
    $(".portfolio-grid").addClass("fadeInUp");
    $("#header, .title-container").addClass("fadeInDown");
}

function sortPortfolio() {
    var leftContainer = $(".grid-container-left");
    var rightContainer = $(".grid-container-right");
    var lastChildLeft = $(".grid-container-left").children().last();
    var lastChildRight = $(".grid-container-right").children().last();

    if (lastChildRight.length === 0) {
        lastChildLeft.appendTo(".grid-container-right");

        lastChildLeft = $(".grid-container-left").children().last();
        lastChildRight = $(".grid-container-right").children().last();
    }

    while (leftContainer.height() > rightContainer.height() && lastChildLeft.position().top > lastChildRight.position().top + lastChildRight.height()) {
        lastChildLeft.appendTo(".grid-container-right");

        lastChildLeft = $(".grid-container-left").children().last();
        lastChildRight = $(".grid-container-right").children().last();
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

function animateToSubpage() {
    $(".page-2").addClass("pt-page-current");

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

    $(".page-1").addClass("pt-page-scaleDown").on("animationend", function () {
        $(".page-1").off("animationend");
        $(".page-1").removeClass("pt-page-current pt-page-scaleDown");
    });
    $(".page-2").addClass("pt-page-scaleUpDown pt-page-delay300").on("animationend", function () {
        $(".page-2").off("animationend");
        $(".page-2").removeClass("pt-page-scaleUpDown pt-page-delay300");

        $(".portfolio-home").css({ "transform": "translateX(0)" }).click(animateToHomepage);

        setPageScroll(0);
    });
}

function animateToHomepage() {
    $(".page-1").addClass("pt-page-current");

    $("#header").addClass("scrolling-top").removeClass("scrolling-bottom");

    $(".portfolio-home").css({ "transform": "translateX(100px)" }).off("click");

    $(".carousel").css({ "height": "400px" });

    $(".page-2").addClass("pt-page-scaleDownUp").on("animationend", function () {
        $(".page-2").off("animationend");
        $(".page-2").removeClass("pt-page-current pt-page-scaleDownUp");

        $(".carousel").slick("unslick");
    });
    $(".page-1").addClass("pt-page-scaleUp pt-page-delay300").on("animationend", function () {
        $(".page-1").off("animationend");
        $(".page-1").removeClass("pt-page-scaleUp pt-page-delay300");

        setPageScroll(0);
    });
}

$(document).ready(function () {
    $.when(getRepos()).done(function () {
        var repos = sessionStorage.getObj("repos");

        for (var i = 0; i < repos.length; i++) {
            repositories.push(repos[i].name);
            getWebsiteInfoFromRepo(repos[i].name, repos[i].id);
        }
    });

    setPageScroll();

    $(".navbar-toggle").click(function (event) {
        event.stopPropagation();
        $("#side-menu").css({ "display": "block" });
        $(".pt-page-current, #header").addClass("animate-left");

        function closeSidebar(event) {
            event.stopPropagation();
            $(".pt-page-current, #header").removeClass("animate-left");
            setTimeout(function () { $("#side-menu").css({ "display": "none" }); }, 350);
            $("#side-menu .close, .pt-page-current").off("click");
        }

        $("#side-menu .close, .page-1").click(closeSidebar);
    });
});