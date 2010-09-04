var zaisu = zaisu || {};
(function(za){
  var util = za.util;
  var KEYS = za.Keys;

  //Zaisu Doc----------------------------------------
  za.DocBase = function(type_name){
    var klass = za.newclass({
      initialize: function(doc, options){
        doc = doc || {};
        options = options || {};
        this._value = {doc: doc, type: type_name};
        this.type   = type_name;
      },
      id: function(){
        return this._value.doc._id;
      },
      key: function(){
        return (type_name + '::' + this.id());
      },
      rev: function(){
        return this._value.doc._rev;
      },
      value: function(){
        return this._value;
      },
      doc: function(){
        return this.value().doc;
      }
    });

    klass.type_name = type_name;
    klass.key = function(id){
      return (type_name + '::' + id);
    }
    klass.init = function(obj){
      var doc = new klass();
      doc._value = obj;
      return doc;
    }
    klass.new_doc_id = function(){
      return hex_sha1((new Date()).toString() + Math.random() + type_name);
    }
    return klass;
  }
  za.DocEntries = za.DocBase(KEYS.DOC_ENTRIES_CLASS);
  za.Doc        = za.DocBase(KEYS.DOC_CLASS);

  za.DocTypeMap = {};
  za.DocTypeMap[KEYS.DOC_ENTRIES_CLASS] = za.DocEntries;
  za.DocTypeMap[KEYS.DOC_CLASS] = za.Doc;


  //Zaisu LDS----------------------------------------
  za.LocalDocStore = za.newclass({
    initialize: function(doc_class){
      this.local      = new za.LocalStorage("lds::"+ doc_class.type_name);
      this.doc_class  = doc_class;
    },
    get: function(doc_id, callback){
      callback = callback || (function(){});
      this.local.get(doc_id, function(val){
        (val == null) ? callback(val) : callback(val.doc());
      });
    },
    put: function(obj, options, org_callback){
      options = options || {};
      org_callback = org_callback || (function(){});
      var self = this;

      obj._id  = obj._id || self.doc_class.new_doc_id();
      var doc  = new self.doc_class(obj);
      var callback = function(){ org_callback(doc.doc()) };

      self.local.put(doc.id(), doc, function(){
        self.local.update(KEYS.DOC_ENTRIES, function(docs){
          docs = docs || {};
          docs[doc.id()] = {
            cached_at: (new Date()),
            updated_at: doc.doc().updated_at,
            synced: (options.synced || false),
            rev: doc.rev()
          };
          return docs;
        }, callback);
      });
    },
    remove: function(doc_id, callback){
      callback = callback || (function(){});
      var self = this;

      self.local.remove(doc_id, function(){
        self.local.update(KEYS.DOC_ENTRIES, function(docs){
          docs = docs || {};
          delete(docs[doc_id]);
          return docs;
        }, callback);
      });
    }
  });

})(zaisu);