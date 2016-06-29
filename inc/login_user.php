<?php
/**
 * THis login user
 * Create cookie for session
 * 
 * @author Jan Sobczak
 */
require_once("config.php");

$userName = @$_POST['UserLogin'];
$userPass = @$_POST['UserPassword'];

if (!is_null($userName) && !is_null($userPass)) {
	$sql = "SELECT * FROM tbl_user WHERE login='" . $userName . "' AND pass='" . md5($userPass) . "';";
	$results = $dbServer->performDbQuery($sql);
	if (pg_num_rows($results) != 0) {
		setcookie("umsName", $userName, time()+3600);
		echo "success";
	}
}
else die("error");
?>