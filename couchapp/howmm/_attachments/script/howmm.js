var howmm = {util: {}};
(function(){with(Arrow){

  var dbname = location.toString().match(/\/(howmm?)\//)[1];
  howmm.db   = zaisu.DB.init(dbname);
  $.couch.db = zaisu.DB.init;

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

  howmm.account = function(element, session){
    this.login_ui  = $(element).find("div.login");
    this.logout_ui = $(element).find("div.logout");
    this.login_ui.hide();
    this.logout_ui.show();
    var self = this;

    this.login_ui.find("a").click(function(){
      var params = {};
      params.name = self.login_ui.find("input.name").val();
      params.pass = self.login_ui.find("input.password").val();
      zaisu.Session.current.login(params);
    });

    this.logout_ui.find("a").click(function(){
      zaisu.Session.current.logout();
    });

    session.onLogin(function(evt, data){
      console.log("login success!!");
      self.login_ui.hide();
      self.logout_ui.show();
      self.logout_ui.find("span.name").html(data.name);
    });

    session.onLogout(function(evt){
      console.log("logout success!!");
      self.login_ui.show();
      self.logout_ui.hide();
    });
  }
}})();
