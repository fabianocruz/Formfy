UploadModule.FileSupported = function() {
  try {
    return typeof File != "undefined";
  } catch(e) {
    return false
  }
}

UploadModule.FilePrototypeSliceSupported = function() {
  try {
    return 'mozSlice' in File.prototype || 'webkitSlice' in File.prototype || 'slice' in File.prototype;
  } catch(e) {
    return false
  }
}

UploadModule.XhrUploadSupported = function() {
  try {
    return typeof (new XMLHttpRequest()).upload != "undefined"
  } catch(e) {
    return false
  }
}

UploadModule.canUploadDirectory = function() {
  try {
    return $.browser.webkit && !!('webkitdirectory' in document.createElement('input'))
  } catch(e) {
    return false
  }
}

var _uploadModuleFileViewId = 1
UploadModule.addUIFileId = function(files){
  for(var i in files){
    files[i]._uiFileId = _uploadModuleFileViewId++
    files[i]._loaded = 0
    if(files[i]._uploadDir === undefined){
      files[i]._uploadDir = UploadModule.getCurrentDirIdForUpload()
    }
  }
  return files
}

UploadModule.getCurrentDirIdForUpload = function(){
  if(typeof currentDirId == 'undefined') return
  if(currentDirId == 2147483637) return AjaxFacade.rootDirId
  return currentDirId
}

function UploadModule(options) {
  options = $.extend(true, {
    upload_form: null,
    url: '',
    // Static resources root folder
    static_root: '',
    // The url for querying progress status
    progress_meter_url: null,
    // The maximum allowed file size
    max_file_size: 0,
    resize: false,
    max_change_dc_attempts: 0,

    onFlashFilesAdded: function(files) { },
    onStart: function() { },
    onProgress: function(progressStatus) { },
    onError: function(error) { },
    onComplete: function() { },
    onConfirm: function(message) { return true },
    onCancel: function() { },
    onInterrupt: function() { },
    onPause: function() { },
    onResume: function() { },
    onCleanup: function() { },

    onResizeStart: function() { },
    onResizeProgress: function(progressStatus) { },
    onResizeComplete: function() { },

    onAddFiles: function(files) { },
    onFileUploaded: function(file) { },
    onFileCanceled: function(file){ },
    onFileError: function(file){ },

    i18n: {
      // Message shown when the file size exceeds maximum allowed file size
      file_size_exceeded: '',
      some_files_size_exceeded: '',
      no_files_selected: 'No files selected',
      resume_upload: 'Some files are in incomplete state. Continue upload ?',
      your_browser_not_supported: 'Your browser does not support the upload file size of 4 GB and above',
      you_can_resume_upload: 'Your transfer have been canceled. You can resume the upload with the current percentage',
      you_cannot_upload: 'You cannot upload these files with current browser. Please try desktop version.',
      you_cannot_upload_flash: 'You cannot upload these files with Flash uploader. Please try desktop version.',
      want_change_dc: 'The server is unavailable. Do you want to start upload to another server ? All uploaded data information will be lost.'
    }
  }, options);

  options.i18n.file_size_exceeded = options.i18n.file_size_exceeded.replace(/\[maxFileSize\]/, Math.floor(options.max_file_size / 1024 / 1024))


  var mainHandler = (options.uploadHandler) ?
    new options.uploadHandler(options) :
    new (UploadModule.getUploadHandler(options))(options)
  var updateHandler = null
  var resizeHandler = null

  function getResizeHandler() {
    if (!resizeHandler)
      options.isDisabledRemoveMultiple = true
      resizeHandler = new UploadModule.HandlerUploadXhr(options)
    return resizeHandler
  }

  var handler = mainHandler
  this.flashHandler = null

  var self = this;

  this.start = function() {
    handler.start()
  }

  this.resume = function() {
    handler.resume()
  }

  this.add = function(file, input, opt) {
    handler.add(file, input, opt);
  }

  this.update = function(input) {
    // Для обновления файла не используем Resumable
    if(this.canResumeUpload()){
      updateHandler = new (UploadModule.getAnonUploadHandler())(options)
      updateHandler.update(input);
    }else{
      handler.update(input);
    }
  }

  this.cancel = function() {
    if (updateHandler) {
      updateHandler.cancel()
      updateHandler = null
      return
    }

    handler.cancel()

    if (!self.flashHandler) return
    self.flashHandler.cancel()
  }

  this.cancelFile = function(uiFileId){
    handler.cancelFile(uiFileId)
    if (!self.flashHandler) return
    self.flashHandler.cancelFile(uiFileId)
  }

  this.initFlash = function() {
    if (self.flashHandler) return;

    self.flashHandler = new UploadModule.HandlerUploadFlash(options);
    self.flashHandler.init();
  }

  this.refreshFlash = function() {
    if (!self.flashHandler) return;
    self.flashHandler.refresh();
  }

  this.options = function(key, value) {
    options[key] = value
    handler.options(key, value)
    try {
      getResizeHandler().options(key, value)
    } catch (err) { }
    handler = (key == 'resize' && value) ? getResizeHandler() : mainHandler
  }

  this.checkFile = function(file) {
    return handler.checkFile(file)
  }

  this.uploadFiles = function() {
    return handler.uploadFiles()
  }

  this.isCheckMaxAddedFiles= function() {
    if($.isFunction(handler.isCheckMaxAddedFiles)){
      return handler.isCheckMaxAddedFiles()
    }
    return false
  }

  this.canResumeUpload = function() {
    return handler.canResumeUpload()
  }

  return this;
}

