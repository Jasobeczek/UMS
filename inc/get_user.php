<?php
/**
 * Prolong session
 * Return login name (room name)
 * 
 * @author Jan Sobczak
 */
require_once("config.php");

echo @$_COOKIE['umsName'];
if (@$_COOKIE['umsName']) {
	$userName = @$_COOKIE['umsName'];
	setcookie("umsName", $userName, time()+3600);
}
?>