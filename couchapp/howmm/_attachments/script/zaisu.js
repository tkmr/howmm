var zaisu = zaisu || {};
(function(za){
  var util = za.util;
  var KEYS = za.Keys;

  //Zaisu DB--------------------------------------------
  za.DB = za.newclass({
    initialize: function(name, options){
      options       = options || {};
      this.db       = options.couch  || jQuery.couch.db(name, options);
      this.cache    = new za.LocalDocStore(za.Doc);
      this.local_db = new za.LocalStorage("zaisu::db");
      this.sync     = new za.Sync(this);
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

    //Open ----------------------------------------
    openDoc: function(id, options, ajaxOptions){
      console.log("now openDoc..." + id);
      options  = util.options_or_callback(options);

      if(typeof(id) == 'undefined' || id == 'undefined'){
        options.success(null);
        return null;
      }

      var self = this;
      var cache_got_doc = function(obj){
        self.cache.put(obj, {synced: true}, options.success);
      }

      this.cache.get(id, function(obj){
        if(obj != null){
          //Get from cache-----------------------
          options.success(obj);

        }else{
          //Get from CouchDB---------------------
          var opts = $.extend({}, options, { success: cache_got_doc });
          self.couch_call('openDoc', [id, opts, ajaxOptions]);

        }
      });
    },

    couch_call: function(method, params, options_num){
      options_num   = options_num || 2;
      var org_error = params[options_num - 1].error;
      var self      = this;
      var error_num = 0;

      (function(){
        var more = arguments.callee;
        params[options_num - 1].error = function(status, error, reason){
          error_num++;
          if(error_num < 4){
            self.couch_error(more, org_error, status, error, reason);
          }else{
            org_error.apply(self, arguments);
          }
        }
        self.db[method].apply(self.db, params);
      })();
    },
    couch_error: function(fix_success, fix_error, status, error, reason){
      var self = this;
      var session = za.Session.current;
      var call_fix_error = function(x, callback){
        fix_error(status, error, reason);
        ( callback || (function(){}) )();
      }

      var error_map = {
        '0': function(){
          //The document could not be retrieved
          throw 'This connection is Offline';

        },
        '401': function(){
          //Unauthorized
          session
            .aLogin
            .wait(600)
            .next(fix_success)
            .errors(call_fix_error)
            .run();
        }
      }
      return (error_map[status.toString()]
              ? error_map[status.toString()]()
              : call_fix_error());
    },

    //Save ----------------------------------------
    saveDoc: function(obj, options){
      console.log("now saveDoc..." + obj._id);
      options = util.options_or_callback(options);
      options.cache_only = (options.cache_only != null) ? options.cache_only : true;
      var self = this;

      if(options.cache_only){
        //Put to cache only-------------------------------------
        this.cache.put(obj, {synced:false}, function(obj){
          options.success({ok: true, id: obj._id, rev: obj._rev});
        });

      }else{
        //Put to CouchDB-----------------------------------------
        var ext_options = $.extend({}, options, {
          success: self.saveDoc_success(obj, options),
          error:   self.saveDoc_error(obj, options)
        });
        this.couch_call('saveDoc', [obj, ext_options]);

      }
    },
    saveDoc_success: function(obj, options){
      var self = this;
      return function(resp){
        obj._rev = resp.rev;
        obj._id  = resp.id;
        self.cache.put(obj, {synced: true}, function(){
          options.success(resp);
        });
      }
    },
    saveDoc_error: function(obj, options){
      var self = this;
      return function(status_code, error, reason){
        debugger;
        var func_name = 'saveDoc_error_' + status_code;
        if(self[func_name]){
          self[func_name](obj, options);
        }else{
          options.error(status_code);
        }
      }
    },
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

    //View-----------------------------------
    view: function(name, options){
      console.log("now view..." + name);
      options = util.options_or_callback(options);
      if(name.search("/") < 1) name = this.dname+'/'+name;
      var self = this;

      var ext_options = $.extend({}, options, {
        success: this.view_success(options)
      });
      this.couch_call('view', [name, ext_options]);
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
    }
  });

  var couch_db = $.couch.db;
  za.DB.init = function(name, options){
    var cdb = couch_db(name, options);
    options = $.extend(options, {couch: cdb});
    return (new za.DB(name, options));
  };

})(zaisu);