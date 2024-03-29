var loginFnc = {
  msgEmail: 'your e-mail',
  msgEmptyFirstName: 'You did not enter your first name',
  msgEmptyLastName: 'You did not enter your last name',
  msgEmptyEmail: 'You did not enter your e-mail address',
  msgEmptyPassword: 'You did not enter your password',
  msgEmptyPassword2: 'You did not confirm your password',
  msgPasswordsDontMatch : 'Your passwords didn\'t match. Try retyping them.',
  msgIncorrectEmail: 'Your e-mail address is incorrect.',
  msgTryAgain: 'Please try again.',
  msgOpenIdAccount: 'your OpenID account',

  showLoginBox : function(event){
    try {
      loginBox.set(event, undefined, 300, 10, 10);
      $('body').css('cursor', '');
      $('#loginBoxDiv').show();
      $('#loginfield').focus();
      $('#loginfield').select();
    }catch (e){
      alert(e);
    }
  },

  showSignUpBox : function(event){
    try {
      signUpBox.set(event, undefined, 810, 'c', 10);
      $('body').css('cursor', '');
      $('#signUpBoxDiv').show();
      $('#regloginfield').focus();
      $('#regloginfield').select();
    }catch (e){
      alert(e);
    }
  },

  doLogin : function(loginRedirect, serverURL, customCallback, sId, doNotRedirect, index){
    if($('#openid').val()){
      return true;
    }
    var login;
    var password;
    var remember;
    if(index){
      login = $('#iloginfield').val();
      password = $('#ipassfield').val();
      remember = $('#iremember').attr('checked');
    }else{
      login = $('#loginfield').val();
      password = $('#passfield').val();
      remember = $('#remember').attr('checked');
    }
    $("body").css("cursor", "progress");
    var params = {
        login: login,
        password: password,
        remember: remember,
        doNotRedirect: doNotRedirect != undefined ? doNotRedirect : 1
      };
    if(loginRedirect != undefined){
      params['fpRedirParam'] = loginRedirect;
    }

    if(typeof friend != 'undefined' && typeof friend.friendId != 'undefined' && friend.friendId != null) {
      params['friendId'] = friend.friendId;
      params['friendName'] = friend.friendName;
    }

    if(typeof sId != 'udefined' && sId != null) {
      params['sId'] = sId;
    }
    $.get(serverURL+'login?callback=?',
      params,
      function(data){
        $("body").css("cursor", "auto");
        if(data.ok){
          $("div.loginBoxDiv").hide();
          if(data.friendId) {
            changeFriendWithCallback(data.friendId, data.friendName, function() {
              if (data.loginRedirect) {
                location.replace(data.loginRedirect);
              } else {
                location.replace(loginFnc.getLocation());
              }
            });
            return false;
          }
          if(data.needActivation){
            location.replace(data.loginRedirect);
          }else if(typeof customCallback != 'undefined' && customCallback != null){
            customCallback();
          }else if(data.loginRedirect){
            location.replace(data.loginRedirect);
          }else{
            location.replace(loginFnc.getLocation());
          }
        }else{
          if(index){
            $('#iloginRejectReason').html(data.rejectReason);
            $('#iloginRejectReason').show();
          }else{
            $('#loginRejectReason').html(data.rejectReason);
            $('#loginRejectReason').show();
          }
        }
      },
      "jsonp"
    );
    return false;
  },

  su: '',

  doSignUp : function(loginRedirect, serverURL, customCallback, doNotRedirect, ppVisited, index, source){
    if(!loginFnc.checkSignUpForm(index)){
      return false;
    }
    var login = $('#regloginfield').val();
    var password = $('#regpassfield').val();
    var password2 = $('#regpassfield2').val();
    var plan = $('form[name=signUpForm] input:radio:checked').val();
    var months = $('form[name=signUpForm] select[name=months]').val();
    var df = $('form[name=signUpForm] input[name=df]').val();
    var sd = $('form[name=signUpForm] input[name=sd]').val();
    var rdv = $('form[name=signUpForm] input[name=resetDirView]').val();
    $("body").css("cursor", "progress");
      if(plan != "1") {
          PurchaseStats.registerClick(ppVisited);
      }
    var params = {
        login: login,
        password: password,
        password2: password2,
        doNotRedirect: doNotRedirect != undefined ? doNotRedirect : 1,
        fpRedirParam: loginRedirect,
        planSelect: plan,
        months: months,
        df: df,
        sd: sd,
        successUrl: this.su,
        resetDirView : rdv
      };
    if(typeof friend != 'undefined' && typeof friend.friendId != 'undefined' && friend.friendId != null) {
      params['friendId'] = friend.friendId;
      params['friendName'] = friend.friendName;
    }

    $.get(serverURL+'signup?callback=?',
      params,
      function(data){
        $("body").css("cursor", "auto");
        if(data.ok){
          $("div.signUpBoxDiv").hide();
          if(data.friendId) {
            changeFriendWithCallback(data.friendId, data.friendName, function() {
              if (data.redirectUrl) {
                loginFnc.redirect(data.redirectUrl);
              } else {
                loginFnc.redirect(loginFnc.getLocation());
              }
            });
            return false;
          }
          if(data.redirectUrl){
            loginFnc.redirect(data.redirectUrl);
          }else if(typeof(customCallback) != 'undefined' && customCallback != null){
            customCallback();
          }else{
            loginFnc.redirect(loginFnc.getLocation());
          }
        }else{
          if(data.errortype == 'password'){
            if (typeof source != 'undefined') {
                $('#sign_form_cp1_error').html(data.error).show();
                $('#sign_form_cp1').focus();
                $('#sign_form_cp1').select();
            } else {
                $('#signUpErrorPwd2Rsn').html(data.error);
                $('#signUpErrorPwd2').show();
                $('#regpassfield').focus();
                $('#regpassfield').select();
            }
          }else{
            if (typeof source != 'undefined') {
                $('#sign_form_log_error').html(data.error).show();
                $('#sign_form_log').focus();
                $('#sign_form_log').select();
            } else {
                $('#signUpErrorLoginRsn').html(data.error);
                $('#signUpErrorLogin').show();
                $('#regloginfield').focus();
                $('#regloginfield').select();
            }
          }
        }
      },
      "jsonp"
    );
    return false;
  },

  goToAccount: function(){
    loginFnc.redirect('account');
    return false;
  },

  redirect: function(lnk){
    var mSite = typeof mainSite != 'undefined' ? mainSite : '/'
    var $f = $('form[name=redirectToPageForm]');    
    if($f.length == 0){
      $f = $(document.createElement('form'));
      $f.attr('method', 'POST');
      $f.attr('action', mSite + 'javascriptRedirect.jsp');
      $f.attr('name', 'redirectToPageForm');
      $f.attr('id', 'redirectToPageForm');
      var $i = $(document.createElement('input'));
      $i.attr('type', 'hidden');
      $i.attr('name', 'url');
      $i.attr('value', lnk);
      $f.append($i);
      var $s = $(document.createElement('input'));
      $s.attr('type', 'submit');
      $s.attr('name', 'submit');
      $s.attr('value', 'submit');
      $f.append($s);
      $f.hide();
      $('body').append($f);
      $s.click();
    }else{
      $f.children('input[name=url]').val(lnk);
      $f.children('input[name=topage]').val(lnk);
      $f.submit();
    }
  },

  checkSignUpForm: function(index){
    var fname = $('#regfnamefield').val();
    var lname = $('#reglnamefield').val();
    var login = $('#regloginfield').val();
    var password = $('#regpassfield').val();
    var password2 = $('#regpassfield2').val();

    if(login==''){
      this.clearSignUpErrors();
      $('#signUpErrorLoginRsn').html(this.msgEmptyEmail);
      $('#regloginfield').addClass('error');
      $('#signUpErrorLogin').show();
//      if(index) {
//        this.showIndexPopup(this.msgEmptyEmail);
//      }
      $('#regloginfield').focus();
      $('#regloginfield').select();
      return false;
    }else if (password == ''){
      this.clearSignUpErrors();
      $('#signUpErrorPwdRsn').html(this.msgEmptyPassword);
      $('#regpassfield').addClass('error');
      $('#signUpErrorPwd').show();
//      if(index) {
//        this.showIndexPopup(this.msgEmptyPassword);
//      }
      $('#regpassfield').focus();
      $('#regpassfield').select();
      return false;
    }else if (fname == ''){
      this.clearSignUpErrors();
      $('#signUpErrorFNameRsn').html(this.msgEmptyFirstName);
      $('#regfnamefield').addClass('error');
      $('#signUpErrorFName').show();
      $('#regfnamefield').focus();
      $('#regfnamefield').select();
    }else if (lname == ''){
      this.clearSignUpErrors();
      $('#signUpErrorLNameRsn').html(this.msgEmptyLastName);
      $('#reglnamefield').addClass('error');
      $('#signUpErrorLName').show();
      $('#reglnamefield').focus();
      $('#reglnamefield').select();
//    }else if (password2 == ''){
//      this.clearSignUpErrors();
//      $('#signUpErrorPwd2Rsn').html(this.msgEmptyPassword2);
//      $('#signUpErrorPwd2').show();
//      if(index) {
//        this.showIndexPopup(this.msgEmptyPassword2);
//      }
//      $('#regpassfield2').focus();
//      $('#regpassfield2').select();
//      return false;
//    }else if (password != password2){
//      this.clearSignUpErrors();
//      $('#signUpErrorPwd2Rsn').html(this.msgPasswordsDontMatch);
//      $('#signUpErrorPwd2').show();
//      if(index) {
//        this.showIndexPopup(this.msgPasswordsDontMatch);
//      }
//      $('#regpassfield').focus();
//      $('#regpassfield').select();
//      return false;
    }else if (!this.checkEmail(trim(login))){
      this.clearSignUpErrors();
      $('#signUpErrorLoginRsn').html(this.msgIncorrectEmail + ' ' + this.msgTryAgain);
      $('#signUpErrorLogin').show();
//      if(index) {
//        this.showIndexPopup(this.msgIncorrectEmail + ' ' + this.msgTryAgain);
//      }
      $('#regloginfield').focus();
      $('#regloginfield').select();
      return false;
    }else{
      this.clearSignUpErrors();
      return true;
    }
  },

  clearSignUpErrors: function(){
    $('#signUpErrorFNameRsn').html('');
    $('#signUpErrorFName').hide();
    $('#signUpErrorLNameRsn').html('');
    $('#signUpErrorLName').hide();
    $('#signUpErrorLoginRsn').html('');
    $('#signUpErrorLogin').hide();
    $('#signUpErrorPwdRsn').html('');
    $('#signUpErrorPwd').hide();
//    $('#signUpErrorPwd2Rsn').html('');
//    $('#signUpErrorPwd2').hide();
    $('#regfnamefield').removeClass('error');
    $('#reglnamefield').removeClass('error');
    $('#regloginfield').removeClass('error');
    $('#regpassfield').removeClass('error');
  },

  checkEmail: function (email){
    var re=new RegExp('^[0-9_&a-zA-Z](?:\\w|\\.|\'|-)*@[\\d\\w]+(?:-?(?:\\w+|\\d+)|(?:\\.[0-9a-zA-Z]+))+$');
    return re.test(email);
  },

  checkEmailEx: function (email) {
    return /^([a-zA-Z0-9_\.-])+@([a-zA-Z0-9_-])+\.([a-zA-Z])+([a-zA-Z0-9_-])+/.test(email)
  },

  showIndexPopup: function(message) {
    AccountFacade.popup({
      content: message,
      title: "Sign Up"
    });
  },

  ltrim: function(str) {
    for(var k = 0; k < str.length && isWhitespace(str.charAt(k)); k++);
    return str.substring(k, str.length);
  },

  rtrim: function(str) {
    for(var j=str.length-1; j>=0 && isWhitespace(str.charAt(j)) ; j--) ;
    return str.substring(0,j+1);
  },

  trim: function(str) {
    return ltrim(rtrim(str));
  },

  isWhitespace: function(charToCheck) {
    var whitespaceChars = " \t\n\r\f";
    return (whitespaceChars.indexOf(charToCheck) != -1);
  },

  signOut : function(serverURL){
    $("body").css("cursor", "progress");
    serverURL = serverURL || '/';
    $.get(serverURL+'login?callback=?',
      {signout: 1},
      function(){
        $("body").css("cursor", "auto");
        window.location = serverURL;
      },
      "jsonp"
    );

    $('<iframe style="display: none">').attr('src', Config.mainSiteUrlPath + '/' + 'blank.jsp?signout=1').appendTo($(document.body)).load(function() {

    })

    return false;
  },

  getLocation : function(){
    var oldL = location.toString();
    if(oldL.indexOf('?') > -1){
      return oldL.substring(0, oldL.indexOf('?'));
    }
    return oldL;
  },

  clearLogin : function(){
    var field=document.getElementById('loginfield');
    if (field && field.value==this.msgEmail) {
        field.value="";
        field.className = field.className.replace("fieldhint ", "field ");
    }
  },

  clearPassword : function(){
    var field2=document.getElementById('passfield');
    if (field2 && field2.value=="********") {
        field2.value="";
        field2.className = field2.className.replace("fieldhint ", "field ");
    }
  },

  showLogin : function(){
    var field=document.getElementById('loginfield');
    if (field && field.value=="") {
        field.value=this.msgEmail;
        field.className = field.className.replace("field ", "fieldhint ");
    }
  },

  showPassword : function(){
    var field2=document.getElementById('passfield');
    if (field2 && field2.value=="") {
        field2.value="********";
        field2.className = field2.className.replace("field ", "fieldhint ");
    }
  },

  showOpenId : function(){
    var field=document.getElementById('openid');
    if (field && field.value=="") {
        field.className = field.className.replace("field ", "fieldhint ");
        field.value=this.msgOpenIdAccount;
    }
  },

  clearOpenId : function(){
    var field2=document.getElementById('openid');
    if (field2 && field2.value==this.msgOpenIdAccount) {
        field2.className = field2.className.replace("fieldhint ", "field ");
        field2.value="";
    }
  }
};
