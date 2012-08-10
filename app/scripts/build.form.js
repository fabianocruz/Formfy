var cmdOptions = ['#btnSingleline', '#btnParagraph', '#btnMultiple', '#btnCheckbox', '#btnNumeric', '#btnDropdown', '#btnRange', '#btnGrid', '#btnPassword', '#btnEmail', '#btnPhone', '#btnWebsite', '#btnDate', '#btnSectionBreak']; 

jQuery.each(cmdOptions, function (k) {
    $(cmdOptions[k]).click(function() {
		addField(cmdOptions[k].replace("#", ""));
    });
});

$('#btnSingleline, #btnParagraph, #btnMultiple, #btnCheckbox, #btnNumeric, #btndropdown, #btnRange, #btnGrid, #btnPassword, #btnEmail, #btnPhone, #btnWebsite, #btnDate, #btnSectionBreak').bind('dragstart', function(event) {
	event.originalEvent.dataTransfer.setData("text/plain", event.target.getAttribute('id'));
});

function handleDragStart(event) {
	//this.style.opacity = '0.4';  // this / e.target is the source node.
	event.originalEvent.dataTransfer.setData("text/plain", event.target.getAttribute('id'));
}

$('#fieldType, #formBuilder').bind('dragover', function(event) {  
	if (event.preventDefault) {
		event.preventDefault(); // Necessary. Allows to drop.
	}
});

$('#fieldType, #formBuilder').bind('drop', function(event) {  
	if (event.preventDefault) {
		event.preventDefault(); // Necessary. Allows to drop.
	}
	var type = event.originalEvent.dataTransfer.getData("text/plain");  
	addField(type);
});

Element.prototype.hasClassName = function(name) {
	return new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)").test(this.className);
};

Element.prototype.addClassName = function(name) {
	if (!this.hasClassName(name)) {
		this.className = this.className ? [this.className, name].join(' ') : name;
	}
};

Element.prototype.removeClassName = function(name) {
	if (this.hasClassName(name)) {
		var c = this.className;
		this.className = c.replace(new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)", "g"), "");
	}
};


var commandMap = {
	/*key|command: previewDivId, previewFieldId, fieldType*/
	'btnSingleline':['singleLinePreview', 'innerSingleLineText', 'singleLine'],
	'btnParagraph':['paragraphPreview', 'innerParagraph', 'paragraph'],
	'btnNumeric':['numericPreview', 'innerNumeric', 'numeric'],
	'btnEmail':['emailPreview', 'innerEmail', 'email'],
	'btnPhone':['phonePreview', 'innerPhone', 'phone'],
	'btnWebsite':['websitePreview', 'innerWebsite', 'website'],
	'btnDate':['datePreview', 'innerDate', 'date'],
	'btnPassword':['passwordPreview', 'innerPassword', 'password'],
	'btnRange':['rangePreview', 'innerRange', 'range'],
	'btnSectionBreak':['breakSectionPreview', 'intructionField', 'sectionBreak']	
};

