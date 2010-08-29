var zaisu = zaisu || {};
(function(za){

  //Zaisu Doc----------------------------------------
  za.Doc = newclass({
    initialize: function(doc, options){
      this.doc = doc;
      this.id  = options.id || doc._id;
    }
  });

  //Zaisu DB-----------------------------------------
  za.DB = newclass({
    initialize: function(name, options){
      options    = options || {};
      this.db    = options.couch  || jQuery.couch.db(name, options);
      this.local = options.local  || new za.LocalStorage("zaisu::db");
      this.dname = options.design || za.util.design_name(options);
      this.offline = false;
    },
    check_change: function(options, couch_options){
      options   = options || {};
      var after = options.after || (function(){});
      var mode  = options.check_mode || "once";
      var self  = this;

      var change_action = function(info){
        //info.changes;
        self.local.remove(info.id);
        //Doc use//?
      }

      this.local
      .getA("change::last_seq")
      .next(function(last_seq){
        var promise  = this.db.change(last_seq, couch_options);
        promise.onChange(function(resp){
          $.each(resp.results, function(){
            if(last_seq < this.seq) last_seq = this.seq;
          });
          if(mode==="once") promise.stop();
        });
      });
    }

    //couch API
    view: function(name, options){
      console.log("now view..." + name);
      options = util.options_or_callback(options);

      if(name.search("/") < 1) name = this.dname+'/'+name;
      this.db.view(name, options);
    },
    openDoc: function(id, options, ajaxOptions){
      console.log("now openDoc..." + id);
      options = util.options_or_callback(options);

      this.db.openDoc(id, options, ajaxOptions);
    },
    saveDoc: function(obj, options){
      console.log("now saveDoc..." + obj._id);
      options = util.options_or_callback(options);

      this.db.saveDoc(obj, options);
    }
  });

  za.DB.init = function(name, options){
    var cdb = $.couch.db(name, options);
    options = $.extend(options, {couch: cdb});
    var zdb = new za.DB(name, options);
    return $.extend(cdb, zdb);
  };

})(zaisu);