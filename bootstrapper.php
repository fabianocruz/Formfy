<?php
require './resources/lib/slim/Slim.php';

$app = new Slim(array(
    'mode' => 'development'
));

$app->setName('formfy');

// check if user is logged in.
$checkUser = function() use ($app) {
    //if(!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) $app->redirect('/notloggedin');
	return true;
};

$app->configureMode('production', function () use ($app) {
    $app->config(array(
        'log.enable' => true,
        'log.path' => '../logs',
        'debug' => false,
		'templates.path' => '../templates'
    ));
});

$app->configureMode('development', function () use ($app) {
    $app->config(array(
        'log.enable' => false,
        'debug' => true,
		'templates.path' => '../templates'
    ));
});

require './app/routes/main.php';
require './app/routes/build.php';
require './app/routes/admin.php';

$app->run();