function addField(cmd){
	
	//TODO: validate type
	
	var fieldId;

	if ( $("#formFields").children().length == 0)
		$("#drop").toggle();

	form = $("#formPreview");
	fields = form.find("li[id^='field-']");
	fieldId = new Number (fields.length + 1);

	if(cmd == "btnSectionBreak"){ 
		addSectionBreak(fieldId, cmd);	
		return false;
	}	

	addDefaultFieldSettings(fieldId);
	
	if(cmd == "btnSingleline"){ 
		addInputField(fieldId, cmd);
	} else if(cmd == "btnParagraph"){
		addInputField(fieldId, cmd);
	} else if(cmd == "btnNumeric"){
		addInputField(fieldId, cmd);
	} else if(cmd == "btnEmail"){
		addInputField(fieldId, cmd);
	} else if(cmd == "btnPhone"){
		addInputField(fieldId, cmd);
	} else if(cmd == "btnWebsite"){
		addInputField(fieldId, cmd);
	} else if(cmd == "btnDate"){
		addInputField(fieldId, cmd);
	} else if(cmd == "btnPassword"){
		addInputField(fieldId, cmd);
	} else if(cmd == "btnRange"){
		addInputField(fieldId, cmd);
	} else if(cmd == "btnMultiple"){
		//add default field settings options
		setFieldSettings(fieldId);
		//add inline preview box
		setMultiPreviewBox(fieldId,'multipleChoiceChoices','multipleChoiceOl', 'multipleChoiceLi', 'multipleAddChoiceLi');
		//add hiden final preview box
		setFinalMultiPreviewBox(fieldId,'multipleChoiceChoices','multipleChoiceOl', 'multipleChoiceLi');
		//set multiple choice option selected 
		setOptSelected(fieldId, 'multipleChoice')
	} else if(cmd == "btnCheckbox"){
		//add default field settings options
		setFieldSettings(fieldId);
		//add inline preview box
		setMultiPreviewBox(fieldId,'checkboxOptions','checkboxOptOl', 'checkboxOptLi', 'checkboxAddOptLi');
		//add hiden final preview box
		setFinalMultiPreviewBox(fieldId,'checkboxOptions', 'checkboxOptOl', 'checkboxOptLi');
		//set checkbox option selected  
		setOptSelected(fieldId, 'checkbox')
	} else if(cmd == "btnDropdown"){
		//add default field settings options
		setFieldSettings(fieldId);
		//add inline preview box
		setMultiPreviewBox(fieldId,'chooseFromListOptions','chooseFromListOl', 'chooseFromListLi', 'chooseFromAddListLi');
		//add hiden final preview box
		setFinalMultiPreviewBox(fieldId,'chooseFromListOptions','chooseFromListOl', 'chooseFromListPreviewLi');
		//set list option selected 
		setOptSelected(fieldId, 'list')
	} else if(cmd == "btnGrid"){
		//add default field settings options
		setFieldSettings(fieldId);
		$('#gridOptions').clone().attr('id', 'gridOptions-'+fieldId).appendTo('#fieldOpts-'+fieldId);
		//set list option selected 
		setOptSelected(fieldId, 'grid')
	}
	
}

function addInputField(fieldId, cmd){
	//add default field settings options
	setFieldSettings(fieldId);
	//add inline preview box
	setPreviewBox(fieldId,commandMap[cmd][0], commandMap[cmd][1]);
	//add hiden final preview box
	setFinalPreviewBox(fieldId,commandMap[cmd][0],commandMap[cmd][1]);
	//set singleLine option selected 
	setOptSelected(fieldId, commandMap[cmd][2]);
}

function setMultiPreviewBox(fieldId, previewDivId, previewFieldId, previewInput, previewAddInput){
	$('#'+previewDivId).clone().attr('id', 'preview-'+fieldId).appendTo('#fieldOpts-'+fieldId);
	$('#previewFieldName').clone().attr('id', 'previewFieldName-'+fieldId).appendTo('#preview-'+fieldId);
	previewField = ''+previewFieldId+'-'+fieldId; 
	$('#'+previewFieldId).clone().attr('id', previewField).appendTo('#preview-'+fieldId);
	//var inputId = fieldId - 1;
	$('#'+previewInput).clone().attr('id', ''+previewInput+'-'+fieldId).appendTo('#'+previewField);
	$('#'+previewInput+'-'+fieldId).children('input[type=text]').attr('id', 'optInput');
	$('#'+previewAddInput).clone().attr('id', ''+previewAddInput).appendTo('#'+previewField);
}

