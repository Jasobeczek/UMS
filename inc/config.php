<?php
/**
 * Server and session configuration for ums-proj
 * 
 * This file is responsible for configuring database connection
 * 
 * @author Jan Sobczak
 */
require 'server_class.php';
if (!isset($dbServer)){
    $dbServer = new DBServer('localhost', 'ums', 'ums.123', 'ums');
}
?>