
function rotatorRegisterClick(id, desktop, featuredFileId) {
    featuredFileId = featuredFileId||-1;
    $.get("/servlet/rotator/click.gif?id="+id+"&desktop="+desktop+"&featuredFileId="+featuredFileId+"&rnd="+Math.random());
    return true;
}