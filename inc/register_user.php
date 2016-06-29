<?php
/**
 * This register or login user
 * Create cookie for session
 */
require_once("config.php");

$userName = @$_POST['UserName'];
$userPass = @$_POST['UserPassword'];
$userRegister = @$_POST['UserRegister'];

if (!is_null($userName) && $userName!="" && $userPass != "" && !is_null($userPass)) {
	//Register
	if ($userRegister == "true") {
		$sql = "SELECT * FROM tbl_user WHERE login='" . $userName . "';";
		$results = $dbServer->performDbQuery($sql);
		if (pg_num_rows($results) == 0) {
			$sql = "INSERT INTO tbl_user VALUES (DEFAULT,'" . $userName . "','" . md5($userPass) . "')";
			$results = $dbServer->performDbQuery($sql);
			echo "success";
		}
		else die('exists');
	}
	//Login
	else{
		$sql = "SELECT * FROM tbl_user WHERE login='" . $userName . "' AND pass='" . md5($userPass) . "';";
		$results = $dbServer->performDbQuery($sql);
		if (pg_num_rows($results) != 0) {
			setcookie("umsName", $userName, time()+3600);
			echo "success";
		}
	}
}
else die("error");
?>