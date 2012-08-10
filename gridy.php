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

$all_docs = $client->getAllDocs();
//echo "Database got ".$all_docs->total_rows." documents.\n";

$list = array();
$index = 0;
foreach ( $all_docs->rows as $row ) {
    //echo "Document ".$row->id."\n";
	$doc = $client->getDoc($row->id);
	$list[$index] = array('id' => $doc->_id, 'title' => $doc->title, 'created' => $doc->date_create, 'viewed' => $doc->viewed, 'submitted' => $doc->submitted);
	$index++;
}

$data = array('list'=> $list, 'total' => $index);

echo $_GET['callback'].'('.json_encode($data).')';


?>