function setFinalMultiPreviewBox(fieldId, previewDivId, previewFieldId, previewInput){
	var $newdiv2 = $('<div class="boxPreview" id=finalField-'+fieldId+'>');
	$('#spanFields-'+fieldId).append($newdiv2);
	$('#'+previewDivId).clone().attr('id', 'finalPreview-'+fieldId).appendTo('#finalField-'+fieldId);
	$('#data').clone().attr('id', 'data-'+fieldId).appendTo('#finalField-'+fieldId);
	$('#finalPreview-'+fieldId).removeClass('preview');
	$('#finalPreview-'+fieldId).addClass('finalPreview');
	$('#previewFieldName').clone().attr('id', 'fieldName-'+fieldId).appendTo('#finalPreview-'+fieldId);
	$('#'+previewInput).clone().attr('id', ''+previewInput).appendTo('#finalPreview-'+fieldId);

	setSenchaTypeMetadata(fieldId, previewDivId);
}
	

function setFieldSettings(fieldId){
	$('#fieldSettings').clone().attr('id', 'settings-'+fieldId).appendTo('#fieldOpts-'+fieldId);
}

function setOptSelected(fieldId, optSelected){
	$('#dataType-'+fieldId+" option[value="+optSelected+"]").attr('selected', 'selected');
}

function setPreviewBox(fieldId, previewDivId, previewFieldId){
	$('#'+previewDivId).clone().attr('id', 'preview-'+fieldId).appendTo('#fieldOpts-'+fieldId);
	$('#previewFieldName').clone().attr('id', 'previewFieldName-'+fieldId).insertBefore('#'+previewFieldId);
	var previewFieldFinalId = ''+previewFieldId+'Preview-'+fieldId;
	$('#'+previewFieldId).attr('id', previewFieldFinalId);
	$('#'+previewFieldFinalId).removeClass('inputArea');
}

function setFinalPreviewBox(fieldId, previewDivId, previewFieldId){
	var $newdiv2 = $('<div class="boxPreview" id=finalField-'+fieldId+'>');
	$('#spanFields-'+fieldId).append($newdiv2);
	$('#'+previewDivId).clone().attr('id', 'finalPreview-'+fieldId).appendTo('#finalField-'+fieldId);
	$('#finalPreview-'+fieldId).removeClass('preview');
	$('#previewFieldName').clone().attr('id', 'fieldName-'+fieldId).insertBefore('#'+previewFieldId);
	$('#'+previewFieldId).attr('id', ''+previewFieldId+'-'+fieldId);
	$('#data').clone().attr('id', 'data-'+fieldId).appendTo('#finalField-'+fieldId);
	
	setSenchaTypeMetadata(fieldId, previewDivId);
} 

$(document).on('click', '#optRequired', function(e){
	var parentTagId = $(this).parent().get(0).id;
	var fieldId = parentTagId.substring(parentTagId.indexOf("-"));

	//TODO check true/false
	setSenchaFieldMetadata(fieldId.replace('-',''), true, 'required');
});

$(document).on('click', '#optReadOnly', function(e){
	var parentTagId = $(this).parent().get(0).id;
	var fieldId = parentTagId.substring(parentTagId.indexOf("-"));
	
	//TODO check true/false
	setSenchaFieldMetadata(fieldId.replace('-',''), true, 'disabled');
});

$(document).on('click', '#optDuplicate', function(e){
	var parentTagId = $(this).parent().get(0).id;
	var fieldId = parentTagId.substring(parentTagId.indexOf("-"));

	//TODO check true/false
	setSenchaFieldMetadata(fieldId.replace('-',''), true, 'duplicate');
});

function addSectionBreak(fieldId, cmd){
	var $newli1 = $('<li draggable="true" id=field-'+fieldId+'><span class="fieldSettings" id="spanFields-'+fieldId+'">');
	
	$('#formFields').append($newli1);

	addDefaultToolbar(fieldId);

	var $newdiv1 = $('<div class="boxContent" id=fieldOpts-'+fieldId+'>');
	$('#spanFields-'+fieldId).append($newdiv1);
	$('#fieldOpts-'+fieldId).append("<label for='text'>Header Text </label>");
	$('#fieldOpts-'+fieldId).append("<input type='text' id='text-"+fieldId+"' onchange=headerTextChange('"+fieldId+"') placeholder='Section Title'/><br/>");
	$('#fieldOpts-'+fieldId).append("<label for='helpText'>Intruction (Optional) </label>");
	$('#fieldOpts-'+fieldId).append("<textarea rows='4' cols='50' id='helpText-"+fieldId+"' onchange=headerIntructionChange('"+fieldId+"') placeholder='You can add any instruction that will help users to fill this section'>");

	//add inline preview box
	setPreviewBox(fieldId,commandMap[cmd][0], commandMap[cmd][1]);
	//add hiden final preview box
	setFinalPreviewBox(fieldId,commandMap[cmd][0],commandMap[cmd][1]);
	
}

