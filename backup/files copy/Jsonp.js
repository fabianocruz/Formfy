
function Jsonp(options) {
  options = $.extend(true, {
    url: '',
    jsonp: function() { }
  }, options)

  var id = Math.random()
  options.url = options.url + (options.url.indexOf("?") > 0 ? '&' : '?') + 'jsonp=Jsonp.JsonpCallback&id=' + id
  
  Jsonp.JsonpCallbacks[id] = options.jsonp

  var name = 'iframe' + Math.random();
  var iframe = $('<iframe src=' + options.url + ' name="' + name + '" id="' + name + '" style="display: none;" />');
  
  $(document.body).append(iframe);
  iframe.load(function() {
    Jsonp.JsonpCallbacks[id] = null
  })

  return this
}

Jsonp.JsonpCallbacks = []

Jsonp.JsonpCallback = function(id, data) {
  var jsonp = Jsonp.JsonpCallbacks[id]
  if (!jsonp) return

  jsonp(data)
}