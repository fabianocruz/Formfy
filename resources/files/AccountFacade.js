function AccountFacade() {
  return this;
}

AccountFacade.RECYCLE_BIN_DIR_ID = 2147483645

AccountFacade.loadingHtml
AccountFacade.loadingDiv
AccountFacade.sId
AccountFacade.setSid = function(sId) {
    AccountFacade.sId = sId;
    return false;
}
AccountFacade.showLoadingDiv = function(element) {
  element = element || '#includeFileList'
  if (!AccountFacade.loadingHtml) AccountFacade.loadingHtml = $('#accountLoadingDiv').html()

  AccountFacade.loadingDiv = $(AccountFacade.loadingHtml)
  $(element).append(AccountFacade.loadingDiv)
  AccountFacade.loadingDiv.show()
}

AccountFacade.hideLoadingDiv = function() {
  if (!AccountFacade.loadingDiv) return

  AccountFacade.loadingDiv.hide()
}

AccountFacade.reloadCurrentDir = function() {
  changeDirLeft(currentDirId)
}

AccountFacade.reloadFolderTree = function() {
  $.ajax({
    url: '/account/homeAction.jsp',
    data: { sId : AccountFacade.sId ? AccountFacade.sId : -1 },
    method: 'POST',
    success: function(data) {
      if (data.foldertreejs) {
        initWebFXTreeHandler();
        eval(data.foldertreejs);
      }
    }
  })
}
//cgdcont=1
AccountFacade.isSpecialDir = function(dir) {
  return dir >= 2147483636
}

AccountFacade.isRecycleBin = function(dir) {
  return dir == AccountFacade.RECYCLE_BIN_DIR_ID
}

/*
 onclick(e)

 AccountFacade.userPromt({
 event: e,
 description: 'Edit folder name',
 title: 'Edit folder name',
 value: 'Current folder name',
 offsetx: 100,
 offsety: 100,
 width: 300,
 height: 500
 }, function(value) {

 })
 */
AccountFacade.userPromt = function(params, callback) {
  if (!dragObj.supported || typeof document.body.innerHTML == "undefined") return false

  var id = Math.random()
  var content = '<div class="text"><form name="prompt" id="id' + id + '" style="padding: 5px">' +
      params.description + '<br />' +
      '<input type="text" name="promptText" value="' + params.value + '" style="width: 180px" class="xBox" /> ' +
      '<input type="submit" value="Ok" style="width: 50px" /></form></div>';
  $('#popupTitle').html(params.title);

  writeDrag.set(params.event, content, params.width, params.offsetx, params.offsety, null, null);
  document.prompt.promptText.focus();
  document.prompt.promptText.select();

  $('form[id="id' + id + '"]').submit(function() {
    callback($('input[name=promptText]', this).val())
    writeDrag.hide()
    return false
  })
}

AccountFacade.copy = function(files, dirs, toDir, callback) {
  $.ajax({
    url: '/account/fio?operation=copy' + ((files != null) ? '&files=' + files : '') + ((dirs != null) ? '&dirs=' + dirs : '') + '&toDir=' + toDir + '&sId=' + (AccountFacade.sId ? AccountFacade.sId : -1),
    success: function(data) {
      callback(data)
    }
  })
}

AccountFacade.move = function(files, dirs, toDir, callback) {
  $.ajax({
    url: '/account/fio?operation=move' + ((files != null) ? '&files=' + files : '') + ((dirs != null) ? '&dirs=' + dirs : '') + '&toDir=' + toDir + '&sId=' + (AccountFacade.sId ? AccountFacade.sId : -1),
    method: 'post',
    success: function(data) {
      callback(data)
    }
  })
}

AccountFacade.remove = function(files, dirs, callback) {
  $.ajax({
    url: '/account/fio?operation=remove' + ((files != null) ? '&files=' + files : '') + ((dirs != null) ? '&dirs=' + dirs : ''),
    success: function(data) {
      callback(data)
    }
  })
}

/*
 $(document).click(function() {
 if ($('#ww_window').is(':visible')) {
 $('#ww_window').fadeOut('fast', function() {
 //$('#ww_window').remove()
 });
 $('#ww_overlay').fadeOut('fast', function() {
 //$(this).remove()
 });
 }
 })
 */