UploadModule.HandlerUploadForm = function(options) {
  var uploadStarts = false;
  var progressMeter = new options.progressMeter(options)
  var files = []
  var sessionUploadId = Math.random()
  var totalSize = 0
  var totalLoadedPerFile = []
  var resultData = {status: "OK"}
  var form
  var isFileUploaded = false

  $.each($("input:file"), function(){
    $(this).replaceWith($(this).removeAttr('multiple').clone(true))
  })

  Events.addListener('folder.reload', function() {
    $.each($("#divContextFolderMain input:file, #divContextFolderMain_SRC input:file"), function() {
      $(this).replaceWith($(this).removeAttr('multiple').clone(true))
    })
  })

  if (!$('#HandlerUploadFormContainer').length) {
    $(document.body).append('<div id="HandlerUploadFormContainer"></div>')
  }
  var c = $('#HandlerUploadFormContainer')

  function getFilesSize(){
    for(var id in files){
      var file = $('#uploadForm_'+ files[id]._uiFileId + ' :file', c).get(0)
      if(!file.files || !file.files[0].size) return false
      files[id].size = file.files[0].size
      totalSize += file.files[0].size
    }
    return true
  }

  function validationFileSize(){
    var count = files.length
    for(var id in files){
      if(files[id].size > options.max_file_size) cancelFileUpload(files[id]._uiFileId)
    }
    if(isError(options.i18n.file_size_exceeded, options.i18n.some_files_size_exceeded)) return false
    if(!$.browser.opera) return true
    var size4gb = 4 * 1024 * 1024 * 1024 - 1
    var count = files.length
    for(var id in files){
      if(files[id].size >= size4gb) cancelFileUpload(files[id]._uiFileId)
    }
    if(isError(options.i18n.your_browser_not_supported)) return false
    return true

    function isError(message, message2){
      if(files.length == 0){
        options.onError({errorMessage: message } )
        options.onCleanup()
        return true
      }else if(count != files.length && !options.onConfirm(message2||message)){
        options.onCleanup()
        return true
      }
      return false
    }
  }

  function getFile(id){
    for(var i in files){
      if(files[i]._uiFileId == id){
        return files[i]
      }
    }
  }

  function prepareFiles(){
    $(':file[value!=]:not(.isClone)', form).each(function(){
     $(this).after($(this).clone(true).addClass('isClone'))
     prepareInput($(this))
    })
    $(':file', form).removeClass('isClone')
  }

  function getSizeAndStartUpload() {
    var run = false
    var url = options.upload_form_handler.file_size_url + '&sessionUploadId='+sessionUploadId
    for(var id in files){
      var fileId = files[id]._uiFileId
      $(c).append($('<iframe name="sizeIFrame_'+fileId+'" class="sizeIFrame_all"></iframe>')
          .load(function(){getSizeCallback(this)}).hide())
      $('#uploadForm_'+fileId, c).attr('action', url+'&fileUploadId='+fileId).attr('target', 'sizeIFrame_'+fileId)
    }
    run = true
    $('.uploadForm_all', c).submit()
    $.ajax({url:url+'&count='+files.length+'&'+Math.random(),
      dataType: 'jsonp',
      success:function(data){
        var _run = run
        run = false
        $('.sizeIFrame_all', c).attr('src', '').remove()
        if(!data.success){
          onError(_run)
          return
        }
        for(var id in files){
          var fileId = files[id]._uiFileId
          files[id].size = data.sizes[fileId]
          totalSize += data.sizes[fileId]
          $('#uploadForm_'+fileId, c).attr('action', getActionForForm(files[id]))
            .attr('target', 'uploadIFrame_'+fileId)
        }
        UploadModule.validationFreeSpace(totalSize, options, startUpload, cancelAllUpload)
      },
      error:function(){
        $('.sizeIFrame_all', c).attr('src', '').remove()
        onError()
      }
    })

    function getSizeCallback(a){
      if(!run) return
      var dom = null
      try{
        dom = $(a).contents()
      }catch(e){
        onError()
      }
      if($('#success',dom).val() != 'OK') onError()
    }

    function onError(sendError){
      if(!run && !sendError) return
      run = false
      options.onError({ errorMessage: options.i18n.you_cannot_upload })
      cancelAllUpload(true)
    }
  }

  function startUpload(){
    if(!validationFileSize()) return
    options.onAddFiles(files)
    options.onStart()
    $('.uploadIFrame_all', c).load(function(){inputCallback(this)})
    for(var i = 0; i < files.length && i < options.upload_form_handler.max_threads; i++){
      $('#uploadForm_'+files[i]._uiFileId, c).submit()
      files[i].started = true
    }
    setTimeout(function() {
      progressMeter.start(progressCallback, '&sessionUploadId='+sessionUploadId)
    }, 1000)

    function inputCallback(a){
      if(!uploadStarts) return
      var doc = null
      var fileId = $(a).attr('id').replace('uploadIFrame_', '')
      try {
        doc = $(a).contents()
      } catch (err) {
        var file = getFile(fileId)
        if(file && !file.started) return
        options.onError({ errorMessage: options.i18n.you_cannot_upload })
        if(file) options.onFileError(file)
        cancelFileUpload(fileId)
        return
      }
      if($('#alert', doc).val()){
        options.onError({errorMessage : $('#alert', doc).val()})
        options.onFileError(getFile(fileId))
        completeFileUpload(fileId)
      }else if($('#uploadedFileId', doc).val()){
        $('input', doc).each(function() {
          resultData[$(this).attr('id')] = $(this).val()
        })
        var file = getFile(fileId)
        file._fileId = $('#uploadedFileId', doc).val()
        isFileUploaded = true
        options.onFileUploaded(file)
        completeFileUpload(fileId)
      }
    }

    function progressCallback(progress){
      if(!progress.files) return
      for(var id in progress.files){
        var fileInfo = progress.files[id]
        var file = getFile(fileInfo.fileId)
        if(!file) continue
        totalLoadedPerFile[fileInfo.fileId] = fileInfo.uploaded
        file.size = fileInfo.size

        var totalLoaded = getLoaded()
        var progressStatus = {
          id: fileInfo.fileId,
          fileLoaded: fileInfo.uploaded,
          fileSize: fileInfo.size,
          loaded: (totalLoaded >= totalSize?totalSize-1:totalLoaded),
          total: totalSize
        };
        options.onProgress(progressStatus)
      }
    }

    function getLoaded(){
      var totalLoaded = 0
      for(var id in totalLoadedPerFile){
        totalLoaded += totalLoadedPerFile[id]
      }
      return totalLoaded
    }
  }

  function cancelAllUpload(isChangeDir){
    uploadStarts = false
    files = []
    totalSize = 0
    totalLoadedPerFile = []
    $('.uploadIFrame_all', c).attr('src', '')
    $(c).html('')
    progressMeter.stop()
    if(isChangeDir){
      if(typeof currentDirId == 'undefined' || typeof changeDirLeft == 'undefined'){
        massAction(0)
      }else{
        AccountFacade.reloadCurrentDir()
      }
    }
    options.upload_form[0].reset()
    if(isFileUploaded) options.onComplete(resultData)
    resultData = {status: "OK"}
    options.onCleanup()
  }

  function completeFileUpload(id){
    var file = null
    for(var i = 0; i < files.length; i++){
      if(files[i]._uiFileId == id){
        file = files[i]
        files.splice(i, 1)
        break
      }
    }
    if(file == null) return
    $('#uploadForm_'+file._uiFileId+', #uploadIFrame_'+file._uiFileId, c).remove()
    if(!file.started){
      return
    }
    if(files.length == 0){
      cancelAllUpload()
    }else if(files.length >= options.upload_form_handler.max_threads){
      var nextFile = files[options.upload_form_handler.max_threads - 1]
      $('#uploadForm_'+nextFile._uiFileId, c).submit()
      nextFile.started = true
    }
  }

  function cancelFileUpload(id){
    var file = getFile(id)
    if(!file) return
    $('#uploadIFrame_'+file._uiFileId, c).attr('src', '')
    completeFileUpload(id)
    if (!uploadStarts) return
    if(file.size != undefined){
      totalSize -= file.size
    }
    delete totalLoadedPerFile[id]
  }

  function prepareInput(input){
    var file = {}
    var aName = input.val().split("\\")
    file.name = aName[aName.length-1]
    file = UploadModule.addUIFileId([file])[0]
    createForm(file, input)
    files.push(file)
  }

  function createForm(file, input){
    var fileId = file._uiFileId
    $(c).append($('<form id="uploadForm_'+fileId+'" class="uploadForm_all"></form>')
      .attr('action', getActionForForm(file))
      .attr('target', 'uploadIFrame_'+fileId)
      .attr('enctype','multipart/form-data')
      .attr('encoding', 'multipart/form-data')
      .attr('method', 'post')
      .append($('input:not(:file)', form).clone(true))
      .append(input).hide())

    $(c).append($('<iframe id="uploadIFrame_'+fileId+'" name="uploadIFrame_'+fileId+'" class="uploadIFrame_all"></iframe>')
      .hide())
  }

  function getActionForForm(file){
    var action = form.attr('action')+'&sessionUploadId='+sessionUploadId+'&fileUploadId='+file._uiFileId
    if(file._uploadDir){
      action += '&x-upload-dir='+file._uploadDir
    }
    if(AjaxFacade.rootDirId) action += '&x-root-dir=' + AjaxFacade.rootDirId
    return action
  }


  this.start = function(vForm) {
    form = vForm ? vForm : options.upload_form
    form.attr('action', options.upload_form.attr('action'))
    uploadStarts = true
    isFileUploaded = false
    if (!$(':file[value!=]', form).length) {
      options.onError({errorMessage: options.i18n.no_files_selected})
      options.onCleanup()
      return false
    }
    prepareFiles()
    if(getFilesSize()){
      UploadModule.validationFreeSpace(totalSize, options, startUpload, cancelAllUpload)
    }else{
      getSizeAndStartUpload()
    }
  }

  var _this = this
  this.add = function(file, input) {
    // В "обычных" браузерах нельзя добавлять файл в процессе загрузки
    if (uploadStarts) return

    var form = options.upload_form.clone(true)
    $(':file', form).remove()
    _this.start(form.append(input))
  }

  this.update = function(input) {
    // В "обычных" браузерах нельзя добавлять файл в процессе загрузки
    if (uploadStarts) return

    _this.start($(input).closest('form'))
  }

  this.cancelFile = function(uiFileId){
    if (!uploadStarts) return
    var file = getFile(uiFileId)
    if(!file) return
    options.onFileCanceled(file)
    cancelFileUpload(uiFileId)
  }

  this.cancel = function() {
    cancelAllUpload(true)
  }

  this.checkFile = function(file) {

  }

  this.options = function(key, value) {
    options[key] = value
  }

  this.isCheckMaxAddedFiles = function(){
    return true
  }

  this.canResumeUpload = function() {
    return false
  }

  return this
}

