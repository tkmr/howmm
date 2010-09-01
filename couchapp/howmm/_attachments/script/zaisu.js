var zaisu = zaisu || {};
(function(za){
  var util = za.util;
  var KEYS = za.Keys;

  var compact_changes = function(resp_results){
    var changes = {};
    $.each(resp_results, function(index, value){
      var id = value.id;
      if(changes[id] == null || (changes[id].seq < value.seq)){
        changes[id] = value;
      }
    });
    return changes;
  }

  //Zaisu DB--------------------------------------------
  za.DB = za.newclass({
    initialize: function(name, options){
      options       = options || {};
      this.db       = options.couch  || jQuery.couch.db(name, options);
      this.cache    = new za.LocalDocStore(za.Doc);
      this.local_db = new za.LocalStorage("zaisu::db");
      this.dname    = options.design || za.util.design_name(options);
      this.offline  = false;

      //Delegate to Couch API
      this.db.urlPrefix = "";
      this.urlPrefix = this.db.urlPrefix;
      this.name      = this.db.name;
      this.db.uri    = this.urlPrefix+"/"+encodeURIComponent(this.name)+"/"
      this.uri       = this.db.uri;
      this.delegate(this.db, [
        'name', 'uri', 'compact', 'viewCleanup', 'compactView',
        'create', 'drop', 'info', 'changes', 'allDocs',
        'allDesignDocs', 'allApps', 'copyDoc', 'query',
        'getDbProperty', 'setDbProperty'
      ]);
    },

    //couch API--------------------------------------
    openDoc: function(id, options, ajaxOptions){
      console.log("now openDoc..." + id);
      options  = util.options_or_callback(options);
      var self = this;
      var ext_options = $.extend({}, options, {success: function(obj){
        self.cache.put(obj, {synced: true}, options.success);
      }});

      this.cache.get(id, function(obj){
        return ((obj != null)
                ? options.success(obj)
                : self.db.openDoc(id, ext_options, ajaxOptions));
      });
    },
    saveDoc: function(obj, options){
      console.log("now saveDoc..." + obj._id);
      options  = util.options_or_callback(options);
      var self = this;

      var ext_options = $.extend({}, options, {
        success: self.saveDoc_success(obj, options),
        error:   self.saveDoc_error(obj, options)
      });
      this.db.saveDoc(obj, ext_options);
    },
    saveDoc_success: function(obj, options){
      var self = this;
      return function(resp){
        obj._rev = resp.rev;
        obj._id  = resp.id;
        self.cache.put(obj, {synced: true}, function(){ options.success(resp) });
      }
    },
    saveDoc_error: function(obj, options){
      var self = this;
      return function(status_code){
        options.error_count = (options.error_count || 0) + 1;
        var func_name = 'saveDoc_error' + status_code;

        if(options.error_count < 3 && self[func_name]){
          self[func_name](obj, options);
        }else{
          options.error(status_code);
        }
      }
    },
    bulkSave: function(docs, options) {
      console.log("now bulkSave...");
      options = util.options_or_callback(options);

      this.db.bulkSave(docs, options);
    },
    removeDoc: function(doc, options) {
      console.log("now removeDoc...");
      options = util.options_or_callback(options);

      this.db.removeDoc(doc, options);
    },
    bulkRemove: function(docs, options) {
      console.log("now bulkRemove...");
      options = util.options_or_callback(options);

      this.db.bulkRemove(docs, options);
    },
    list: function(list, view, options) {
      console.log("now list...");
      options = util.options_or_callback(options);

      this.db.list(list, view, options);
    },
    view: function(name, options){
      console.log("now view..." + name);
      options = util.options_or_callback(options);
      if(name.search("/") < 1) name = this.dname+'/'+name;
      var self = this;

      var ext_options = $.extend({}, options, {
        success: this.view_success(options)
      });
      this.db.view(name, ext_options);
    },
    view_success: function(options){
      var self = this;
      return function(res){
        var view_cache = {
          offset: res.offset, total_rows: res.total_rows, rows: []
        };

        $.each(res.rows, function(index, row){
          self.cache.put(row.value, {synced: true});
          view_cache.rows.push({id: row.id, key: row.key});
        });

        self.local_db.put("view::"+name, view_cache, function(){
          options.success(res)
        });
      }
    },

    //original API--------------------------------------
    saveDoc_error_409: function(obj, options){
      //conflict_result
      console.log("now conflict result...");
      var self = this;
      this.db.openDoc(obj._id, {
        success: function(data){
          data.body       = obj.body;
          data.updated_at = obj.updated_at;
          self.saveDoc(data, options);
        },
        error: options.error
      });
    },
    check_change: function(options, couch_options){
      couch_options = couch_options || {};
      couch_options.feed = couch_options.feed || "normal";

      options   = options || {};
      var after = options.after || (function(){});
      var mode  = options.check_mode || "once";
      var self  = this;

      this.local_db.get(KEYS.CHANGE_LAST_SEQ , function(last_seq){
        var promise  = self.db.changes(last_seq, couch_options);
        promise.onChange(function(resp){
          if(mode==="once") promise.stop();
          var changes = compact_changes(resp.results);

          $.each(changes, function(index, info){
            self.cache.get(info.id, function(obj){
              var c = info.changes[0];

              //If cached old version or not cached.
              if(obj == null || obj._rev !== c.rev){
                self.cache.remove(info.id, function(){
                  self.openDoc(info.id);
                });
              }
            });
          });

          self.local_db.put(KEYS.CHANGE_LAST_SEQ, resp.last_seq);
        });
      });
    }
  });

  var couch_db = $.couch.db;
  za.DB.init = function(name, options){
    var cdb = couch_db(name, options);
    options = $.extend(options, {couch: cdb});
    return (new za.DB(name, options));
  };

})(zaisu);