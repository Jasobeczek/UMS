$(document).ready(function() {
    $('#searchUser').keyup(function() {
        console.log("Handler for .keypress() called: " + $('#searchUser').val());
        if ($('#searchUser').val() === "" || $('#searchUserResults').css("display") === 'none') {
            $('#searchUserResults').dropdown('toggle');
        } else {
            searchName($('#searchUser').val());
        }

    });

    $('#searchUser').keypress(function() {
        if ($('#searchUser').val() === "") {
            $('#searchUserResults').dropdown('toggle');
        }
    });
});

function logOut() {
    $.ajax({
        type: "GET",
        url: "inc/log_out.php",
        context: document.body,
        cache: false,
        timeout: 3000,
        error: function() {
            alert("Oj coś poszło nie tak!");
        },
        success: function(response) {
            window.location.href = "index.html";
        }
    });
}

function searchName(searchName) {
    $.ajax({
        type: "POST",
        url: "inc/search_name.php",
        context: document.body,
        cache: false,
        timeout: 3000,
        data: ({
            SearchName: searchName,
        }),
        error: function() {
            alert("Oj coś poszło nie tak!");
        },
        success: function(response) {
            if (response == "error") {
                alert("Oj coś poszło nie tak!");
            } else {
                var responseArray = JSON.parse(response);
                $('#searchUserResults').empty(); //Remove all child nodes
                for (var i = 0; i < responseArray.length; i++) {
                    $('#searchUserResults').append("<li><a>" + responseArray[i]['login'] + "</a></li>");
                }
                $('#searchUserResults > li > a').on('click', function() {
                    $('#searchUser').val(this.innerText);
                });
            }
        }
    });
}

function connectToUser() {
    setRoom($('#searchUser').val());
    startRTC();
    return false;
}

/**
 * Init webRTC socket
 * @return {bool} false
 */
function startRTC() {
    $.ajax({
        type: "GET",
        url: "inc/get_user.php",
        context: document.body,
        cache: false,
        timeout: 30000,
        error: function() {
            alert("Oj coś poszło nie tak!");
        },
        success: function(response) {
            if (response !== "") {
                startWebRTC(response);
            }
        }
    });
    return false;
}

/**
 * Stop webRTC socket
 * @return {bool} false
 */
function stopRTC() {
    maybeStop();
}

function hangupCall() {
    hangup();
    reconnectSelf();
}