UploadModule.HandlerUploadXhr = function(options) {
  var url = options.url.replace('upload.jsp', 'upload5.jsp')

  if ($.browser.safari && !options.isDisabledRemoveMultiple) {
    $.each($("input:file"), function(){
      $(this).replaceWith($(this).removeAttr('multiple').clone(true))
    })

    Events.addListener('folder.reload', function() {
      $.each($("#divContextFolderMain input:file, #divContextFolderMain_SRC input:file"), function() {
        $(this).replaceWith($(this).removeAttr('multiple').clone(true))
      })
    })
  }

  var xhr

  var uploadStarts = false
  var resizeStart = false
  var files = []
  var totalSize = 0
  var totalLoaded = 0
  var currentLoaded = 0
  var keepName = false
  var updateFileId = 0

  // Patch for Chrome
  if (XMLHttpRequest && !('sendAsBinary' in XMLHttpRequest.prototype)) {
    XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
      var data = new ArrayBuffer(datastr.length)
      var ui8a = new Uint8Array(data, 0)
      for (var i = 0; i < datastr.length; i++) {
        ui8a[i] = (datastr.charCodeAt(i) & 0xff)
      }
      this.send(data)
    }
  }

  function getNewUploadUrl(file, callback) {
    // Change upload url for file
    $.ajax({
      type: 'post',
      url: '/rest/sharedFileUpload/newUploadUrl',
      data: {
        fileId: file._fileId
      },
      success: function(data) {
        file._url = data.url
        file._sections = []
        callback(true)
      },
      error: function(xhr, textStatus, errorThrown) {
        callback(false)
      }
    })
  }

  function prepareFiles(files, callback) {
    if (options.resize) {
      resizeStart = true

      var filesToConvert = []
      for (var i in files) {
        // Если не изображение или данные уже установлены или размер превышает лимит в 20 Мб
        if (!/\.(jpg|png|jpeg|bmp)$/i.test(files[i].name) || files[i]._data || files[i].size > 20 * 1024 * 1024) continue
        filesToConvert.push(files[i])
      }

      if (filesToConvert.length == 0) {
        callback()
        return
      }

      if (!uploadStarts) options.onResizeStart()

      var total = filesToConvert.length

      function convert(file) {
        if (!resizeStart) {
          options.onCancel()
          options.onCleanup()
          return
        }

        ImageThumbnailer.convert([file], options.resize, function(data) {
          if (data[0]) {
            file._data = data[0]
          }

          if (!uploadStarts) options.onResizeProgress({loaded: total - filesToConvert.length, total: total})

          if (filesToConvert.length == 0) {
            resizeStart = false
            if (!uploadStarts) options.onResizeComplete()
            callback()
            return
          }

          convert(filesToConvert.pop())
        })
      }

      convert(filesToConvert.pop())
    } else {
      resizeStart = false
      callback()
    }
  }

  function getFileSize(file) {
    return file._data ? file._data.length : file.size
  }

  function getFilesSize() {
    var size = 0;
    for (var i = 0; i < files.length; i++)
      if (getFileSize(files[i]) <= options.max_file_size)
        size += getFileSize(files[i]);
    return size;
  }

  function clearLimitExceeded() {
    var i = 0;
    while (i < files.length) {
      if (getFileSize(files[i]) > options.max_file_size || !checkSize(files[i])) {
        files.splice(i, 1);
        continue;
      }

      i++;
    }
  }

  function getExceededLimitFiles() {
    var count = 0;
    for (var i = 0; i < files.length; i++)
      if (getFileSize(files[i]) > options.max_file_size) count++;
    return count;
  }

  var arch = Utils.getCpuArch()
  var size2gb = 2 * 1024 * 1024 * 1024
  var size4gb = 4 * 1024 * 1024 * 1024

  function checkSize(file) {
    return (arch == 32 && file.size < size2gb) || (arch == 64 && file.size < size4gb)
  }

  function startUpload() {
    if (files.length == 0) {
      options.onError( { errorMessage: options.i18n.no_files_selected } )
      options.onCleanup()
      return
    }

    prepareFiles(files, function() {
      var count = getExceededLimitFiles()
      if (count == files.length) {
        options.onError({ errorMessage: options.i18n.file_size_exceeded })
        options.onCleanup()
        return
      }

      if (count > 0) {
        if (!options.onConfirm(options.i18n.some_files_size_exceeded)) {
          options.onCleanup()
          return
        }
      } else {
        for (var i in files) {
          var file = files[i]
          if (checkSize(file)) continue

          if (!options.onConfirm(options.i18n.some_files_size_exceeded)) {
            options.onError({errorMessage: options.i18n.you_cannot_upload})
            options.onCleanup()
            return
          }
        }
      }

      totalSize = getFilesSize()
      UploadModule.getFreeSpace(files[0]._uploadDir, function(response) {
        if (response.freeSpace < totalSize) {
          options.onError({ errorMessage: options.i18n.not_enough_free_space })
          options.onCleanup()
          return
        }

        totalLoaded = 0
        currentLoaded = 0
        uploadStarts = true
        options.onStart()
        clearLimitExceeded()
        uploadFile(files.pop())
      })
    })
  }

  function uploadFile(file) {
    function onError(e) {
      UploadModule.log('onError')
      UploadModule.dir(e)
      UploadModule.log('readyState=' + xhr.readyState)

      file._changeDCattempts = file._changeDCattempts ? file._changeDCattempts : 0

      if (file._changeDCattempts > options.max_change_dc_attempts) {
        uploadStarts?cancelUpload():""
      } else {
        if (currentLoaded > 0) {
          if (confirm(options.i18n.want_change_dc)) {
            file._changeDCattempts++
            // Attempt to change DC
            getNewUploadUrl(file, function(status) {
              status ? uploadFile(file) : uploadStarts?cancelUpload():""
            })
          }
        } else {
          file._changeDCattempts++
          // Attempt to change DC
          getNewUploadUrl(file, function(status) {
            status ? uploadFile(file) : uploadStarts?cancelUpload():""
          })
        }
      }
    }

    xhr = new XMLHttpRequest()
    xhr._currentFile = file
    xhr.upload.onprogress = onProgress
    xhr.onreadystatechange = onReadyStateChange
    xhr.onerror = onError

    xhr.open('POST', url + '&keepName=' + keepName +
                           (file._data ? '&base64' : '') +
                           (file._data ? '&content-length=' + file._data.length : '') +
                           (updateFileId ? '&updateFileId=' + updateFileId : ''), true)
    if (file._uploadDir)
      xhr.setRequestHeader('x-upload-dir', file._uploadDir)
    xhr.setRequestHeader('x-root-dir', AjaxFacade.rootDirId)
    xhr.setRequestHeader('x-file-name', encodeURIComponent(file.fileName ? file.fileName : file.name))
    xhr.setRequestHeader('cookie', document.cookie)
    xhr.setRequestHeader('x-cookie', document.cookie)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')

    if (file._data)
      xhr.sendAsBinary(file._data)
    else
      xhr.send(file)
  }

  function onProgress(e) {
    if (!uploadStarts) return
    if (!e.lengthComputable) return

    currentLoaded = e.loaded

    var progressStatus = {
      id: xhr._currentFile._uiFileId,
      fileLoaded: e.loaded,
      fileSize: getFileSize(xhr._currentFile),
      loaded: (totalLoaded + e.loaded),
      total: totalSize
    };
    options.onProgress(progressStatus)
  }

  function onReadyStateChange(e) {
    UploadModule.log('onReadyStateChange');
    UploadModule.dir(e);

    if (!uploadStarts) return;

    if (xhr.readyState == 4) {
      if(xhr.status == 200){
        var response = $.parseJSON(xhr.responseText)
        if(response.status == 'OK'){
          xhr._currentFile._fileId = response.uploadedFileId
          options.onFileUploaded(xhr._currentFile)
        }else{
          options.onFileError(xhr._currentFile)
        }
      }else if(!xhr._currentFile._canceled){
        options.onFileError(xhr._currentFile)
      }
      if (files.length == 0) {
        uploadStarts = false
        if (xhr.responseText) {
          var response = eval('(' + xhr.responseText + ')')
          options.onComplete(response)
        }
        options.onCleanup()
        return
      }

      totalLoaded += currentLoaded
      uploadFile(files.pop())
    }
  }

  this.start = function() {
    if (uploadStarts) return

    files = []
    $('input[type=file]', options.upload_form).each(function() {
      for (var i = 0; i < this.files.length; i++) {
        this.files[i]._uploadDir = UploadModule.getCurrentDirIdForUpload()
        files.push(this.files[i])
      }
    })
    UploadModule.addUIFileId(files)
    options.onAddFiles(files)
    startUpload()
  }

  this.add = function(file, input, opt) {
    opt = opt || {}

    prepareFiles([file], function() {
      if (getFileSize(file) > options.max_file_size) {
        options.onError( { errorMessage: options.i18n.file_size_exceeded } )
        options.onCleanup()
        return
      }

      if (!checkSize(file)) {
        options.onError({errorMessage: options.i18n.you_cannot_upload})
        options.onCleanup()
        return
      }

      file._uploadDir = UploadModule.getCurrentDirIdForUpload()

      if (uploadStarts) {
        UploadModule.getFreeSpace(file._uploadDir, function(response) {
          if (response.freeSpace < totalSize + getFileSize(file)) {
            options.onError({ errorMessage: options.i18n.not_enough_free_space })
            return
          }

          files.push(file)
          totalSize += getFileSize(file)
        })
      } else {
        files.push(file)
        startUpload()
      }
    })
    UploadModule.addUIFileId([file])
    options.onAddFiles([file])
  }

  this.update = function(input) {
    var form = input.parents('form:first')

    keepName = $('input[name=keepName]', form).val()
    updateFileId = $('input[name=updateFileId]', form).val()

    var file = input[0].files[0]

    if (file.size > options.max_file_size) {
      options.onError( { errorMessage: options.i18n.file_size_exceeded } )
      options.onCleanup()
      return
    }

    file._uploadDir = UploadModule.getCurrentDirIdForUpload()
    files.push(file)

    if (uploadStarts) {
      totalSize += file.size
      return
    }
    files.push(file)
    UploadModule.addUIFileId([file])
    options.onAddFiles([file])
    startUpload()
  }

  function stopUpload(){
    uploadStarts = false
    resizeStart = false
    if (xhr) xhr.abort()
    files = []
  }

  this.cancelFile = function(fileId){
    var cancel = false
    var currentFile = null
    if(xhr._currentFile._uiFileId == fileId){
      var currentFile =  xhr._currentFile
      currentFile._canceled = true
      if(files.length == 0){
        cancelUpload()
        return
      }else{
        totalLoaded -= currentLoaded
        xhr.abort()
      }
    }else{
      for(var i=0; i < files.length; i++){
        if(files[i]._uiFileId == fileId){
          var currentFile =  files[i]
          files.splice(i, 1)
        }
      }
    }
    if(currentFile){
      options.onFileCanceled(currentFile)
      totalSize -= getFileSize(currentFile)
    }
  }

  this.cancel = function() {
    cancelUpload()
  }

  function cancelUpload(){
    stopUpload()
    options.onCancel()
    options.onCleanup()
  }

  this.options = function(key, value) {
    options[key] = value
  }

  this.canResumeUpload = function() {
    return false
  }

  return this
}

