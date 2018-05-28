Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj))
};

Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key))
};

function getRepos() {
    return $.ajax({
        url: "https://api.github.com/users/RBrNx/repos",
        headers: { "Accept": "application/vnd.github.v3+json", "Authorization": "token 17ffb6bf866640acdf5742250847a041188c97d0" },
        type: "GET",
        contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (data) {
            sessionStorage.setObj("repos", data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status + thrownError);
        }
    });
}

function getWebsiteInfoFromRepo(repoName) {
    return $.ajax({
        url: "https://api.github.com/repos/RBrNx/" + repoName + "/contents/websiteinfo.json",
        headers: { "Accept": "application/vnd.github.v3+json", "Authorization": "token 17ffb6bf866640acdf5742250847a041188c97d0" },
        type: "GET",
        contentType: "application/json; charset=utf-8",
        cache: true,
        success: function (data) {
            var base64 = data.content;
            var json = b64DecodeUnicode(base64.replace(/\s/g, ''));
            json = JSON.parse(json);
            addRepositoryToPortfolio(json);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            //console.log(xhr.status + thrownError);
        }
    });
}

function addRepositoryToPortfolio(infoJSON) {
    if (infoJSON.show != true) return;

    var column;
    if ($(".grid-container-right").children().length < $(".grid-container-left").children().length) {
        column = $(".grid-container-right");
    }
    else {
        column = $(".grid-container-left");
    }

    var gridItem = $("<div class='grid-item'></div>").appendTo(column);
    var image = $("<img src='" + infoJSON.image + "'/>").appendTo(gridItem);
    var captionContainer = $("<div class='captions'></div>").appendTo(gridItem);
    var titleCaption = $("<div class='title-caption'>" + infoJSON.title + "</div>").appendTo(captionContainer);
    var descriptionCaption = $("<div class='description-caption'>" + infoJSON.description + "</div>").appendTo(captionContainer);
}

function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

$(document).ready(function () {
    $.when(getRepos()).done(function () {
        var repos = sessionStorage.getObj("repos");

        for (var i = 0; i < repos.length; i++) {
            getWebsiteInfoFromRepo(repos[i].name);
        }
    });
});