function addDefaultFieldSettings(fieldId){

	$('#fieldTypeTemplate').clone().attr('id', 'dataType').find('select > option').each(function() {
		var $elem = $(this);
		var value = $elem.val();
		//alert(value);
	});

	var $newli1 = $('<li draggable="true" id=field-'+fieldId+'><span class="fieldSettings" id="spanFields-'+fieldId+'">');
	
	$('#formFields').append($newli1);
	//toolbar
	addDefaultToolbar(fieldId);

	//default field settings form
	var $newdiv1 = $('<div class="boxContent" id=fieldOpts-'+fieldId+'>');
	$('#spanFields-'+fieldId).append($newdiv1);
	$('#fieldOpts-'+fieldId).append("<label for='text'>Label </label>");
	$('#fieldOpts-'+fieldId).append("<input type='text' id='text-"+fieldId+"' onchange=captionChange('"+fieldId+"') placeholder='Field Name'/><br/>");
	$('#fieldOpts-'+fieldId).append("<label for='helpText'>Help Text </label>");
	$('#fieldOpts-'+fieldId).append("<input type='text' id='helpText-"+fieldId+"' onchange=helpTextChange('"+fieldId+"') placeholder='Additional help for this question'>");
	$('#fieldOpts-'+fieldId).append("<label colspan=2 class='advSettings'><a id='viewAdvancedSettings'>More settings...</a></label><br/>"); 
	var $newdivAdvSettings = $('<div class="advancedFieldSettings" style="display: none; visibility: invisible;" id=advFieldOpts-'+fieldId+'>');
	$('#fieldOpts-'+fieldId).append($newdivAdvSettings);
	$('#advFieldOpts-'+fieldId).append("<label for='defaultValue'>Predefined Value </label>");
	$('#advFieldOpts-'+fieldId).append("<input type='text' id='defaultValue-"+fieldId+"' onchange=defaultValueTextChange('"+fieldId+"') placeholder='The field will be prepopulated with this text'/>");
	$('#advFieldOpts-'+fieldId).append("<label for='text'>ID </label>");
	$('#advFieldOpts-'+fieldId).append("<input type='text' id='idValue-"+fieldId+"' onchange=idChange('"+fieldId+"') placeholder='Field ID'/>");
	$('#fieldOpts-'+fieldId).append("<label class='hideAdvSettings' style='display: none; visibility: invisible;'><a id='hideAdvancedSettings'>Fewer settings</a></label><br/>"); 

	//add default question type set  
	$('#fieldOpts-'+fieldId).append("<label for='text'>Question Type </label>");
	$('#fieldTypeTemplate').clone().attr('id', 'dataType-'+fieldId).appendTo('#fieldOpts-'+fieldId);
	
}

function addDefaultToolbar(fieldId){
	//toolbar
	$('#toolbar').clone().attr('id', 'toolbar-'+fieldId).appendTo('#spanFields-'+fieldId);
	var $newCmdEdit = $("<a class='cmdEditIcon' id='cmdEdit' href=javascript:toggleContentPanel('fieldOpts-"+fieldId+"','finalField-"+fieldId+"');/>");
	var $newCmdDelete = $("<a class='cmdTrashIcon' id='cmdDelete' href=javascript:remove('field-"+fieldId+"');/>");
	var $newCmdDuplicate = $("<a class='cmdDuplicateIcon' id='cmdDuplicate' href=javascript:duplicate('field-"+fieldId+"');/>");
	$('#toolbar-'+fieldId).append($newCmdDelete);
	$('#toolbar-'+fieldId).append($newCmdDuplicate);
	$('#toolbar-'+fieldId).append($newCmdEdit);
}