UploadModule.HandlerUploadXhr.isSupported = function() {
    return !!('multiple' in document.createElement('input')) && UploadModule.FileSupported() && UploadModule.XhrUploadSupported();
}

UploadModule._canResumeUpload = null
UploadModule.canResumeUpload = function() {
  if (UploadModule._canResumeUpload == null)
    UploadModule._canResumeUpload = (UploadModule.FileSupported() && UploadModule.XhrUploadSupported() && UploadModule.FilePrototypeSliceSupported())
  return UploadModule._canResumeUpload
}

UploadModule.HandlerUploadFlash = function(options) {
  var uploadedFileId = 0;
  var errorMessage = false

  version = options.plupload_version ? options.plupload_version + '/' : ''
  var uploader = new plupload.Uploader({
    runtimes : 'flash',
    container: 'flash_container',
    browse_button : options.flash_select_files_id,
    max_file_size : Math.floor(options.max_file_size / 1024 / 1024) + 'mb',
    //max_file_size : '1mb',
    //chunk_size: '1mb',
    multipart : true,
    multi_selection: true,
    url: options.url + (AjaxFacade.rootDirId ? '&x-root-dir=' + AjaxFacade.rootDirId : ''),
    flash_swf_url : '/js/plupload/' + version + 'plupload.flash.swf?rnd' + Math.random(),
    silverlight_xap_url : '/js/plupload/' + version + 'plupload.silverlight.xap'
  });
  //options.max_file_size = 1024 * 1024;

  uploader.bind('Init', function(up, params) {
    UploadModule.log('Flash uploader init');
    UploadModule.log('Current runtime: ' + params.runtime);
  });

  uploader.bind('Error', function(up, args) {
    UploadModule.log('Flash uploader error')
    UploadModule.dir(args)

    if (args.code == -300) {
      options.onError({errorMessage: options.i18n.you_cannot_upload_flash})
      uploader.stop()
      uploader.refresh()

      options.onCleanup()
    }
  })

  var size2gb = 2 * 1024 * 1024 * 1024

  function checkFileSize(file) {
    if (file.size <= 0) return false
    if (file.size < size2gb) return true

    return Utils.getCpuArch() != 32 && (!$.browser.msie || ($.browser.msie && $.browser.version >= 9))
  }

  uploader.bind('FilesAdded', function(up, files) {
    UploadModule.log('FilesAdded');
    UploadModule.dir(files);

    var errorFiles = []
    var i = 0
    while (i < files.length) {
      if (checkFileSize(files[i])) {
        i++
        continue
      }

      errorFiles.push(files[i])
      files.splice(i, 1)
    }

    if (errorFiles.length > 0 && files.length > 0) {
      var hasMore = false
      var names = $.map(errorFiles, function(file, i) {
        if (i > 3) {
          hasMore = i
          return
        }
        return (file.name);
      })

      var message = options.i18n.some_files_cannot_upload_flash
      message += '\n'
      message += names.join('\n')
      if (hasMore) message += '\n' + options.i18n.errors_files_flash.replace('$[p1]', hasMore)
      message += '\n' + options.i18n.continue_without_flash

      if (!confirm(message)) {
        options.onCleanup()
        return
      }
    } else if (files.length == 0) {
      options.onError({errorMessage: options.i18n.you_cannot_upload_flash})
      options.onCleanup()
      return
    }

    var _files = []
    for (var i in files) {
      if (files[i].size > options.max_file_size) continue
      if (files[i].size < 0) continue
      _files.push(files[i])
    }

    for (var i in uploader.files) {
      uploader.removeFile(uploader.files[i])
    }

    if (_files.length == 0) {
      options.onError({ errorMessage: options.i18n.file_size_exceeded })
      options.onCleanup()
      return
    }

    if (files.length > _files.length) {
      if (!options.onConfirm(options.i18n.some_files_size_exceeded)) {
        uploader.stop()
        uploader.refresh()
        options.onCleanup()
        return
      }
    }

    options.onFlashFilesAdded(_files)
  });

  uploader.bind('UploadFile', function(up, file) {

  });

  uploader.bind('UploadProgress', function(up, file) {
    var progressStatus = {
      id: file._uiFileId,
      fileLoaded: file.loaded,
      fileSize: file.size,
      loaded: up.total.loaded,
      total: up.total.size
    };
    options.onProgress(progressStatus);
  });

  uploader.bind('FileUploaded', function(up, file, res) {
    UploadModule.log('FileUploaded');

    var doc = $('<div>' + res.response + '</div>');

    if (doc.find('#uploadedFileId') && doc.find('#uploadedFileId').val()) {
      var sizeOk = doc.find('#sizeOk');
      uploadedFileId = doc.find("#uploadedFileId").val();
      file._fileId = uploadedFileId
      options.onFileUploaded(file)
    } else if (doc.find('#alert') && doc.find('#alert').val()) {
      errorMessage = doc.find('#alert').val();
      options.onFileError(file)
    }
  });

  uploader.bind('UploadComplete', function(up, file, res) {
    UploadModule.log('UploadComplete');

    if (uploadedFileId)
      options.onComplete({ status: "OK", "uploadedFileId": uploadedFileId });
    if (errorMessage)
      options.onError({ errorMessage: errorMessage });

    options.onCleanup()
    uploader.refresh()
  });

  this.start = function() {
    uploadedFileId = 0
    errorMessage = false
    var totalSize = 0

    UploadModule.log('Start')
    UploadModule.dir(uploader.files)

    if (typeof currentDirId != 'undefined'){
      for(var i=0; i < uploader.files.length; i++){
        uploader.files[i]._uploadDir = UploadModule.getCurrentDirIdForUpload()
        totalSize += uploader.files[i].size
      }
    }
    UploadModule.validationFreeSpace(totalSize, options, function() {
      UploadModule.addUIFileId(uploader.files)
      options.onAddFiles(uploader.files)
      uploader.start()
      options.onStart()
      uploader.refresh()
    })
  }

  this.cancelFile = function(fileId){
    var currentFile = null
    for(var i=0; i < uploader.files.length; i++){
      if(uploader.files[i]._uiFileId == fileId){
        var currentFile =  uploader.files[i]
        if(currentFile.status == 2){
          uploader.stop()
          uploader.removeFile(currentFile)
          uploader.start()
        }else{
          uploader.removeFile(currentFile)
        }
      }
    }
    if(currentFile){
      options.onFileCanceled(currentFile)
    }
  }

  this.cancel = function() {
    uploadedFileId = 0
    errorMessage = false

    uploader.stop()

    options.onCancel()
    options.onCleanup()
  }

  this.init = function() {
    //uploader.init();
  }

  this.refresh = function() {
    uploader.refresh()
  }

  this.canResumeUpload = function() {
    return false
  }

  uploader.init()
  uploader.refresh()
}

