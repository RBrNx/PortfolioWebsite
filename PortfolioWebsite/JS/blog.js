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
            addBlogToGrid(blogs[i]);
        }
    });
});

function addBlogToGrid(blogJSON) {
    if (blogJSON.show !== true) return;

    var column = $("#blog .grid-container-left");

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
    
    var captionContainer = $("<div class='captions'></div>").appendTo(gridItem);
    var titleCaption = $("<div class='title-caption'>" + blogJSON.title + "</div>").appendTo(captionContainer);
    var descriptionCaption = $("<div class='description-caption'>" + blogJSON.description + "</div>").appendTo(captionContainer);
    var captionButton = $("<div class='caption-button'>Learn More<i class='fas fa-angle-right'></i></div>").appendTo(captionContainer);   

    function gridItemOnClick() {
        var gridItem = $(this);
        var pagename = gridItem.attr("data-pagename");

        loadBlog(gridItem);

        var currURL = window.location.href;
        history.pushState(pagename, null, currURL + "#" + pagename);
    }

    gridItem.click(gridItemOnClick);
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
    });


    setTimeout(function () {
        $(".blog-home").addClass("show").click(function () {
            animatePages("#blog-page", "#blog-grid-page", {
                animation: "Scale Up / Scale Up",
            });
            history.pushState("Blog", null, "Blog");
            $(this).removeClass("show").off("click");
        });
    }, 800);

    animatePages("#blog-grid-page", "#blog-page", {
        animation: "Scale Down / Scale Down",
        onAnimEnd: function () {
            setPageScroll(0);
        }
    });
}