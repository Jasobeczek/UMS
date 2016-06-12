<?php
/**
 * Server class
 * Database query for Postgresql
 * 
 * @author Jan Sobczak
 * 
 */

class DBServer{
    /**
     * Data base connection (mysqli)
     * @var object
     */
    protected $dbconn;
    /**
     * Set up the data base connection
     * @param string $host    Host
     * @param string $login        DB login
     * @param string $password     DB password
     * @param string $databaseName DB name
     */
    public function __construct($host, $login, $password, $databaseName){
        $conn_string = "host=$host port=5432 dbname=$databaseName user=$login password=$password";
        $this->dbconn = pg_pconnect($conn_string);
        #$this->dbconn->query("SET NAMES utf8"); 
        #$this->dbconn->set_charset("utf8");
        if(!$this->dbconn){
            die("error connectin to db");
        }
    }
    /**
     * Get saved data base connection object (mysqli)
     * @return object data base connection (mysqli)
     */
    public function getDbconnection(){
        return $this->dbconn;
    }
    
    /**
     * Perform query on saved data base
     * Return false on error return true on queries like delete and result on quieries like select
     * @param  string $sql SQL query
     * @return mixed (bool, object) True, false or result
     */
    public function performDbQuery($sql){
        $result = pg_query($this->dbconn, $sql);
        if (!$result) {
            die("error");
        }
        else return $result;
    }
    /**
     * Fetch result to array
     * @param  pg_query result $result Result from query
     * @return Array         Array with results
     */
    public function fetchResult($result){
        return pg_fetch_all($result);
    }
    /**
     * Make escape string data
     * @param string $data 
     * @return string
     */
    public function escapeString($data){
        return $this->dbconn->escape_string($data);   
    }
    public function closeDbConnection(){
        pg_close($this->dbconn);
    }
}

?>