UploadModule.HandlerUploadResumable = function(options) {
  options = $.extend(true, {
    resumable: {
      section_size: 500 * 1024,
      max_simultaneous_files: 2,
      max_threads: 2,
      user_agents: 'chrome,firefox'
    }
  }, options)

  var url = options.url.replace('upload.jsp', 'upload5.jsp')

  var files = []
  var idsInProccess = []
  var uploadFiles = []
  var uploadStarts = false
  var totalLoaded = 0
  var totalSize
  var keepName = false
  var simultaneous = 0
  var canceledFilesId = []
  var existingDirId = 0

  function extractOnlyPath(webkitRelativePath) {
    var arr = webkitRelativePath.split(/[\\/]/)
    arr.splice(arr.length - 1)
    return arr.join('/')
  }

  function addFileInProccess(file) {
    idsInProccess.push(parseInt(file._fileId))
  }

  function removeFileFromProccess(file) {
    var index = idsInProccess.indexOf(parseInt(file._fileId))
    idsInProccess.splice(index, 1)
  }

  function checkFileInProccess(file) {
    var index = idsInProccess.indexOf(parseInt(file._fileId))
    return index >= 0
  }

  function clearInProccessFiles() {
    idsInProccess = []
    uploadFiles = []
  }

  function getFilesSize() {
    var size = 0
    for (var i = 0; i < files.length; i++)
      if (files[i].size <= options.max_file_size)
        size += files[i].size
    return size
  }

  function getFilesSize2(files) {
    var size = 0
    for (var i = 0; i < files.length; i++)
      if (files[i].size <= options.max_file_size)
        size += files[i].size
    return size
  }

  function clearLimitExceeded() {
    var i = 0;
    while (i < files.length) {
      if (files[i].size > options.max_file_size) {
        files.splice(i, 1)
        continue
      }

      i++
    }
  }

  function clearLimitExceeded2(files) {
    var i = 0;
    while (i < files.length) {
      if (files[i].size > options.max_file_size) {
        files.splice(i, 1)
        continue
      }

      i++
    }
  }

  function getNewUploadUrl(file, callback) {
    // Change upload url for file
    $.ajax({
      type: 'post',
      url: '/rest/sharedFileUpload/newUploadUrl',
      data: {
        fileId: file._fileId
      },
      success: function(data) {
        file._url = data.url
        file._sections = []
        totalLoaded -= file._loaded
        file._loaded = 0
        callback(true)
      },
      error: function(xhr, textStatus, errorThrown) {
        callback(false)
      }
    })
  }

  function sendError(method, status, file) {
    // Send error
    $.ajax({
      type: 'post',
      url: '/rest/sharedFileUpload/error',
      data: {
        method: method,
        status: status,
        fileId: file._fileId,
        uploadUrl: file._url
      }
    })
  }

  function setSections(files, data) {
    for (var i in files) {
      for (var j in data) {
        if (!compareFileData(files[i], data[j])) continue
        if (files[i]._sections) continue

        files[i]._url = data[j].url
        files[i]._fileId = data[j].id
        files[i]._d1link = data[j].d1link
        files[i]._uploadDir = data[j].uploadDir
        files[i]._sections = []

        var sections = data[j].sections
        for (var start in sections) {
          files[i]._sections.push({start: parseInt(start), length: sections[start]})
          totalLoaded += sections[start]
          files[i]._loaded += sections[start]
        }
      }
    }
  }

  function checkNotYetUploaded(files, forceResume, callback) {

    function proccessFile(index) {
      var file = files[index]
      if (file.name == '.') {
        index++
        if (files.length >= index) {
          callback()
          return
        }

        proccessFile(index)
        return
      }

      var pathParam = ''
      if (file.webkitRelativePath) {
        pathParam += '&path=' + decodeURIComponent(extractOnlyPath(file.webkitRelativePath))
      }
      $.ajax({
        type: 'get',
        url: '/rest/sharedFileUpload/status?dirId=' + file._uploadDir + pathParam,
        beforeSend: function(xhr) {
          xhr.setRequestHeader('x-root-dir', AjaxFacade.rootDirId)
        },
        success: function(data) {
          if (!forceResume) {
            uploadResumableDialog(data, callback)
            return
          }

          label:

          for (var i in files) {
            for (var j in data) {
              if (files[i].name != data[j].name) continue
                setSections(files, data)
              }
          }

          index++
          if (files.length >= index) {
            callback()
            return
          }

          proccessFile(index)
        },
        error: function() {
          if (forceResume) {
            options.onInterrupt()
          } else {
            uploadStarts = false
            files = []
            clearInProccessFiles()
            options.onError({errorMessage: 'Internal server error'})
            options.onCleanup()
          }
        }
      })
    }

    proccessFile(0)
  }

  function checkDirExists(files, callback) {
    var file = files[0];
    var pathParam = '';
    if (file.webkitRelativePath) {
      pathParam += '&path=' + decodeURIComponent(extractOnlyPath(file.webkitRelativePath))
    }

    $.ajax({
      type: 'get',
      url: '/rest/sharedFileUpload/checkDirExists?dirId=' + file._uploadDir + pathParam,
      beforeSend: function(xhr) {
        xhr.setRequestHeader('x-root-dir', AjaxFacade.rootDirId)
      },
      success: function(data) {
        if (data.dirId > 0) {
          existingDirId = data.dirId;
          options.onFolderExistsConfirm(function(result){
            if(result){
              for(var f in files){
                files[f]._skipExisting = result.skipExisting;
              }
              callback();
            }else{
              uploadStarts = false
              files = []
              options.onCancel()
              options.onCleanup()
            }
          });
        }else{
          callback();
        }
      },
      error: function() {
        uploadStarts = false
        files = []
        clearInProccessFiles()
        options.onError({errorMessage: 'Internal server error'})
        options.onCleanup()
      }
    })
  }


  function compareFileData(file, data) {
    return file.name == data.name && file.size == data.size && (!file._fileId || file._fileId == data.id)
  }

  function uploadResumableDialog(data, callback) {
    function setAttributes(file, attrs) {
      file._url = attrs.url
      file._fileId = attrs.id
      file._sections = []

      var sections = attrs.sections
      for (var start in sections) {
        file._sections.push({start: parseInt(start), length: sections[start]})
        totalLoaded += sections[start]
        file._loaded += sections[start]
      }
    }

    function proccessFile(index, flags) {
      for (var i = index; i < files.length; i++) {
        for (var j in data) {
          if (!compareFileData(files[i], data[j])) continue

          if (flags) {
            if (flags.newUpload) {

            } else if (flags.resumeUpload) {
              setAttributes(files[i], data[j])
            }

            continue
          }

          options.onResumableFileConfirm(files[i], function(result) {
            if (!result) {
              uploadStarts = false
              files = []
              options.onCancel()
              options.onCleanup()
            } else if (result.newUpload) {
              proccessFile(i + 1, result.all ? result : null)
            } else if (result.resumeUpload) {
              setAttributes(files[i], data[j])
              proccessFile(i + 1, result.all ? result : null)
            }
          })

          return
        }
      }

      callback()
    }

    proccessFile(0)
  }

  function getExceededLimitFiles() {
    var count = 0
    for (var i = 0; i < files.length; i++)
      if (files[i].size > options.max_file_size) count++
    return count
  }

  function getExceededLimitFiles2(files) {
    var count = 0
    for (var i = 0; i < files.length; i++)
      if (files[i].size > options.max_file_size) count++
    return count
  }

  function createNextSection(file) {
    var start = null
    var length = false

    if (!file._sections || !file._sections.length) {
      file._sections = []
      start = 0
    } else {
      var prev = file._sections[0]
      if (prev.start > 0) {
        // Пропущена первая секция
        start = 0
        length = prev.start
      } else {
        for (var i = 1; i < file._sections.length; i++) {
          if (prev.start + prev.length < file._sections[i].start) {
            start = prev.start + prev.length
            length = file._sections[i].start - (prev.start + prev.length)
            break
          }

          prev = file._sections[i]
        }
      }

      if (start == null)
        start = prev.start + prev.length
    }

    if (!length)
      length = Math.min(file.size - start, options.resumable.section_size)
    else
      length = Math.min(length, options.resumable.section_size);
    if (length <= 0) return null

    var section = {start: start, length: length}
    file._sections.push(section)

    return section
  }

  var _this = this
  function sendSection(file, section) {
    UploadModule.log(' ')
    UploadModule.log('[sendSection]')
    UploadModule.log('start = ' + (section.start / 1024 + 'Kb') + ', length = ' + (section.length / 1024 + 'Kb'))

    file._threads++

    var xhr = new XMLHttpRequest()
    xhr._currentLoaded = 0
    xhr.timeout = 3000

    var xmlHttpTimeout = setTimeout(xhrError, 15000)
    function restartTimer() {
      clearTimeout(xmlHttpTimeout)
      xmlHttpTimeout = setTimeout(xhrError, 15000)
    }

    function checkCanceledFile(){
      if ($.inArray(file._uiFileId, canceledFilesId) == -1) return false
      options.onFileCanceled(file)
      file._threads --
      if (file._threads == 0){
        changeTotalForCancelFile(file)
        finish(file)
      }
      return true
    }

    xhr.upload.onprogress = function(e) {
      if (!uploadStarts || checkCanceledFile()) {
        clearTimeout(xmlHttpTimeout)
        xhr.abort()
        return
      }

      if (!e.lengthComputable) return

      totalLoaded += e.loaded - xhr._currentLoaded
      file._loaded += e.loaded - xhr._currentLoaded
      xhr._currentLoaded = e.loaded

      var progressStatus = {
        fileId: file._fileId,
        id: file._uiFileId,
        fileLoaded: file._loaded,
        fileSize: file.size,
        loaded: totalLoaded,
        total: totalSize
      }
      options.onProgress(progressStatus)

      restartTimer()
    }

    xhr.onreadystatechange = function() {
      if (!uploadStarts || checkCanceledFile()) {
        clearTimeout(xmlHttpTimeout)
        xhr.abort()
        return
      }

      restartTimer()

      UploadModule.log(' ')
      UploadModule.log('[Ready state change]')
      UploadModule.log('xhr.readyState = ' + xhr.readyState)
      UploadModule.log('xhr.status = ' + xhr.status)

      if (xhr.readyState != 4 || xhr.status != 200) return

      if (xhr.responseText) {
        var response = eval('(' + xhr.responseText + ')');
        if (response.status == 'error') {
          xhrError()
          return;
        }
      }

      clearTimeout(xmlHttpTimeout)

      file._threads--
      UploadModule.log('threads=' + file._threads)

      var section = createNextSection(file)
      if (section == null) {
        if (file._threads == 0)
          uploadFinishFile(file)
      } else {
        sendSection(file, section)
      }
    }

    function checkInternetAvaliable(callback) {
      $.ajax({
        type: 'get',
        url: '/blank.jsp',
        success: function() {
          callback(true)
        },
        error: function() {
          callback(false)
        }
      })
    }

    function xhrError(e) {
      clearTimeout(xmlHttpTimeout)

      UploadModule.log(' ')
      UploadModule.log('[Error]')
      UploadModule.log('xhr.status=' + xhr.status)
      UploadModule.log('simultaneous=' + simultaneous)

      sendError('send section', xhr.status, file)

      totalLoaded = totalLoaded - xhr._currentLoaded
      file._loaded -= xhr._currentLoaded
      file._threads--

      UploadModule.log('threads=' + file._threads)
      // удаляем секцию
      var index = file._sections.indexOf(section)

      file._sections.splice(index, 1)
      if (file._threads == 0) {
        simultaneous--

        // Возвращаем файл
        files.push(file)

        if (simultaneous == 0) {
          // Нет файлов без ошибок
          file._changeDCattempts = file._changeDCattempts ? file._changeDCattempts : 0
          if (file._changeDCattempts > options.max_change_dc_attempts) {
            options.onInterrupt()
          } else {
            checkInternetAvaliable(function (result) {
              if (result && (xhr._currentLoaded < 0 || confirm(options.i18n.want_change_dc))) {
                file._changeDCattempts++
                // Attempt to change DC
                getNewUploadUrl(file, function (status) {
                  if (status) {
                    xhr._currentLoaded = 0
                    uploadFile(file)
                  } else
                    options.onInterrupt()
                })
              } else
                options.onInterrupt()
            })
          }
        }
      }

      xhr.abort()
    }

    xhr.onerror = function(e) {
      UploadModule.log('[xhr.onerror]')
      UploadModule.dir(e)
      xhrError(e)
    }

    var u = file._url ? file._url : url

    xhr.open('POST', u + (keepName ? '&keepName=1' : '') +
                     '&resumableFileId=' + file._fileId +
                     '&resumableFirstByte=' + section.start, true)
    if (file._uploadDir)
      xhr.setRequestHeader('x-upload-dir', file._uploadDir)
    xhr.setRequestHeader('x-root-dir', AjaxFacade.rootDirId)
    xhr.setRequestHeader('x-file-name', encodeURIComponent(file.fileName ? file.fileName : file.name))
    xhr.setRequestHeader('cookie', document.cookie)
    xhr.setRequestHeader('x-cookie', document.cookie)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    var chunk = file.slice(section.start, section.length)
    xhr.send(chunk)
  }

  function uploadFile(file) {
    simultaneous++

    file._threads = 0
    uploadFiles.push(file)

    for (var i = 0; i < options.resumable.max_threads; i++) {
      var section = createNextSection(file)
      if (section == null) {
        if (file._threads == 0) {
          uploadFinishFile(file)
        }

        return
      }
      sendSection(file, section)
    }
  }

  function uploadStartFile(file) {
    UploadModule.log(' ')
    UploadModule.log('[Upload start file]')
    UploadModule.log(file._fileId)

    var pathParam = ''
    if (file.webkitRelativePath) {
      pathParam += '&path=' + decodeURIComponent(extractOnlyPath(file.webkitRelativePath))
    }

    var skipIfExistsParam = ''
    if (file._skipExisting) {
      skipIfExistsParam += '&skipIfExists=' + file._skipExisting;
    }

    $.ajax({
      type: 'post',
      url: '/rest/sharedFileUpload/create?dirId=' + file._uploadDir + '&name=' + encodeURIComponent(file.fileName ? file.fileName : file.name) + '&size=' + file.size + pathParam + skipIfExistsParam,
      beforeSend: function(xhr) {
        xhr.setRequestHeader('cookie', document.cookie)
        xhr.setRequestHeader('x-cookie', document.cookie)
        xhr.setRequestHeader('x-root-dir', AjaxFacade.rootDirId)
      },
      success: function(data) {
        if (!data.status) {
          options.onError({errorMessage: data.message})
          options.onCleanup()
          return
        }

        if(file._skipExisting && data.exists){
          simultaneous++;
          totalLoaded += file.fileSize;
          options.onProgress({
            loaded: totalLoaded,
            total: totalSize
          });
          finish(file);
          return;
        }

        file._url = data.url
        file._fileId = data.fileId
        file._d1link = data.d1link
        file._uploadDir = data.uploadDir
        uploadFile(file)
      },
      error: function(xhr, ajaxOptions, thrownError) {
        files.push(file)
        sendError('start', xhr.status, file)
      }
    })
  }

  function finish(file) {
    simultaneous--
    if ($.inArray(file._uiFileId, canceledFilesId) == -1){
      options.onFileUploaded(file)
    }
    removeFileFromProccess(file)
    if (simultaneous > options.resumable.max_simultaneous_files) return

    if (files.length == 0 && simultaneous == 0) {
      uploadStarts = false

      options.onComplete({ status: "OK" })
      options.onCleanup()

      if(existingDirId != 0){
        $.get('/account/homeAction.jsp', {homemode : 37, dirId : existingDirId});
      }

      uploadFiles = []
      return
    }

    var len = Math.min(files.length, options.resumable.max_simultaneous_files)
    for (var i = 0; i < len; i++) {
      var f = files.pop()
      if (f._fileId)
        uploadFile(f)
      else
        uploadStartFile(f)
    }
  }

  function uploadFinishFile(file) {
    UploadModule.log(' ')
    UploadModule.log('[Upload finish file]')
    UploadModule.log(file._fileId)

    var reg = /https?\:\/\/(.*?)\//g
    var match = reg.exec(file._url)
    var u = match[0]

    $.ajax({
      type: 'post',
      url: u + 'rest/sharedFileUpload/finish?fileId=' + file._fileId,
      beforeSend: function(xhr) {
        xhr.setRequestHeader('cookie', document.cookie)
        xhr.setRequestHeader('x-cookie', document.cookie)
        xhr.setRequestHeader('x-root-dir', AjaxFacade.rootDirId)
      },
      success: function(data) {
        finish(file)
      },
      error: function(xhr, ajaxOptions, thrownError) {
        finish(file)
        sendError('finish', xhr.status, file)
      }
    })
  }

  function startUpload(forceResume) {
    if (files.length == 0) {
      options.onError( { errorMessage: options.i18n.no_files_selected } )
      options.onCleanup()
      return
    }

    var count = getExceededLimitFiles()
    if (count == files.length) {
      options.onError( { errorMessage: options.i18n.file_size_exceeded } )
      options.onCleanup()
      return
    }

    if (count > 0) {
      if (!options.onConfirm(options.i18n.some_files_size_exceeded)) {
        options.onCleanup()
        return
      }
    }

    totalSize = getFilesSize()
    totalLoaded = 0
    uploadStarts = true
    simultaneous = 0

    options.onStart()
    UploadModule.addUIFileId(files)
    options.onAddFiles(files)
    checkNotYetUploaded(files, forceResume, function() {
      clearLimitExceeded()

      UploadModule.getFreeSpace(files[0]._uploadDir, function(response) {
        if (response.freeSpace < totalSize) {
          options.onError({ errorMessage: options.i18n.not_enough_free_space })
          options.onCleanup()
          return
        }

        for (var i in files) addFileInProccess(files[i])

        var len = Math.min(files.length, options.resumable.max_simultaneous_files)
        for (var i = 0; i < len; i++) {
          var f = files.pop()
          if (f._fileId)
            uploadFile(f)
          else
            uploadStartFile(f)
        }
      })
    })
  }

  this.start = function() {
    if (uploadStarts) return

    files = []
    $('input[type=file]', options.upload_form).each(function() {
      for (var i = 0; i < this.files.length; i++) {
        var name = this.files[i].fileName ? this.files[i].fileName : this.files[i].name
        if (name == '.') continue

        this.files[i]._uploadDir = UploadModule.getCurrentDirIdForUpload()
        files.push(this.files[i])
      }
    })
    if(options.checkDirExists && files.length > 0){
      checkDirExists(files, startUpload);
    }else{
      startUpload()
    }
  }

  this.resume = function() {
    uploadStarts = true
    simultaneous = 0
    options.onStart()
    clearLimitExceeded()

    checkNotYetUploaded(files, true, function() {
      clearLimitExceeded()

      for (var i in files) addFileInProccess(files[i])

      var len = Math.min(files.length, options.resumable.max_simultaneous_files)
      for (var i = 0; i < len; i++) {
        var f = files.pop()
        if (f._fileId) {
          var section = f._sections[f._sections.length - 1]
          totalLoaded += section.start + section.length
          uploadFile(f)
        } else
          uploadStartFile(f)
      }
    })
  }

  this.add = function(file, input, opt) {
    var afiles = (file.constructor == Array) ? file : [file]

    opt = opt || {}
    keepName = opt.keepName

    var count = getExceededLimitFiles2(afiles)
    if (count == afiles.length) {
      options.onError( { errorMessage: options.i18n.file_size_exceeded } )
      options.onCleanup()
      return
    }

    if (count > 0) {
      if (!options.onConfirm(options.i18n.some_files_size_exceeded)) {
        options.onCleanup()
        return
      }
    }

    for (var i = 0; i < afiles.length; i++) {
      var name = afiles[i].fileName ? afiles[i].fileName : afiles[i].name
      if (name == '.') continue

      if (!afiles[i]._uploadDir)
        afiles[i]._uploadDir = UploadModule.getCurrentDirIdForUpload()
    }

    clearLimitExceeded2(afiles)

    checkNotYetUploaded(afiles, true, function() {
      UploadModule.getFreeSpace(afiles[0]._uploadDir, function(response) {
        if (response.freeSpace < totalSize + getFilesSize2(afiles)) {
          options.onError({ errorMessage: options.i18n.not_enough_free_space })
          return
        }


        if (uploadStarts) {
          for (var i in afiles) {
            if (afiles[i].name == '.') continue
            files.push(afiles[i])
            totalSize += afiles[i].size
            addFileInProccess(afiles[i])
          }
        } else {
          for (var i in afiles) {
            if (afiles[i].name == '.') continue
            files.push(afiles[i])
            addFileInProccess(afiles[i])
          }

          totalSize = getFilesSize()
          totalLoaded = 0
          uploadStarts = true
          simultaneous = 0
          options.onStart()
          UploadModule.addUIFileId(afiles)
          options.onAddFiles(afiles)

          var len = Math.min(files.length, options.resumable.max_simultaneous_files)
          for (var i = 0; i < len; i++) {
            var f = files.pop()
            if (f._fileId) {
              var section = f._sections[f._sections.length - 1]
              totalLoaded += section.start + section.length
              uploadFile(f)
            } else
              uploadStartFile(f)
          }
        }

      })
    })
  }

  function stopUpload(){
    uploadStarts = false
    files = []
    clearInProccessFiles()
  }

  function changeTotalForCancelFile(file){
    totalLoaded -= file._loaded
    totalSize -= file.size
  }

  this.cancelFile = function(fileId){
    if($.inArray(parseInt(fileId), canceledFilesId) != -1) return
    var file = null
    for(var i = 0; i < files.length; i++){
      if(files[i]._uiFileId == fileId){
        file = files[i]
        files.slice(i, 1)
        break
      }
    }
    canceledFilesId.push(parseInt(fileId))
    if(!file) return
    removeFileFromProccess(file)
    changeTotalForCancelFile(file)
    options.onFileCanceled(file)
  }

  this.cancel = function() {
    stopUpload()
    options.onCancel(options.i18n.you_can_resume_upload)
    options.onCleanup()
  }

  this.checkFile = function(file) {
    return checkFileInProccess(file)
  }

  this.options = function(key, value) {
    options[key] = value
  }

  this.uploadFiles = function() {
    return uploadFiles
  }

  this.canResumeUpload = function() {
    return true
  }

  return this
}

