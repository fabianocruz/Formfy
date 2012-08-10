var senchaMap = {
	'singleLinePreview':'textfield',
	'paragraphPreview':'textareafield',
	'numericPreview':'numberfield',
	'rangePreview':'spinnerfield',
	'multipleChoiceChoices':'radiofield',
	'checkboxOptions':'checkboxfield',
	'chooseFromListOptions':'selectfield',
	'passwordPreview':'passwordfield',
	'emailPreview':'emailfield',
	'websitePreview':'urlfield',
	'datePreview':'datepickerfield',
	'breakSectionPreview':'fieldset',
	'gridOptions':'null',
	'phonePreview':'null'
};

function setSenchaTypeMetadata(fieldId, previewDivId){
	$('#data-'+fieldId).text(" { `xtype`: '"+senchaMap[previewDivId]+"', }, ");
	this.setPanelMetadata("Untitled Form");
}

function setPanelMetadata(value) {  
	//alert(value);
	
	//var newMetadata = "Ext.define('"+value.replace(/ /g,'')+"', { ";
	var newMetadata = "{ `extend`: 'Ext.form.Panel', ";
	newMetadata += " `fullscreen`: 'true', ";
	newMetadata += " `id`: '"+value.replace(/ /g,'').toLowerCase()+"', ";
	newMetadata += " `requires`: [ " +
						 "	'Ext.form.Panel', " +
						 "	'Ext.form.FieldSet', " +
						 "	'Ext.field.Number', " +
						 "	'Ext.field.Spinner', " +
						 "	'Ext.field.Password', " +
						 "	'Ext.field.Email', " +
						 "	'Ext.field.Url', " +
						 "	'Ext.field.DatePicker', " +
						 "	'Ext.field.Select', " +
						 "	'Ext.field.Hidden', " +
						 "	'Ext.field.Radio', " +
						 "	'Ext.field.Slider', " +
						 "	'Ext.field.Toggle', " +
						 "	'Ext.field.Search' " +
						 "	] } ";

	//populate metamodel
	var actualMetadata = $('#data--1').text();

	$('#data--1').text(newMetadata);

}

function setSenchaFieldMetadata(fieldId, value, metadataType){

	//populate metamodel
	var metadata = "`"+metadataType+"`: '"+value+"', ";
	var actualMetadata = $('#data-'+fieldId).text();
	var newMetadata = actualMetadata.replace('},', metadata+" }, "); 
	$('#data-'+fieldId).text(newMetadata);

}

function setSenchaFieldInstructionMetadata(fieldId, value){

	//populate metamodel
	var metadata = "`instructions`: '"+value+"'";

	var defaults = "`defaults`: { `labelAlign`: 'left', `labelWidth`: '45%'}, ";

	var actualMetadata = $('#data-'+fieldId).text();
	var newMetadata = actualMetadata.replace('},', metadata+" , "+defaults); 
	$('#data-'+fieldId).text(newMetadata);

}

function setSenchaRadioFieldMetadata(fieldId, value){

	var type = "`xtype`: 'radiofield'";

	var metadata;
	var actualMetadata = $('#data'+fieldId).text();
	var newMetadata = ' '; 

	var name = "`name`: '*undefined*'";
	var metadataValue = "`value`: '"+value.replace(/ /g,'').toLowerCase()+"'";
	var metadataLabel = "`label`: '"+value+"'";

	if(actualMetadata.indexOf(metadataValue) == -1 && actualMetadata.indexOf(metadataLabel) == -1){
		metadata = "{ "+type+", "+name+", "+metadataValue+", "+metadataLabel+" },";
	}else{
		return false;
	}
	
	newMetadata = actualMetadata + metadata;

	$('#data'+fieldId).text(newMetadata);

}

function setSenchaCheckboxFieldMetadata(fieldId, value){

	var type = "`xtype`: 'checkboxfield'";

	var metadata;
	var actualMetadata = $('#data'+fieldId).text();
	var newMetadata = ' '; 

	var metadataName = "`name`: '"+value.replace(/ /g,'').toLowerCase()+"'";
	var metadataLabel = "`label`: '"+value+"'";

	if(actualMetadata.indexOf(metadataName) == -1 && actualMetadata.indexOf(metadataLabel) == -1){
		metadata = "{ "+type+", "+metadataName+", "+metadataLabel+" },";
	}else{
		return false;
	}
	
	newMetadata = actualMetadata + metadata;

	$('#data'+fieldId).text(newMetadata);

}

function setSenchaSelectFieldMetadata(fieldId, value){

	var metadata;
	var actualMetadata = $('#data'+fieldId).text();
	var newMetadata = ' '; 

	var opt = ' ';
	var newOpts = null;
	var metadataValue = null;
	var metadataText = null;

	if(actualMetadata.indexOf('text:') != -1 ){
		var mySplitResult = actualMetadata.split(",");
		var temp = ' '; 
		for(i = 0; i < mySplitResult.length; i++){
			var field = mySplitResult[i];
			if(field.indexOf('text:') != -1){
				metadataText = field+' | ';
				opt += metadataText;
			}else if(field.indexOf('value:') != -1){
				metadataValue = field+' | ';
				opt += metadataValue.replace('] }',' ');
			}else if (field.indexOf('xtype') != -1 || field.indexOf('name') != -1 || field.indexOf('label') != -1){
				temp += field+' | ';
				//alert(temp);
			}
		}

		metadataValue = "`value`: '"+value.replace(/ /g,'').toLowerCase()+"'";
		metadataText = "`text`: '"+value+"'";
		opt += "{ "+metadataText+","+metadataValue+" }";
		newOpts = opt+" ] },";

		newMetadata = temp.replace(/\|/g,',')+' '+newOpts.replace(/\|/g,',');
	
	}else{

		var metadataValue = "`value`: '"+value.replace(/ /g,'').toLowerCase()+"'";
		var metadataText = "`text`: '"+value+"'";
		opt = "{ "+metadataText+","+metadataValue+" }";

		newOpts = "`options`: [ "+opt+" ] },";
		newMetadata = actualMetadata.replace('},', ''+newOpts+'');
	}	

	$('#data'+fieldId).text(newMetadata);

}

function fetchSenchaCode(){
	var data = $('[id^="data-"]');
	
	var senchaCode = '"sencha_code": [ ';
	var fieldData = '';
	var i = 0;
	var length = data.length - 1;

	data.each(function(index){
		i = i + 1;
		fieldData = $(this).text().replace(/'/g,'"').replace(/`/g,'"').replace(',  },', '}');
		if(fieldData) {
			senchaCode += fieldData;
			if(i <= length)	
				senchaCode += ','
		}
	});

	return senchaCode;
}

