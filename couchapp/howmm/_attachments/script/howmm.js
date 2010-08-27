var howmm = {util: {}};
(function(){with(Arrow){

  var dbname = location.toString().match(/\/(howmm?)\//)[1];
  howmm.db = new zaisu.DB(dbname, {
    design: 'howmm'
  });

  howmm.docs = function(element, app){
    $(element).evently("docs", app);
    $(element).pathbinder("index", "/docs");
    $(element).pathbinder("edit",  "/docs/edit/:id");
    $(element).pathbinder("show",  "/docs/:id");

    this.index = function(){
      $(element).trigger("index");
    }
  }

  howmm.util.message = function(message, base){
    $(base).find(".docs_message")
      .hide()
      .html("<span>"+ message +"</span>")
      .fadeIn("fast", function(){
        var self = this;
        setTimeout(function(){   $(self).fadeOut("slow")   }, 3000);
      });
  }

  howmm.account = function(element){
    this.user = {};
    this.login_ui  = $(element).find("div.login");
    this.logout_ui = $(element).find("div.logout");
    this.login_ui.hide();
    this.logout_ui.show();
    this.storage = new zaisu.LocalStorage("howmm::account");
    var self = this;

    //login check -----------------------------------------------
    this.after_login = function(data){
      howmm.is_offline = false;
      console.log("login success!!");
      self.login_ui.hide();
      self.logout_ui.show();
      self.logout_ui.find("span.name").html(data.userCtx.name);
    }

    this.check_identify = function(target){
      return (target.userCtx.name !== null);
    }

    this.check_login = simpleCPS(function(x, continues){
      console.log("login check ..!!");

      var online = Arrow.NOP
        .match(self.check_identify)
        .next(
          (Arrow(self.after_login).next(continues))
            ['+++']
          (self.login().next(continues))
        );
      var offline = self
        .offline_login()
        .next(continues)
        .end();

      $.aGetJSON("/_session")
      .next((online)['+++'](offline))
      .run();
    });

    //offline mode ----------------------------------------------
    this.offline_login = simpleCPS(function(x, continues){
      console.log("offline login try...");
      howmm.is_offline = true;
      $("body").html("<h1>offline!!</h1>");
    });

    //login action ----------------------------------------------
    this.login = simpleCPS(function(x, continues){
      console.log("login try...");
      self.login_ui.show();
      self.logout_ui.hide();

      var login_action = function(params, pass){
        if(typeof(params)==="object"){
          nam = params[0]; pas = params[1];
        }else{
          nam = params; pas = pass;
        }
        if(nam && pas){
          $.aAjax({
            url: "/_session", type: "POST",
            data:{name:nam, password:pas}
          })
          .error( self.offline_login().next(continues) )
          .next(  self.check_login().next(continues) )
          .run();
        }
      }

      self.login_ui.find("a").click(function(){
        myname = self.login_ui.find("input.name").val();
        mypass = self.login_ui.find("input.password").val();

        login_action(myname, mypass);
        self.ident_store.put(myname, mypass).run();
      });

      //Try auto-login
      self.ident_store.get().next(login_action).run();
    });

    //Identify Storage ---------------------------------------------
    this.ident_store = {}
    this.ident_store.get = function(){
      var storage = self.storage;
      return (
        (storage.getA("name"))
          ['&&&']
        (storage.getA("password"))
      );
    }
    this.ident_store.put = function(name, pass){
      var storage = self.storage;
      return (
        (storage.putA("name", name))
          ['&&&']
        (storage.putA("password", pass))
      );
    }

  }
}})();