AccountFacade.popup = function(params) {
  var id = 'p_window'
  $('#' + id).remove()

  if (params.element) {
    params.content = params.element.html()
  }

  if (!!!params.title) {
    params.title = 'Title';
  }

  $('.p_overlay').remove();

  var el = $('<div id="p_overlay" class="p_overlay"></div><div id="' + id + '"><div class="ii"><div class="hh">' + params.title + '<a class="close"></a></div><div class="cc">' + params.content + '<div class="clear"></div></div></div></div>')
      .prependTo('body')

  if ($.browser.msie) {
    el.show()
  } else {
    el.fadeIn('fast')
  }

  /* Grab viewport height middle position */
  var vph = $(window).height() / 2;

  /* Grab viewport width middle position */
  var vpw = $(window).width() / 2;

  /* Grab overlay height middle position */
  var vbh = $('#' + id).height() / 2;
  /* Grab overlay width middle position */
  var vbw = $('#' + id).width() / 2;

  /* Find overlay height middle on screen */
  var hoffsetval = vph - vbh + $(window).scrollTop() - 15 + 'px';
  /* Find overlay width middle on screen */
  var woffsetval = vpw - vbw - 15 + 'px';

  /* Assign top offset to overlay and make visible */
  $('#' + id).css({'top' : hoffsetval, 'left' : woffsetval,  'visibility': 'visible'});

  if($.browser.msie) {
    $('#' + id + ' .hh').width($('#' + id + " .cc").width()+40);
  }

  $('#p_overlay').height($('body').height());
  //$('#p_overlay').css({'position':'fixed'});

  $('#' + id + ' .close').die('click');
  $('#p_overlay').die('click');

  $('#' + id + ' .close').live('click', function() {
    if (!!params.onClose && !params.onClose()) {
       return;
    }
      $('#' + id).fadeOut('fast', function() {
        $('#' + id).remove()
      });

      $('#p_overlay').fadeOut('fast', function() {
        $(this).remove()
      })
  });

  $('#p_overlay').live('click', function() {
    if (!!params.onClose && !params.onClose()) {
      return;
    }
      $('#' + id).fadeOut('fast', function() {
        $('#' + id).remove();
      });

      $('#p_overlay').fadeOut('fast', function() {
        $(this).remove()
      })
  });

  return {
    hide: function() {
      $('#' + id).remove();
      $('#p_overlay').remove();
      //document.getElementById("statFileDown").
    }
  }
};


AccountFacade.writeDragContent = ''
AccountFacade.writeDrag = function(params) {
  if (!AccountFacade.writeDragContent) {
    AccountFacade.writeDragContent = $('#writeDragMain').html()
    $('#writeDragMain').remove()
  }
  $('#wdMain').remove()

  var main = $(AccountFacade.writeDragContent).appendTo($(document.body))

  $('.dragDivTitle', main).html(params.title)
  if (params.content) {
    $('.dragDivContent', main).html(params.content)
  } else if (params.element) {
    $('.dragDivContent', main).html(params.element.html())
  }

  var dialog = new WriteDrag('wdMain')
  dialog.doNotHideFlag = true
  dialog.hideFlag = false
  dialog.set({}, undefined, params.width ? params.width : 410, 'c', 'c', undefined, params.height ? params.height : undefined)

  var onHide = function() {
    Events.removeListener('WriteDrag.hide', onHide)
    if (params.onClose) params.onClose()
  }
  Events.addListener('WriteDrag.hide', onHide)

  $('.close', main).unbind('click').click(function() {
    Events.removeListener('WriteDrag.hide', onHide)
    dialog.hide()
    if (params.onClose) params.onClose()
    return false
  })

  return dialog
}

AccountFacade.saveButtonPressed = function(button, pressed) {
  var value = $.cookie('pressed.buttons')

  var buttons = []
  var index = -1
  if (value) {
    value = value.replace(',,', ',')
    buttons = value.split(',')
    index = Utils.indexOf(buttons, button)
  }

  if (pressed && index < 0) {
    buttons.push(button)
  } else if (!pressed && index >= 0) {
    buttons.splice(index, 1)
  }

  $.cookie('pressed.buttons', buttons.length > 0 ? buttons.join(',') : '', {path: '/'})
}

AccountFacade.isButtonPressed = function(button) {
  var value = $.cookie('pressed.buttons')
  if (value == null) {
    value = 'folders'
    $.cookie('pressed.buttons', value, {path: '/'})
  }
  if (!value) return false

  return Utils.indexOf(value.split(','), button) >= 0
}