UploadModule.readablizeBytes = function (bytes) {
  if (bytes == 0) {
    return '0 bytes'
  }
  var s = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  var e = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, Math.floor(e))).toFixed(2) + " " + s[e];
}

UploadModule.getUploadHandler = function(options) {
  $.browser.chrome = /chrome/.test(navigator.userAgent.toLowerCase());
  if ($.browser.chrome) {
    $.browser.safari = false
  }

  if ($.browser.safari) {
    var userAgent = navigator.userAgent.toLowerCase()
    userAgent = userAgent.substring(userAgent.indexOf('version/') + 8)
    userAgent = userAgent.split(' ')[0]
    userAgent = userAgent.substring(0, userAgent.indexOf('.'))
    $.browser.version = userAgent

    if ($.browser.version < 5) {
      return UploadModule.HandlerUploadForm
    }
  }

  if (!!('multiple' in document.createElement('input')) && UploadModule.FileSupported() && UploadModule.XhrUploadSupported()) {
    // fix File.slice method
    if ('mozSlice' in File.prototype) {
      File.prototype.slice = function(start, length) {
        return this.mozSlice(start, start + length)
      }
    }

    if ('webkitSlice' in File.prototype) {
      File.prototype.slice = function(start, length) {
        return this.webkitSlice(start, start + length)
      }
    }

    if ('slice' in File.prototype && (($.browser.mozilla && options.resumable.user_agents.indexOf('firefox') >= 0) || ($.browser.chrome && options.resumable.user_agents.indexOf('chrome') >= 0)))
      return UploadModule.HandlerUploadResumable
    else
      return UploadModule.HandlerUploadXhr
  } else
    return UploadModule.HandlerUploadForm
}

