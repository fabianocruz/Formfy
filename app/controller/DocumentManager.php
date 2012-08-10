<?php

require_once "./resources/lib/couchdb/couch.php";
require_once "./resources/lib/couchdb/couchClient.php";
require_once "./resources/lib/couchdb/couchDocument.php";
require_once "./app/controller/CouchSimple.php";

include_once('./resources/lib/simpledom/simple_html_dom.php');

class DocumentManager {
 
	var $myVariable;

	private $couch_dsn;
	private $couch_db;

 	private $document;
    private $url;
 

	/**
	* Creates a new image finder object.
	*/
	public function __construct($url) {
		// Store url
		$this->url = $url;
		$this->couch_dsn = "http://localhost:5984/";
		$this->couch_db = "formfy";
	}

	public function getAttachment($id){

		$client = new couchClient($this->couch_dsn,$this->couch_db);

		$doc = $client->getDoc($id);

		//var_dump($doc);
		if ( $doc->_attachments ) {
			foreach ( $doc->_attachments as $fileName => $infos ) {
				//echo $name;//.' '.$doc->getAttachmentURI($name); 
				$attachmentURI = $this->utf8_urldecode("/formfy/$id/$fileName");
				//echo $attachmentURI;
			}
		}

		$options['host'] = "localhost"; 
		$options['port'] = 5984;

		$couch = new CouchSimple($options); // See if we can make a connection
		$resp = $couch->send("GET", $attachmentURI); 

		return $resp;

	}

	public function getHtml($tplpath, $attachement){

		// Create a DOM object from a HTML template
		$buildHtml = file_get_html($tplpath);

		// Create a DOM object from a string
		$fieldsFragment = str_get_html($attachement);

		foreach($buildHtml->find('div[id=drop]') as $e)
			$e->style ='display:none';

		foreach($buildHtml->find('ol[id=formFields]') as $e0){

			// find all span tags with class=gb1
			foreach($fieldsFragment->find('span.fieldSettings') as $e){
				$e->outertext = '<li draggable="true" id="field-1">'. $e->outertext .'</li>';
				//echo $e->outertext;

				$e0->innertext = $e0->innertext . $e->outertext;
			}

		//	echo $e0->outertext;

		}
		
		$this->document = $buildHtml->save();
		
		// clean up memory
	    $buildHtml->clear();
	    unset($buildHtml);
	    
		return $this->document;
	}

	/**
	* Loads the HTML from the url if not already done.
	*/
	public function loadTemplate() {
		// Return if already loaded
		if($this->document)
			return $this->document;

		// Get the HTML document
		$this->document = self::getHtmlDocument($this->url);
		return $this->document;
	}

   /**
	* Gets the html of a url and loads it up in a DOMDocument.
	*/
	private static function getHtmlDocument($tplpath) {
		// Create DOM document
		$document = new DOMDocument();
	   	$template = file_get_contents($tplpath);

		// Load document
		if($template){
			libxml_use_internal_errors(true);
			$document->loadHTML($template);
			libxml_clear_errors();
		}

		return $document;
	}

	function utf8_urldecode($str) {
	    $str = preg_replace("/%u([0-9a-f]{3,4})/i","&#x\\1;",urldecode($str));
	    return html_entity_decode($str,null,'UTF-8');;
  	}
 
}
 
?>