$(document).on('click', '#viewAdvancedSettings', function(e){
	$(this).parent().parent().children('div.advancedFieldSettings').toggle();
	$(this).parent().parent().children('div.advancedFieldSettings').children('label.hideAdvSettings').toggle();
	$(this).parent().parent().children('label.advSettings').toggle();
	$(this).parent().parent().children('label.hideAdvSettings').toggle();
});

$(document).on('click', '#hideAdvancedSettings', function(e){
	//alert( $(this).parent().parent().get(0).id);
	$(this).parent().parent().children('div.advancedFieldSettings').toggle();
	$(this).parent().parent().children('label.advSettings').toggle();
	$(this).parent().parent().children('label.hideAdvSettings').toggle();
});

$(document).on('click', '#addOptInput', function(e){
	var parentTagName = $(this).parent().get(0).tagName;
	var parentTagId = $(this).parent().get(0).id;
	var olTagId = $('#'+parentTagId).parent().get(0).id;
	//alert('parentTagName: '+parentTagName+' | parentTagId: '+parentTagId+' | olTagId: '+olTagId);
	$('#'+parentTagId).children("label").remove();
	var val = $('#'+olTagId+' #optInput').last().attr('placeholder');
	var fieldId = val.substring(val.indexOf(" "));
	fieldId++;
	if(parentTagId == 'chooseFromAddListLi'){
		$('#'+parentTagId).children("span").text(fieldId+'.');
	}
	$('#'+parentTagId).children("input").attr('readonly', false);
	$('#'+parentTagId).children("input").attr('placeholder', 'Option '+fieldId);
	$('#'+parentTagId).children("input").attr('id', 'optInput');
	$('#'+parentTagId).attr('id', parentTagId.replace('Add',''));
	$('#'+parentTagId).clone().appendTo('#'+olTagId);
});

$('#formTitleInput').blur(function() {

	var value = this.value;
	var id = this.id;

	if (value == null || value == ""){
		$(this).attr('placeholder', 'Untitled Form');
	  	return false;
	}

	//set sencha form metadata
	setPanelMetadata(value);
	
});

$('#formInstructions').blur(function() {

	var value = this.value;
	var id = this.id;

	if (value == null || value == ""){
		$(this).attr('placeholder', 'You can include any text or info that will help people fill this out.');
	  	return false;
	}

	//populate metamodel
	var fieldset = "{ xtype: 'fieldset', ";
	var actualMetadata = $('#data--1').text();
	var newMetadata = '';

	if(actualMetadata.indexOf('fieldset') == -1){
		newMetadata = fieldset + "instructions: '"+value+"', ";
	}else{
		newMetadata = actualMetadata + "instructions: '"+value+"', ";
	}

	var defaults = "defaults: { labelAlign: 'left', labelWidth: '45%'}, ";
	
	newMetadata += defaults;
	
	$('#data--1').text(newMetadata);

});


$(document).on('blur', '#optInput', function(e){
	var value = this.value;
	var id = this.id;
	if (value==null || value==""){
		$('#finalPreview'+fieldId+' :input[type=text]').attr('placeholder', 'Option 1');
	  	return false;
	}
	
	var parentTagName = $(this).parent().parent().get(0).tagName;
	var parentTagId = $(this).parent().parent().get(0).id;
	var fieldId = parentTagId.substring(parentTagId.indexOf("-"));
	var fieldName = 'finalPreview'+fieldId;
	var select = false;

	//alert('parentTagName: '+parentTagName+' | parentTagId: '+parentTagId+' | fieldName: '+fieldName);
	
	if(parentTagId.indexOf('multipleChoice') != -1){
		setSenchaRadioFieldMetadata(fieldId, value);
	}else if(parentTagId.indexOf('checkboxOpt') != -1){
		setSenchaCheckboxFieldMetadata(fieldId, value);
	}else if(parentTagId.indexOf('chooseFromList') != -1){
		setSenchaSelectFieldMetadata(fieldId, value);
		select = true;
	}
	
	if(select){
		$('#'+fieldName+' #chooseFromListOpt').append($("<option></option>").attr("value",value).text(value));
	} else{	
		$('#'+fieldName).children("ol").remove();
		$('#'+fieldName).children("li").remove();
		$(this).parent().parent().clone().attr('id', 'final-'+parentTagId).appendTo('#'+fieldName);
		$('#'+fieldName+' > ol > li').last().remove();
		$('#final-'+parentTagId+' #optInput').attr('readonly', 'readonly');
	}	


});

