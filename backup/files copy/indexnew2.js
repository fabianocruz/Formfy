
function AnonUploadWidget(options) {
  options = $.extend(true, {
    upload_form: null,
    i18n: {
      select_files: 'Select files...',
      minutes: 'min',
      seconds: 'sec',
      upload_canceled: 'Your transfer has been cancelled.',
      file_upload: "file upload",
      files_upload: "files upload",
      upload: "Upload",
      do_you_want_to_cancel_upload:  "Do you want to cancel upload?"
    }
  }, options);
  var progressLoaded = 0;
  var progressTime = 0;
  var startValue = 0;
  var filesFieldCounter = 1;
  var startTime;
  var uploadStarts;
  var isSelectedFiles = false;
  var _this = this;

  function readablizeBytes(bytes) {
    if (bytes == 0) return '0 bytes'

    var str = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    var index = Math.floor(Math.log(bytes) / Math.log(1024));
    bytes = (bytes / Math.pow(1024, Math.floor(index)));
    bytes = (index > 1) ? bytes.toFixed(1) : Math.floor(bytes);

    return bytes + " " + str[index];
  }
  
  function showProgressBar() {
    $('#percent').html('0');
    $('#sizeOk').html('');
    
    $('#upload').hide();
    $('#frameUploadProgressBarWithStopButton').show();
  }

  function hideProgressBar() {
    $('#uploadButton1').removeClass("d");
    $('#uploadButton1').addClass("a");
    options.upload_form[0].reset();
    $('#frameUploadProgressBarWithStopButton').hide();
    $('#upload').show();
    $('#progresswidth').attr('width', "1%");
    $('#fileselectvalue').empty()
  }

  var mulsupport = ("multiple" in document.createElement("input"));

  $("#fid0").ready(function() {
    if (mulsupport) {
      $('#fid0').attr("multiple", "multiple");
      $("#selectButton").find("div.gt").text(options.select_files);
    }
  });

  $('#fid0').change(function() {
    $('#uploadButton1').removeClass("d");
    $('#uploadButton1').addClass("a");
    $("#fileselectvalue").empty();
    if (document.getElementById("fid0").files != null) var numb = document.getElementById("fid0").files.length;
    if (mulsupport && numb > 1) {
        $("#fileselectvalue").append($(document.createElement("img")).attr({"src":"/images/icons/16x16/stack.png","id":"ico","class":"absmid","hspace":"3"}));
        var fileTitle = numb + " <t:t>files</t:t>";
    } else {
      var file = $(this).val();
      reWin = /.*\\(.*)/;
      fileTitle = file.replace(reWin, "$1");
      reUnix = /.*\/(.*)/;
      fileTitle = fileTitle.replace(reUnix, "$1");

      var RegExExt = /.*\.(.*)/;
      var ext = fileTitle.replace(RegExExt, "$1");

      var ico = '/icons/16x16/' + ext + '.gif';
      $("#fileselectvalue").append($(document.createElement("img")).attr({"src": ico, "id": "ico", "class": "absmid", "hspace": "2"}));
      $('#ico').error(function() {
        $(this).attr("src", "/icons/16x16/default.png");
      });
    }

    $('#fileselectvalue').append(fileTitle);
  });

  $("#fid0").hover(function() {
   $(".fileselectcontainer").find('div.gv').addClass("hover").stop();
   $(".fileselectcontainer").find('div.gh').addClass("hover").stop();
  }, function() {
    $(".fileselectcontainer").find('div.gv').removeClass("hover").stop();
    $(".fileselectcontainer").find('div.gh').removeClass("hover").stop();
  });

  function getTime() {
    return Math.floor(new Date().getTime() / 1000);
  }

  function readablizeTime(seconds) {
    seconds = Math.floor(seconds);

    if (seconds < 60)
      return seconds + " " + options.i18n.seconds;

    if (seconds < 3600) {
      var mins = Math.floor(seconds / 60);
      seconds = seconds - mins * 60;
      return mins + " " + options.i18n.minutes + " " + seconds + " " + options.i18n.seconds;
    }

    var hours = Math.floor(seconds / 3600)
    var mins = Math.floor((seconds - hours * 3600) / 60);
    return hours + " " + options.i18n.hours + " " + mins + " " + options.i18n.minutes;
  };

  var upbox = false
  var isShowUpbox = $("#upbox").is('div')
  var uploadModule = UploadModule.build({
    upload_form: options.upload_form,
    uploadHandler: UploadModule.getAnonUploadHandler(),

    onStart: function() {
      uploadStarts = true;
      if (fileCount == 1)
        $('.numFiles').html(fileCount + " " + options.i18n.file_upload);
      else
        $('.numFiles').html(fileCount + " " + options.i18n.files_upload);
      showProgressBar();
    },

    // Callback is invoked each time we receive updated progress status from sever
    onProgress: function(progress) {
      if (isShowUpbox && !upbox) {
        upbox = AccountFacade.popup({
          title: options.i18n.upload,
          element: $("#upbox"),
          onClose: function() {
            if (!confirm(options.i18n.do_you_want_to_cancel_upload)) return false
              _this.stop()
              return true
          }
        });
      }

      if (!startValue) startValue = progress.loaded
      if (!startTime) startTime = getTime()

      // Текущее время
      var currTime = getTime()
      // Всего прошло времени
      var elapsedTime = currTime - startTime
      // Время с момента последнего progress
      progressTime = elapsedTime - progressTime
      // Закачано в промежутке между вызовами
      progressLoaded = progress.loaded - startValue - progressLoaded
      // Текущая скорость, байт/с
      var rate = elapsedTime > 0 ? (progress.loaded - startValue) / elapsedTime : 0
      // Осталось врмени, при закачке со скоростью rate
      var leftTime = rate > 0 ? ((progress.total - progress.loaded) / rate) : ''

      var percent = Math.floor((progress.loaded / progress.total) * 100);
      var minimumProgressBarWidth = 1;
      $('#progresswidth').attr('width', Math.max(percent, minimumProgressBarWidth) + "%");
      $('#percent').html(percent);
      $('.percentvalue').html(percent);
      $('.percent').css({'left': Math.max(percent, minimumProgressBarWidth) + "%"});
      $('.progress').css({'width': Math.max(percent, minimumProgressBarWidth) + "%"});
      $('#sizeOk').html(readablizeBytes(progress.loaded));
      $('.leftTime').html(readablizeTime(leftTime));
    },

    onError: function(error) {
      alert(error.errorMessage);
    },

    onComplete: function(data) {
      uploadStarts = false;

      hideProgressBar();
      if (data.status == "OK") anonUploadDone(data.uploadedFileId);
      else if (data.status == "error") {
        alert(data.errorMessage);
      }
    },

    onCancel:function() {
      alert(options.i18n.upload_canceled);
      
      // Reload page if "non-HTML5 browser"
      if (UploadModule.HandlerUploadXhr.isSupported()) return;
      document.location.reload();
    },

    onConfirm: function(message) {
      return confirm(message);
    },
    skipSpaceCheck: true,
    onCleanup: function() {
      uploadStarts = false;
      hideProgressBar();
      if (upbox) {
          upbox.hide();
          upbox = false;
      }
      options.upload_form[0].reset();
      fileCount = 0;
      //$("#fileselectvalue").html(''); // comment a.fedorenko 25.11.11 09:37
    },
    onAddFiles: function (files) {
      if(!files)
        fileCount = 1;
      else
        fileCount += files.length;
      if (fileCount == 1)
        $('.numFiles').html(fileCount + " " + options.i18n.file_upload);
      else
        $('.numFiles').html(fileCount + " " + options.i18n.files_upload);
    }
  });
  var fileCount = 0;
  this.start = function() {
    $('#uploadButton1').addClass('d');
    $('#uploadButton1').removeClass("a");

    uploadModule.start();
  }

  this.stop = function() {
    uploadModule.cancel();
  }


  this.dropFiles = function(files, input) {
    if (!uploadStarts) {
      startTime = getTime();
      progressLoaded = 0;
      progressTime = 0;
    }

    if (!files) uploadModule.add(null, input);
    else if (uploadModule.canResumeUpload()) {
      var fs = []
      for (var i = 0; i < files.length; i++) {
        fs.push(files[i])
      }
      uploadModule.add(fs, input);
    } else for (var i = 0; i < files.length; i++)
          uploadModule.add(files[i], input);
  }

  return this;
}AjaxFacade.rootDirId = -1

