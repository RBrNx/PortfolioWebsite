Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj))
};

Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key))
};

// Define the function here
$.fn.copyAllAttributes = function (sourceElement) {
    // 'that' contains a pointer to the destination element
    var that = this;

    // Place holder for all attributes
    var allAttributes = $(sourceElement).prop("attributes");

    if (allAttributes && $(that).length == 1) {
        $.each(allAttributes, function () {
            // Ensure that class names are not copied but rather added
            if (this.name == "class") {
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

function getRepos() {
    return $.ajax({
        url: "https://api.github.com/users/RBrNx/repos",
        headers: { "Accept": "application/vnd.github.v3+json", "Authorization": "token bfdf9cb10c21e87aa083b99b61341b256b4e8e63" },
        type: "GET",
        contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (data) {
            var filtered = data.filter(x => x.fork != true);
            sessionStorage.setObj("repos", filtered);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status + thrownError);
        }
    });
}

function getWebsiteInfoFromRepo(repoName) {
    return $.ajax({
        url: "https://api.github.com/repos/RBrNx/" + repoName + "/contents/websiteinfo.json",
        headers: { "Accept": "application/vnd.github.v3+json", "Authorization": "token bfdf9cb10c21e87aa083b99b61341b256b4e8e63" },
        type: "GET",
        contentType: "application/json; charset=utf-8",
        cache: true,
        success: function (data) {
            var base64 = data.content;
            var json = b64DecodeUnicode(base64.replace(/\s/g, ''));
            json = JSON.parse(json);

            addRepositoryToPortfolio(json);

            //var index = repositories.indexOf(repoName);
            //repositories.splice(index, 1);

            //if (repositories.length == 0) hideOverlay();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            //console.log(xhr.status + thrownError);
            //var index = repositories.indexOf(repoName);
            //repositories.splice(index, 1);

            //if (repositories.length == 0) hideOverlay();
        }
    });
}

function addRepositoryToPortfolio(infoJSON) {
    if (infoJSON.show != true) return;

    var column = $(".grid-container-left");

    var gridItem = $("<div class='grid-item'></div>").appendTo(column);
    var image = $("<img src='" + infoJSON.image +"'/>").appendTo(gridItem);
    var captionContainer = $("<div class='captions'></div>").appendTo(gridItem);
    var titleCaption = $("<div class='title-caption'>" + infoJSON.title + "</div>").appendTo(captionContainer);
    var descriptionCaption = $("<div class='description-caption'>" + infoJSON.description + "</div>").appendTo(captionContainer);

    imgManager.addImage(image, infoJSON.image);
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
    setTimeout(function () { $(".loading-overlay").hide(); }, 510)
    $(".portfolio-grid").addClass("fadeInUp");
    $("#header, .title-container").addClass("fadeInDown");
}

function sortPortfolio() {
    var leftContainer = $(".grid-container-left");
    var rightContainer = $(".grid-container-right");
    var lastChildLeft = $(".grid-container-left").children().last();
    var lastChildRight = $(".grid-container-right").children().last();

    if (lastChildRight.length == 0) {
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
        }
        img.onerror = function () {
            console.log(img.src + " Failed to download");
            thisManager.removeImage(this);
        }

        //Set image src to the value.
        //This is done after the .onload is bound as otherwise the image may download before the .onload can be bound.
        img.src = srcValue;

        //Add image to global imageList
        this.imageList.push(img);
    }

    this.removeImage = function (img) {
        //Remove image from global imageList
        var ind = this.imageList.indexOf(img);
        this.imageList.splice(ind, 1);

        if (this.isEmpty()) {
            this.onEmpty();
        }
    }

    this.isEmpty = function () {
        return this.imageList.length == 0;
    }

    if (this.options["onEmpty"] != null) this.onEmpty = options.onEmpty;
}

$(document).ready(function () {
    $.when(getRepos()).done(function () {
        var repos = sessionStorage.getObj("repos");

        for (var i = 0; i < repos.length; i++) {
            repositories.push(repos[i].name);
            getWebsiteInfoFromRepo(repos[i].name);
        }
    });
});