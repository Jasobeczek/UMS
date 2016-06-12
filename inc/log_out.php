<?php
require_once("config.php");

setcookie("umsName", $userName, time()-3600);
echo "success";


?>