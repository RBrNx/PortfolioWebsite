/// <reference path="main.js" />

$(document).ready(function () {
    $.getJSON("/blogs/blogs.json", function (data) {
        sessionStorage.setObj("blogs", data.blogs);

        function dateSort(a, b) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }

        var blogs = data.blogs;
        blogs.sort(dateSort);

        for (var i = 0; i < blogs.length; i++) {
            addBlogToGrid(blogs[i], i);
        }
    });
});

function addBlogToGrid(blogJSON, index) {
    if (blogJSON.show !== true) return;

    var column = (breakpoint.value == "smartphone") ? $("#blog .grid-container-phone") :
        (index % 2 == 0) ? $("#blog .grid-container-left") : $("#blog .grid-container-right");

    var gridItem = $("<div class='grid-item' data-id='" + blogJSON.id + "' data-pagename='" + blogJSON.title.replace(/ /g, "-") + "'></div>").appendTo(column);
    if (blogJSON.imageMain !== "") {
        var imageMain = $("<img class='imageMain' src='" + blogJSON.imageMain + "'/>").appendTo(gridItem);
        var imageDrop = $("<img class='imageDrop' src='" + blogJSON.imageDrop + "'/>").appendTo(gridItem);

        imgManager.addImage(imageMain, blogJSON.imageMain);
        imgManager.addImage(imageDrop, blogJSON.imageDrop);
    }
    else {
        var main = $("<div class='main'><div class='text'>" + blogJSON.titleHTML + "</div></div>").appendTo(gridItem);
    }
    
    //var captionContainer = $("<div class='captions'></div>").appendTo(gridItem);
    //var titleCaption = $("<div class='title-caption'>" + blogJSON.title + "</div>").appendTo(captionContainer);
    //var descriptionCaption = $("<div class='description-caption'>" + blogJSON.description + "</div>").appendTo(captionContainer);
    //var captionButton = $("<div class='caption-button'>Learn More<i class='fas fa-angle-right'></i></div>").appendTo(captionContainer);   

    function gridItemOnClick() {
        event.stopPropagation();

        var gridItem = $(this);
        var pagename = gridItem.attr("data-pagename");

        page("/Blog/" + pagename);
    }

    gridItem.click(gridItemOnClick);
}

function navigateToBlogGrid(ctx, next) {
    var urlFrom = ctx.state.currURL;
    var urlTo = ctx.path;
    var type = getNavigationType(urlFrom, urlTo);

    var pageFrom = null;
    var pageTo = null;
    var animation = null;
    var beforeAnimStart = function () { };
    var onAnimEnd = function () { };

    if (type == "onLoad") {
        $(".main-page.page-current").removeClass("page-current");
        $("#blog").addClass("page-current");

        $(".menu-item.active, .nav-item.active").removeClass("active");
        $(".menu-item[href='/Blog'], .nav-item[href='/Blog']").addClass("active");

        $("#blog-grid-page .blog-grid").addClass("fadeInUp");
        $("#blog-grid-page header").addClass("fadeInDown");
        return;
    }
    else if (type == "fromSub") {
        animation = "Scale Up / Scale Up";
        pageFrom = "#blog .sub-page.page-current";
        pageTo = "#blog-grid-page"
        beforeAnimStart = function () {
            $("#header").addClass("scrolling-top").removeClass("scrolling-bottom");
        };
        onAnimEnd = function () {
            setPageScroll(0);
        };
    }
    else if (type == "fromMain") {
        animation = "Fade Left / Fade Right";
        pageFrom = ".main-page.page-current";
        pageTo = "#blog";
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

function navigateToBlogItem(ctx, next) {
    var navPage = ctx.params.page;
    var gridItem = $("#blog-grid-page .grid-item[data-pagename='" + navPage + "']");

    if (gridItem.length > 0) {
        loadBlog(gridItem);

        var urlFrom = ctx.state.currURL;
        var urlTo = ctx.path;
        var type = getNavigationType(urlFrom, urlTo);

        var pageFrom = null;
        var pageTo = null;
        var animation = null;
        var beforeAnimStart = function () { };
        var onAnimEnd = function () { };

        setTimeout(function () {
            $(".blog-home").addClass("show").click(function () {
                $(this).removeClass("show").off("click");
            });
        }, 800);

        if (type == "onLoad") {
            $(".main-page.page-current").removeClass("page-current");
            $("#blog").addClass("page-current");

            $(".menu-item.active, .nav-item.active").removeClass("active");
            $(".menu-item[href='/Blog'], .nav-item[href='/Blog']").addClass("active");

            $("#blog-grid-page").removeClass("page-current");
            $("#blog-page").addClass("page-current");

            setPageScroll(0);
            return;
        }
        else if (type == "fromSub" || type == "fromMain") {
            animation = "Scale Down / Scale Down";
            pageFrom = "#blog .sub-page.page-current";
            pageTo = "#blog-page";
            beforeAnimStart = function () {
                $("#header").addClass("scrolling-top").removeClass("scrolling-bottom");
                $("#blog-page").scrollTop(0);
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
    }
    else {
        page("/Blog");
    }
}

function loadBlog(gridItem) {
    var id = $(gridItem).attr("data-id");

    var blogs = sessionStorage.getObj("blogs");
    var currBlog = blogs.find(b => b.id == id);

    $("#blog-page").load("/blogs/" + currBlog.file, function () {
        $("#blog-page .title").html(currBlog.titleHTML);
        $("#blog-page .subtitle").html(currBlog.description);
        $("#blog-page .publish-date").text(new Date(currBlog.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }));

        Prism.highlightAllUnder($("#blog-page")[0]);
        new SimpleBar($('#blog-page')[0])
    });
}