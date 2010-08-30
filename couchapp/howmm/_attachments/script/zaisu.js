var zaisu = zaisu || {};
(function(za){
  var util = za.util;

  //Zaisu Doc----------------------------------------
  za.Doc = za.newclass({
    initialize: function(doc, options){
      options = options || {};
      var type = 'zaisu.doc';
      this._value = {doc: doc, type: type};
      this.type   = type;
    },
    id: function(){
      return this._value.doc._id;
    },
    key: function(){
      return za.Doc.key(this.id());
    },
    value: function(){
      return this._value;
    },
    doc: function(){
      return this.value().doc;
    }
  });
  za.Doc.key = function(id){
    return ('doc::' + id);
  }
  za.Doc.init = function(obj){
    var doc = new za.Doc({});
    doc._value = obj;
    return doc;
  }

  //Zaisu DB-----------------------------------------
  za.DB = za.newclass({
    initialize: function(name, options){
      options    = options || {};
      this.db    = options.couch  || jQuery.couch.db(name, options);
      this.local = options.local  || new za.LocalStorage("zaisu::db");
      this.dname = options.design || za.util.design_name(options);
      this.offline = false;

      //Delegate to Couch API;
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
        self.set_cache_doc(obj, function(){ options.success(obj) });
      }});

      this.get_cache_doc(id, function(obj){
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
        self.set_cache_doc(obj, function(){ options.success(resp) });
      }
    },
    saveDoc_error: function(obj, options){
      var self = this;
      return function(status_code){
        if(options.error_count == null){
          options.error_count = (options.error_count || 0) + 1;
          if(status_code === 409){
            self.conflict_result(obj, options);
          }
        }
        options.error(status_code);
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
        success: function(res){
          var view_cache = {
            offset: res.offset,
            total_rows: res.total_rows,
            rows: []
          };

          $.each(res.rows, function(index, row){
            self.set_cache_doc(row.value);
            view_cache.rows.push({id: row.id, key: row.key});
          });

          self.local.put(("view::"+name), view_cache, function(){
            options.success(res);
          });
        }
      });
      this.db.view(name, ext_options);
    },

    //Cache---------------------------------------------
    get_cache_doc: function(doc_id, callback){
      callback = callback || (function(){});
      this.local.get(za.Doc.key(doc_id), function(val){
        callback(val.doc());
      });
    },
    set_cache_doc: function(obj, callback){
      callback = callback || (function(){});
      var doc  = new za.Doc(obj);
      this.local.put(doc.key(), doc, callback);
    },
    clear_cache_doc: function(doc_id, callback){
      callback = callback || (function(){});
      this.local.remove(za.Doc.key(doc_id), callback);
    },

    //original API--------------------------------------
    conflict_result: function(obj, options){
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
      options   = options || {};
      var after = options.after || (function(){});
      var mode  = options.check_mode || "once";
      var self  = this;

      var change_action = function(index, info){
        console.log(info);
        debugger;
        self.local.get(za.Doc.key(info.id), function(obj){
          var c = info.changes[0];
          if(obj._rev !== c.rev){
            self.clear_cache_doc(info.id);
          }
        });
      }

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

      this.local.get("change::last_seq", function(last_seq){
        var promise  = this.db.change(last_seq, couch_options);
        promise.onChange(function(resp){
          if(mode==="once") promise.stop();

          var changes = compact_changes(resp.results);
          $.each(changes, change_action);
          self.local.put("change::last_seq", resp.last_seq);
        });
      });
    }
  });

  za.DB.init = function(name, options){
    var cdb = $.couch.db(name, options);
    options = $.extend(options, {couch: cdb});
    return (new za.DB(name, options));
  };

})(zaisu);