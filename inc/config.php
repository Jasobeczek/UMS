<?php
/**
 * Server and session configuration for umsproj
 * 
 * This file is responsible for configuring database connection
 * and session handler.
 * 
 * @author Jan Sobczak
 */
require 'server_class.php';
if (!isset($dbServer)){
    $dbServer = new DBServer('localhost', 'ums', 'ums.123', 'ums');
}
?>