function captionChange(fieldId) {  
	value = $('#text-'+fieldId).val();
	//value = $(this); 
	//alert(value);
	if (value==null || value==""){
		$('#preview-'+fieldId+' span').text("Field Name");
		$('#finalPreview-'+fieldId+' span').text("Field Name");
	  	return false;
	}
	$('#preview-'+fieldId+' span.previewCaption').text(value);
	$('#finalPreview-'+fieldId+' span.previewCaption').text(value);
	$('#text-'+fieldId).attr('value', value);
	
	setSenchaFieldMetadata(fieldId, value, 'label');

}

function headerTextChange(fieldId) {  
	value = $('#text-'+fieldId).val();
	if (value==null || value==""){
		$('#preview-'+fieldId+' span.previewCaption').text("Section Title");
		$('#finalPreview-'+fieldId+' span.previewCaption').text("Section Title");
	  	return false;
	}
	$('#preview-'+fieldId+' span.previewCaption').text(value);
	$('#finalPreview-'+fieldId+' span.previewCaption').text(value);

	setSenchaFieldMetadata(fieldId, value, 'title');
	
}

function idChange(fieldId) {  
	value = $('#idValue-'+fieldId).val();
	if (value==null || value==""){
	  	return false;
	}

	setSenchaFieldMetadata(fieldId, value, 'name');
}

function helpTextChange(fieldId) {  
	value = $('#helpText-'+fieldId).val();
	if (value==null || value==""){
		$('#preview-'+fieldId+' > input').attr('placeholder', 'Additional help for this question');
		$('#finalPreview-'+fieldId+' > input').attr('placeholder', 'Additional help for this question');
	  	return false;
	}
	$('#preview-'+fieldId+' > :input').attr('placeholder', value);
	$('#finalPreview-'+fieldId+' :input').attr('placeholder', value);
	$('#helpText-'+fieldId).attr('value', value);
	
	setSenchaFieldMetadata(fieldId, value, 'placeHolder');
}

function headerIntructionChange(fieldId) {  
	value = $('#helpText-'+fieldId).val();
	if (value==null || value==""){
		$('#preview-'+fieldId+' > input').attr('placeholder', 'You can add any instruction that will help users to fill this section');
		$('#finalPreview-'+fieldId+' > span.intructionCaption').text('You can add any instruction that will help users to fill this section');
	  	return false;
	}
	$('#preview-'+fieldId+' > span.intructionCaption').text(value);
	$('#finalPreview-'+fieldId+' > span.intructionCaption').text(value);
	
	setSenchaFieldInstructionMetadata(fieldId, value);
}

function defaultValueTextChange(fieldId) {  
	value = $('#defaultValue-'+fieldId).val();
	if (value==null || value==""){
	  	return false;
	}
	
	setSenchaFieldMetadata(fieldId, value, 'default');
}

function toggleContentPanel(switchContentDiv, showHideDiv) {
	$('#'+switchContentDiv).toggle();
	$('#'+showHideDiv).toggle();
}

$(document).ready(function() {
     //alert("document ready occurred!");
	//$('#field-1').clone().appendTo('#formFields');

});

