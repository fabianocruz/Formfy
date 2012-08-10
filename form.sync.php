<?php
$couch_dsn = "http://localhost:5984/";
$couch_db = "formfy";

require_once "./resources/lib/couchdb/couch.php";
require_once "./resources/lib/couchdb/couchClient.php";
require_once "./resources/lib/couchdb/couchDocument.php";

$client = new couchClient($couch_dsn,$couch_db);

if ( !$client->databaseExists() ) {
	try {
		$client->createDatabase();
	} catch ( Exception $e ) {
		die("Unable to create the database : ".$e->getMessage());
	}
}

// read JSON input
$doc = json_decode(file_get_contents('php://input'));

// Do lots of devilishly clever analysis and processing here...
$success = processRequest($client, $doc);
$success = true;

if ($success == true){

	// Set up associative array
	$data = array('success'=> true,'message'=>'Success message: hooray!');

	// JSON encode and send back to the server
	echo json_encode($data);

}else{
	// Set up associative array
	$data = array('success'=> false,'message'=>'Failure message: boo!');

	// JSON encode and send back to the server
	echo json_encode($data);
}

function processRequest($client, $doc){
	var_dump($doc);

	try {
		$client->storeDoc($doc);
		return true;
	} catch ( Exception $e ) {
		die("Unable to store the document : ".$e->getMessage());
	}

	return false;
	
}


?>
