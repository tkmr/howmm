var zaisu = zaisu || {};
(function(za){

  //Store my name and password-------------------------------
  za.Identify_store = za.newclass({
    initialize: function(){
      this.storage = new za.LocalStorage("zaisu::session");
    },
    get: function(){
      return Arrow(
        (this.storage.getA("name"))
          ['&&&']
        (this.storage.getA("password"))
      );
    },
    put: function(params){
      return Arrow(
        (this.storage.putA("name", params.name))
          ['&&&']
        (this.storage.putA("password", params.password))
      );
    }
  });

  //Control my session----------------------------------------
  var check_identify = function(target){
    return (target.userCtx.name !== null);
  }

  za.Session = za.newclass({
    initialize: function(options){
      this.ident_store   = new za.Identify_store();
      this.is_online     = true;
      var self           = this;

      with(Arrow){
        this.aLogout      = Arrow.fromCPS(this.logout);
        this.aOffline     = Arrow.fromCPS(this.offline);
        this.aOnline      = Arrow.fromCPS(this.online);
        this.aLogin       = Arrow.fromCPS(this.login);
        this.aCheck_login = jQuery
          .aGetJSON("/_session")
          .next(
            Match(check_identify)
            .errors(this.aLogin)
            .errors(WaitUntil(this,"login"))
          )
          .errors(this.aOffline);
      }
    },

    //Methods
    online: function(options, callback){
      console.log("switch to online mode...");
      this.is_online = true;
      this.trigger("onlined");
      callback();
    },
    offline: function(options, callback){
      console.log("switch to offline mode...");
      this.is_online = false;
      this.trigger("offlined");
      callback();
    },
    login: function(options, callback){
      console.log("try login...");
      options  = options || {};
      callback = callback || (function(){});
      var params = {};
      var self   = this;

      this.ident_store
        .get()
        .next(function(res){
          params.name     = options.name || res[0];
          params.password = options.pass || res[1];
        })
        .next($.aAjax({
          url: "/_session", type: "POST",
          data: params
        }))
        .next(function(resp){
          var res = zaisu.util.parseJSON(resp);
          if(res.ok){
            self.trigger("logined", [{name: params.name}]);
            self.ident_store.put(params).run();
          }else{
            return Arrow.LongError(res);
          }
        })
        .next(this.aOnline)
        .next(callback)
        .errors(function(e){
          self.logout();
          callback(Arrow.LongError(e));
        })
        .run();
    },
    logout: function(options, callback){
      console.log("try logout...");
      callback = callback || (function(){});
      var self = this;

      $.aAjax({
        url: "/_session", type: "DELETE"
      })
      .next(function(){
        self.trigger("logouted")
      })
      .next(callback)
      .run();
    },

    //Events handlers
    onOffline: function(handler){
      this.bind("offlined", handler)
    },
    onOnline: function(handler){
      this.bind("onlined", handler)
    },
    onLogin: function(handler){
      this.bind("logined", handler)
    },
    onLogout: function(handler){
      this.bind("logouted", handler)
    }
  });

  za.Session.current = new za.Session();

})(zaisu);