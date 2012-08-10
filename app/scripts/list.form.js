
$('#grid').gridy({
	debug		: false,
	buttonMax	: 5,
	clickFx		: true,
	columns		: [
		{ name: 'Title',value: 'title', width: 200 },
		{ name: 'Created', value: 'created', width: 300 },
		{ name: 'Viewed', value: 'viewed', width: 90 },
		{ name: 'Submitted', value: 'submitted', width: 90 },
		{ width: 95 }
	],
	dataType	: 'jsonp',
	evenOdd		: true,
	find		: 'title',
	finds		: [
		{ name: 'Title', value: 'title'},
		{ name: 'Created', value: 'created'},
		{ name: 'Viewed', value: 'viewed'},
		{ name: 'Submitted', value: 'submitted'}
	],
	hoverFx		: true,
	//searchFocus	: true,
	//loadingText	: 'Wait a momente please...'
	searchText	: 'type your search here...',
	sortName	: 'title',
	sortOrder	: 'desc',
	//cache		: true,
	resize		: true,
	url			: 'gridy.php',
	//url			: 'http://mockr.me/gridy',
	width		: 800
});


