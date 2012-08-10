
$('#showmeTheCode').click(function() {
	//alert('Handler for .submit() called.');
	
	var id = '#dialog';

	//Get the screen height and width
	var maskHeight = $(document).height();
	var maskWidth = $(window).width();

	//Set heigth and width to mask to fill up the whole screen
	$('#mask').css({'width':maskWidth,'height':maskHeight});

	//transition effect		
	$('#mask').fadeIn(1000);	
	$('#mask').fadeTo("slow",0.8);	

	//Get the window height and width
	var winH = $(window).height();
	var winW = $(window).width();
         
	//Set the popup window to center
	$(id).css('top',  winH/2-$(id).height()/2);
	$(id).css('left', winW/2-$(id).width()/2);

	var data = $('[id^="data-"]');
	var formData = '';
	data.each(function(index){
		formData += $(this).text();
	});
	//alert(formData);

	var htmlPreview = $('[id^="finalPreview-"]');
	var formHtml = '';
	htmlPreview.each(function(index){
		formHtml += $(this).html();
	});
	
	//alert(formHtml);
	
	$(id).children('textarea').val(formData);

	//transition effect
	$(id).fadeIn(2000); 	

	//if close button is clicked
	$('.window .close').click(function (e) {
		//Cancel the link behavior
		e.preventDefault();

		$('#mask').hide();
		$('.window').hide();
	});		

	//if mask is clicked
	$('#mask').click(function () {
		$(this).hide();
		$('.window').hide();
	});
	
	var css = $("style:first").html();  //this will ver the first style tag
	$("#myCssTextarea")
	         .val("<style type='text/css'>"+css+"</style>");

	var html = "<!doctype html>" + $("html").html() + "</html>";
	//alert(html);

	$(id).children('textarea').last().val(formHtml);

//(self.location.href=page2...) 

/*
	$("#myTextarea")
	         .val(html)
	         .parents("form")
	         .submit();
 */
 
	return false;
});
