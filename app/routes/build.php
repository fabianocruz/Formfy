<?php

require './app/controller/DocumentManager.php';
include_once('./resources/lib/simpledom/simple_html_dom.php');

// check if user is logged in using middleware
$app->get('/build', $checkUser, function() use ($app){
    $tplpath = "./app/view/build.html";
    $template = file_get_contents($tplpath);
    echo $template;
});

$app->map('/build/add', function() {
    echo "I respond to multiple HTTP methods!";
})->via('GET', 'POST');
 
// Edit.
$app->get('/build/(:id)', $checkUser, function($id) use ($app) {

	$tplpath = "./app/view/build.html";
	$myClass = new DocumentManager($tplpath);
	$attachement = $myClass->getAttachment($id);
	//$document = $myClass->loadTemplate();

	// Create a DOM object from a HTML template
	$buildHtml = $myClass->getHtml($tplpath, $attachement);
	
	echo $buildHtml;
		
});


?>