UploadModule.getAnonUploadHandler = function() {
  $.browser.chrome = /chrome/.test(navigator.userAgent.toLowerCase());
  if ($.browser.chrome) {
    $.browser.safari = false
  }

  if ($.browser.safari) {
    var userAgent = navigator.userAgent.toLowerCase()
    userAgent = userAgent.substring(userAgent.indexOf('version/') + 8)
    userAgent = userAgent.split(' ')[0]
    userAgent = userAgent.substring(0, userAgent.indexOf('.'))
    $.browser.version = userAgent

    if ($.browser.version < 5) {
      return UploadModule.HandlerUploadForm
    }
  }

  if (!!('multiple' in document.createElement('input')) && UploadModule.FileSupported() && UploadModule.XhrUploadSupported()) {
    return UploadModule.HandlerUploadXhr
  } else
    return UploadModule.HandlerUploadForm
}

UploadModule.validationFreeSpace = function(totalSize, options, callback, error) {
  UploadModule.getFreeSpace(UploadModule.getCurrentDirIdForUpload(), function(response) {
    if (response.freeSpace < totalSize) {
      options.onError({ errorMessage: options.i18n.not_enough_free_space })
      if ($.isFunction(error)) error()
      options.onCleanup()
      return
    }
    callback()
  })
}

