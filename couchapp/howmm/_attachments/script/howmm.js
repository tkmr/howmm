var howmm = {util: {}};
(function(){with(Arrow){
  var KEYS   = zaisu.Keys;

  var dbname = location.toString().match(/\/(howm[^\/]*)\//)[1];
  howmm.db   = zaisu.DB.init(dbname);
  $.couch.db = zaisu.DB.init;

  howmm.docs = function(element, app){
    var self = this;
    $(element).evently("docs", app);
    //  $(element).pathbinder("index", "/docs");
    //  $(element).pathbinder("edit",  "/docs/edit/:id");
    //  $(element).pathbinder("show",  "/docs/:id");

    this.index = function(docs){
      if(docs && docs.length > 0){
        $(element).trigger("index", [{
          docs: {rows:docs, offset:0, total_rows:docs.length}
        }]);
      }else{
        $(element).trigger("index", [{}]);
      }
    }

    this.local_index = function(){
      howmm.db.cache.local.get(KEYS.DOC_ENTRIES, function(doc_entries_map){
        var doc_entries = [];
        $.each(doc_entries_map, function(id, info){
          doc_entries.push({id:id, info:info});
        });
        self.view_docs(doc_entries, {cache:true, remote:false});
      });
    }

    this.search = function(word){
      if(!word) word = prompt('please input search text');

      howmm.db.view('wiki_search', {
        success: function(view_result){
          var doc_entries = [];
          $.each(view_result.rows, function(index, row){
            doc_entries.push({id:row.id, info:{updated_at:row.value.updated_at}});
          });
          self.view_docs(doc_entries);
        },
        descending: true,
        limit: 60,
        keys: [word]
      });
    }

    this.view_docs = function(doc_entries, options){
      options = $.extend({ cache:true, remote:true, sort:true }, options);
      var max  = 35;
      var docs = [];

      if(options.sort) doc_entries.sort(howmm.util.order_by_updated_at);

      (function(){
        if(doc_entries.length > 0 && docs.length < max){
          var continues = arguments.callee;
          var next_doc = doc_entries.pop();
          if(!(next_doc && next_doc.id && next_doc.id != 'undefined')) continues();

          howmm.db.openDoc(next_doc.id, function(doc){
            if(doc && doc._id.search(/^_design\//) < 0){
              docs.push({id: doc._id, key: doc._id, value: doc});
            }
            continues();
          });
        }else{
          self.index(docs);
        }
      })();
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
  howmm.util.order_by_updated_at = function(a, b){
    var da = new Date(a.info.updated_at);
    var db = new Date(b.info.updated_at);
    return (da > db) ? 1 : -1;
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
