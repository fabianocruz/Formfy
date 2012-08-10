<?php

// check if user is logged in using middleware
$app->get('/admin', $checkUser, function() use ($app){
    $tplpath = "./app/view/forms.html";
    $template = file_get_contents($tplpath);
    echo $template;
});


?>