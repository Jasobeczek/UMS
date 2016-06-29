<?php
/**
 * This register user
 * 
 * @author Jan Sobczak
 */
require_once("config.php");

$userLogin = @$_POST['UserLogin'];
$userPass = @$_POST['UserPassword'];
$userName = @$_POST['UserName'];
$userSurname = @$_POST['UserSurname'];

if (!is_null($userLogin) && !is_null($userPass) && !is_null($userName) && !is_null($userSurname)) {	
	$sql = "SELECT * FROM tbl_user WHERE login='" . $userLogin . "';";

	$results = $dbServer->performDbQuery($sql);
	if (pg_num_rows($results) == 0) {
		$sql = "INSERT INTO tbl_user VALUES (DEFAULT,'" . $userLogin . "','" . md5($userPass) . "', '" . $userName . "' , '" . $userSurname . "')";
		$results = $dbServer->performDbQuery($sql);
		echo "success";
	}
	else die('exists');
}
else die("error");
?>
