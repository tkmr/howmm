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

  //Zaisu SyncService------------------------------------
  za.Sync = za.newclass({
    initialize: function(db){
      this.db = db;
    },
    sync_run: function(options){
      options = options || {};
      options.success = options.success || (function(){});
      options.error   = options.error   || (function(){});
      var db = this.db;
      var self = this;

      this.push_changes(options, function(){
        self.check_changes(options);
        options.success();
      });
    },
    push_changes: function(options, callback){
      callback = (callback || function(){});
      var db   = this.db;

      db.cache.local.get(KEYS.DOC_ENTRIES, function(docs){
        docs = docs || {};

        $.each(docs, function(key, meta){
          if(!meta.synced){
            db.cache.get(key, function(obj){
              db.saveDoc(obj, {cache_only: false});
            });
          }
        });

        setTimeout(callback, 900);
      });
    },
    check_changes: function(options){
      couch_options      = options.couch_options || {};
      couch_options.feed = couch_options.feed || "normal";
      options  = options || {};
      var mode = options.check_mode || "once";
      var db   = this.db;

      db.local_db.get(KEYS.CHANGE_LAST_SEQ , function(last_seq){
        var promise  = db.db.changes(last_seq, couch_options);
        promise.onChange(function(resp){
          if(mode==="once") promise.stop();
          var changes = compact_changes(resp.results);

          $.each(changes, function(index, info){
            db.cache.get(info.id, function(obj){
              var c = info.changes[0];

              //If cached old version or not cached.
              if(obj == null || obj._rev !== c.rev){
                db.cache.remove(info.id, function(){
                  db.openDoc(info.id);
                });
              }
            });
          });

          db.local_db.put(KEYS.CHANGE_LAST_SEQ, resp.last_seq);
        });
      });
    }
  });

})(zaisu);