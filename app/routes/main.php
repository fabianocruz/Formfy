<?php

// user log in
$app->get('/login', function() use ($app) {
    $_SESSION['logged_in'] = true;
    $app->redirect('/');
});

$app->get('/home/:name', function ($name) {
    $tplpath = "./app/view/index.html";
    $template = file_get_contents($tplpath);
    echo $template;
})->name('home')->conditions(array('name' => '\w+'));

// user log out
$app->get('/logout', function() use($app) {
    session_destroy();
    $app->redirect('/');
});

// check if user is logged in using middleware
$app->get('/', $checkUser, function() use ($app){
    //echo 'You are now logged in. <a href="/logout">Log out.</a>';
 	$app->redirect('home/mainPage');
});

// user is redirected here if not logged in
$app->get('/notloggedin', function() {
    echo 'You are not logged in. <a href="/login">Log in</a>.';
});

$app->get('/foo', function () use ($app) {
    $app->render('foo.php'); //<--SUCCESS
});

