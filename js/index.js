/**
 * Login user
 * @return {bool} false
 */
function logInUser() {
    var user = $('#loginUser').val();
    var pass = $('#passUser').val();
    $.ajax({
        type: "POST",
        url: "inc/login_user.php",
        context: document.body,
        cache: false,
        timeout: 3000,
        data: ({
            UserLogin: user,
            UserPassword: pass,
        }),
        error: function() {
            alert("Coś poszło nie tak!");
        },
        success: function(response) {
            if (response == "success") {
                window.location.href = "call.html";
            } else alert("Coś poszło nie tak!");
        }
    });
    return false;
}

/**
 * Register new user
 * @return {bool} false
 */
function registerUser() {
    var loginUser = $('#loginUser').val();
    var passUser = $('#passUser').val();
    var nameUser = $('#nameUser').val();
    var surnameUser = $('#surnameUser').val();
    $.ajax({
        type: "POST",
        url: "inc/register_user.php",
        context: document.body,
        cache: false,
        timeout: 3000,
        data: ({
            UserLogin: loginUser,
            UserPassword: passUser,
            UserName: nameUser,
            UserSurname: surnameUser
        }),
        error: function() {
            alert("Coś poszło nie tak!");
        },
        success: function(response) {
            if (response == "success") {
                alert("Użytkownik zarejestrowany");
                window.location.href = "index.html";
            } else if (response == "exists") {
                alert("Taki użytkownik istnieje");
            } else alert("Coś poszło nie tak!");
        }
    });
    return false;
}