function AjaxFacade() {
  var self = this

  function click() {
    AccountFacade.showLoadingDiv()

    var link = $(this)
    var container = link.attr('data-ajaxContainer') || 'includeFileList'

    AjaxFacade.call(link.attr('data-url'), container)
    
    return false
  }

  this.init = function() {
    $('*[data-url]').unbind('click', click).bind('click', click)
  }

  Events.addListener('ajax.content.loaded', this.init)
  Events.addListener('folder.reload', this.init)
  this.init()
  
  return this;
}

/**
 *  
 *  @param page URL to load
 *  @param container HTML element to set response text
 *  @param formContainer
 *  @param callback
 */
AjaxFacade.call = function(page, container, formContainer, callback) {
  container = container || 'includeFileList'

  AjaxFacade.log('[AjaxFacade.call]')
  AjaxFacade.dir(arguments)


  $.ajax({
    url: page,
    cashe: false,
    success: function(text, textStatus, XMLHttpRequest) {
      if(typeof collapseUpload == 'function')
        collapseUpload()
      $('#' + container).html(text)
      AjaxFacade.wrap(container, formContainer, callback)
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      AccountFacade.hideLoadingDiv()
    }
  }) 
}
AjaxFacade.wrap =  function (container, formContainer, callback) {
    $('#' + container).ready(function() {
      $('form', '#' + container).ajaxForm({
        iframe: false,
        beforeSubmit: function(params, form) {
          AjaxFacade.log('[AjaxFacade.ajaxForm.beforeSubmit]')

          var onSubmit = form.attr('data-submit')
          var check = onSubmit ? eval(form.attr('data-submit')) : true
          if (check) AccountFacade.showLoadingDiv()
          return check
        },
        success: function(responseText, statusText) {
          AccountFacade.hideLoadingDiv()
          $('#' + (formContainer ? formContainer : container)).html(responseText)
          AjaxFacade.wrap(container, formContainer, callback)

          AjaxFacade.log('[AjaxFacade.ajaxForm.success]')
        },
        error: function(err) {
          AjaxFacade.log('[AjaxFacade.ajaxForm.error]')
          AjaxFacade.dir(err)
        }
      })

      AccountFacade.hideLoadingDiv()
      Events.fireEvent('ajax.content.loaded', self.init)

      if (callback) callback()
    })
  }


AjaxFacade.debug = false

AjaxFacade.log = function(text) {
  if (!AjaxFacade.debug) return

  try {
    console.log(text)
  } catch(e) { }
}

AjaxFacade.dir = function(object) {
  if (!AjaxFacade.debug) return

  try {
    console.dir(object)
  } catch(e) { }
}