UploadModule.getFreeSpace = function(dirId, callback) {
  // Anon upload
  if (!dirId) {
      callback({freeSpace : 10 * 1024 * 1024 * 1024});
      return;
  }
  dirId = dirId ? dirId : -1;

  $.ajax({
    type: 'get',
    url: '/rest/account/freeSpace?dirId=' + dirId,
    success: function(data) {
      callback(data)
    },
    error: function() {
      callback({})
    }
  })
}

UploadModule.ProgressMeter = function(options) {
  var isRun = false

  function loadProgressXML() {
    try {
      if ($.browser.msie && window.XDomainRequest) {
        var xdr = new XDomainRequest()
        xdr.open("get", options.progress_meter_url + '&' + Math.random())
        xdr.onload = function() {
          var dom = new ActiveXObject("Microsoft.XMLDOM")
          dom.async = false
          dom.loadXML(xdr.responseText)
          parseProgressXML(dom)
        }
        xdr.onerror = function() {
          options.onError({ errorMessage: 'Error uploading!' })
          options.onCleanup()
        }
        xdr.send()
      } else {
        $.ajax({
          url: options.progress_meter_url + '&' + Math.random(),
          cashe: false,
          success: function(data, textStatus, XMLHttpRequest) {
            parseProgressXML(data)
          },
          error: function (XMLHttpRequest, textStatus, errorThrown) {
            options.onError({ errorMessage: 'Error uploading!' })
            options.onCleanup()
          }
        })
      }
    } catch (err) {
      alert(err.description)
    }
  }

  function parseProgressXML(xml) {
    var status = xml.getElementsByTagName("status");
    if (!status) return;

    var el = status[0];

    var active = el.getAttribute("active")
    var percent = el.getAttribute("percent")
    var elapsedFormatted = el.getAttribute("elapsedFormatted")
    var timeleftFormatted = el.getAttribute("timeleftFormatted")
    var krate = el.getAttribute("krate")
    var sizeOk = el.getAttribute("sizeOk")
    var readBytes = el.getAttribute("readBytes")
    var totalLength = el.getAttribute("totalContentLengthKbytes") * 1024

    var progressStatus = {
      loaded: readBytes,
      total: totalLength
    };

    if (!isRun) return
    if (!progressStatus.total) return

    options.onProgress(progressStatus)
    setTimeout(loadProgressXML, 2000)
  }

  this.start = function() {
    isRun = true
    loadProgressXML()
  }

  this.stop = function() {
    isRun = false
  }

  return this
}

UploadModule.ProgressMeterJsonp = function(options) {
  var isRun = false

  this.start = function(callback, params) {
    isRun = true
    params = params||''
    Jsonp({
        url: options.progress_meter_url + params + '&' + Math.random(),
        jsonp: function(progressStatus) {
          if (!isRun) return
          if (!progressStatus.total) return

          if(typeof callback == 'function'){
            callback(progressStatus)
            return
          }
          options.onProgress(progressStatus)
        }
    })
  }

  this.stop = function() {
    isRun = false
  }

  return this
}

UploadModule.attachFileInputs = function(elements, callback) {
  elements.each(function() {
    $(this).attr('href', '#')

    $(this).css({
      position: 'relative',
      overflow: 'hidden',
      // Make sure browse button is in the right side
      // in Internet Explorer
      direction: 'ltr'
    })

    var input = $('<input>').attr('type', 'file')
                            .attr('name', 'name')
                            .attr('multiple', 'multiple')

    for (var key in this.attributes) {
      if (isNaN(key)) continue
      var attr = this.attributes[key]

      if (!/^data\-/i.test(attr.name)) continue
      input.attr(attr.name, attr.value)
    }

    input.css({
      position: 'absolute',
      // in Opera only 'browse' button
      // is clickable and it is located at
      // the right side of the input
      width: $(this).width() + 'px',
      right: 0,
      top: 0,
      fontFamily: 'Arial',
      // 4 persons reported this, the max values that worked for them were 243, 236, 236, 118
      fontSize: '118px',
      height: '100%',
      margin: 0,
      padding: 0,
      cursor: 'pointer',
      opacity: 0
    })

    $(this).append(input)

    var self = $(this)
    input.bind('change', function() {
      callback(input)
    })

    // IE and Opera, unfortunately have 2 tab stops on file input
    // which is unacceptable in our case, disable keyboard access
    if (window.attachEvent) {
      // it is IE or Opera
      input.setAttribute('tabIndex', "-1")
    }
  })
}

UploadModule.debug = true

UploadModule.log = function(text) {
  if (!UploadModule.debug) return
  try {
    console.log(text)
  } catch(e) { }
}

UploadModule.dir = function(object) {
  if (!UploadModule.debug) return
  try {
    console.dir(object)
  } catch(e) { }
}