$(document).on('mouseenter', '.fieldSettings', function(e){

	if ($(this).children("div.boxToolbar").is(":hidden")){
			$(this).children("div.boxToolbar").toggle();
			//$(this).children("div.boxContent").toggle();
			$(this).children("div.boxPreview").addClass("preview");
			e.preventDefault();
	}

});

$(document).on('dblclick', '.fieldSettings', function(e){
	var tagId = $(this).get(0).id;
	
	var fieldId = tagId.substring(tagId.indexOf("-"));
	var fieldOpts = 'fieldOpts'+fieldId;
	var finalField = 'finalField'+fieldId;

	toggleContentPanel(''+fieldOpts, ''+finalField);
});

$(document).on('mouseleave', '.fieldSettings', function(e){

	if ($(this).children("div.boxToolbar:not(':visible')") && $(this).children("div.boxContent").is(":hidden") ){
			$(this).children("div.boxToolbar").toggle();
			$(this).children("div.boxPreview").removeClass("preview");
			//$(this).children("div.boxContent").toggle();
			//$(this).children("div.boxPreview").toggle();
			e.preventDefault();
	}

});


function remove(divId) {
	$('#'+divId).remove();
	
	if ( $("#formFields").children().length == 0){
		$("#drop").toggle();
	}
}

function duplicate(divId) {
	$('#'+divId).clone(true).appendTo('#formFields');
}

$(document).on('change', '#formPreview :input', function(e){
	$(this).closest('#formPreview').data('changed', true);
	$('#saveForm').attr("disabled", false);
});

$('#saveForm').click(function() {

	$('#saveForm').attr("disabled", true);
	
	var senchaCode = fetchSenchaCode();
	
	var formTitle = $('#formTitleInput').val(); 
	if (!formTitle)
		formTitle = "Untitled Form";

	var currentTime = '"date_create": "'+new Date()+'"';
	var title = '"title": "'+formTitle+'"'; 
	var viewed = '"viewed": "0"'; 
	var submitted = '"submitted": "0"';

	var htmlPreview = $('[id^="field-"]');
	var formHtml = '';
	htmlPreview.each(function(index){
		formHtml += $(this).html();
	});

	var encoded = Base64.encode(formHtml);
	
	var htmlSnippet = '"_attachments": { "'+formTitle.replace(/ /g,'').toLowerCase()+'.html": { "content_type": "text/html", "data": "'+encoded+'"}}';
	
	formData = " { "+title+", "+viewed+", "+submitted+", "+currentTime+", "+htmlSnippet+", "+senchaCode+"]}";

	//alert(formData);
	//return false;
	
	$.ajax({
		url: "form.sync.php",
		data: formData,
		//data: JSON.stringify(formData),
		dataType: "json",
		cache: false,
		type: "POST",
		processData: true,
		success:function(a) { },
		error:function() {}
	});
	return false;
});

// getElementById  
function $id(id) {  
	return document.getElementById(id);  
}

function entities(s) {
	var e = {
		'"' : '"',
		'&' : '&',
		'<' : '<',
		'>' : '>'
	};
	return s.replace(/["&<>]/g, function (m) {
		return e[m];
	});
}

$(function() {
   $("#contact").live('click', function(event) {
       $(this).addClass("selected").parent().append('<div class="messagepop pop"><form method="post" id="new_message" action="/messages"><p><label for="email">Your email or name</label><input type="text" size="30" name="email" id="email" /></p><p><label for="body">Message</label><textarea rows="6" name="body" id="body" cols="35"></textarea></p><p><input type="submit" value="Send Message" name="commit" id="message_submit"/> or <a class="close" href="/">Cancel</a></p></form></div>');
       $(".pop").slideFadeToggle(function() { 
           $("#email").focus();
       });
       return false;
   });

   $(".close").live('click', function() {
       $(".pop").slideFadeToggle(function() { 
           $("#contact").removeClass("selected");
       });
       return false;
   });
 });

 $.fn.slideFadeToggle = function(easing, callback) {
     return this.animate({ opacity: 'toggle', height: 'toggle' }, "fast", easing, callback);
 };

