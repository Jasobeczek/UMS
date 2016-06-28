/**
 * Register or login user
 * @param  {bool} doRegister True - register, False - login
 * @return {bool}
 */
function authUser(doRegister) {
    var user = $('#loginName').val();
    var pass = $('#loginPass').val();
    $.ajax({
        type: "POST",
        url: "inc/register_user.php",
        context: document.body,
        cache: false,
        timeout: 30000,
        data: ({
            UserName: user,
            UserPassword: pass,
            UserRegister: doRegister,
        }),
        error: function() {
            alert("Coś poszło nie tak!");
        },
        success: function(response) {
            if (response == "success") {
                window.location.href = "call.html";
            } else if (response == "exists") {
                alert("Taki użytkownik istnieje");
            } else alert("Coś poszło nie tak!");
        }
    });
    return false;
}

/**
 * Register user
 */
function registerUser() {
    return authUser(true);
}

/**
 * Login user
 */
function loginUser() {
    return authUser(false);
}
