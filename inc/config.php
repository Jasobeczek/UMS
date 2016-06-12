<?php
require_once("server_class.php"); //Server class
require_once("session_class.php"); //SessionHandler class
/**
 * Server and session configuration for Data Room2
 * 
 * This file is responsible for configuring database connection
 * and session handler.
 * 
 * @author Jan Sobczak
 */
//Link prefix
$fileLinkBegin = "https://dr.smgkrc.com.pl/g/";

//Upload folder
$tempFolder = '/home/dataroom/upload/dr2_temp/';
$destinationFolder = '/home/dataroom/upload/dr2_upload/';
$logFolder = '/home/dataroom/upload/log/';

//Upload config
$invalidExtensionsRegExp = '/(\.php[0-9]*)$|(\.phtml)$/i';  
$invalidExtensionsMimes = array('text/x-php');

//Upload log
$uploadLogName = 'upload_log.log';
//Delete log
$deleteLogName = 'delete_log.log';

//LDAP API
$LDAPSecretKey = 'PAsQgEYh2Jj2EpDA2dD2Hv2E2GF4WdYYQhsgQVzZC3YtekKZg4FpZv4snBcDdySRcnKSjCUvfRAH3Ntd';
$LDAPSecretIv = 'rAQRs2F3zDBXk!aRZzgu45cREaAN%MUSSFxv6m9CQT8HVPM8fS%*s59@sWZmAkW6CNFmKR';

//Valid IP range
$friendIP = array(
    '172.21.0.0/16', 
    '91.230.24.0/24',
    '79.189.7.90/32', // Siekiea Biuro
    '195.162.17.90/32', // MB Biuro
    '37.128.83.75/32', // MB Biuro 2
    '82.197.32.150​/32', // RADOM
    '195.205.34.178/32', // Piekna
    '109.173.173.236/32', // Siekiera DOM
    // MASKA MUSI BYC!!!
    );  

//Set up DataRoom server
if (!isset($Server))
	$Server = new Server($LDAPSecretKey, $LDAPSecretIv,$destinationFolder, $tempFolder, $logFolder, $fileLinkBegin);
$Server->setUpDbConnection('localhost','dataroom','Ky44XXxt9Q8HFyUd','dataroom');
$Server->setLogNames($uploadLogName, $deleteLogName);

//Set up MySQL-session
if (!isset($Session))
	$Session = new Session($Server, "dataroom2_sessions", $friendIP);

//Set sessions variable
$Session->generateTodayPin();
$Session->timeExpireLoginUser = 60 * 60 * 24 * 7; //7 days
$Session->timeExpirePinUser = 60 * 60 * 24; //1 day

//Override default session handlers
session_set_save_handler(array($Session, 'open'),
                         array($Session, 'close'),
                         array($Session, 'read'),
                         array($Session, 'write'),
                         array($Session, 'destroy'),
                         array($Session, 'gc'));

//The following prevents unexpected effects when using objects as save handlers.
register_shutdown_function('session_write_close');

//Start session
$Session->open();
