<?php
/**
 * This search for user
 * 
 * @author Jan Sobczak
 */
require_once("config.php");

$searchName = @$_POST['SearchName'];

if (!is_null($searchName) && $searchName!="") {
	$sql = "SELECT login FROM tbl_user WHERE login LIKE ('%". $searchName ."%')";
	$results = $dbServer->performDbQuery($sql);
	echo json_encode($dbServer->fetchResult($results));	
}
else die("error");

?>