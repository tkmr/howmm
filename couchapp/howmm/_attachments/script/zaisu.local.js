var zaisu = zaisu || {};
(function(za){

  //Zaisu LocalStorage-------------------------------
  za.LocalStorage = za.newclass({
    initialize: function(name, options){
      options = options || {};
      this.name = name;
      this.init(options.after_init);
      this.uniqkey = function(key){
        return name+"::"+key;
      }
      this.type_map = {
        'zaisu.doc': za.Doc
      }
    },

    //methods
    init: function(callback){
      callback = (callback || function(){});
      setTimeout(callback, 1);
    },
    serialize: function(obj){
      var val = this.type_map[obj.type] ? obj.value() : obj;
      return JSON.stringify(val);
    },
    deserialize: function(str){
      var obj = JSON.parse(str);
      var base = this.type_map[obj.type];
      return (base ? base.init(obj) : obj);
    },

    //get / put / remove to the storage
    get: function(key, callback){
      key = this.uniqkey(key);
      var val = localStorage.getItem(key);

      if(val && val.match(/^\{/) !== null){
        val = this.deserialize(val);
      }
      callback(val);
    },
    put: function(key, value, callback){
      key = this.uniqkey(key);

      if(typeof(value) === 'object'){
        value = this.serialize(value);
      }
      localStorage.setItem(key, value);
      callback(true);
    },
    remove: function(key, callback){
      key = this.uniqkey(key);
      localStorage.removeItem(key);
      callback(true);
    },

    //arrow methods
    initA: function(){
      var self = this;
      return Arrow.fromCPS(function(x, k){
        self.init(k);
      });
    },
    getA: function(key){
      var self = this;
      return Arrow.fromCPS(function(x, k){
        self.get(key, k);
      });
    },
    putA: function(key, value){
      var self = this;
      return Arrow.fromCPS(function(x, k){
        self.put(key, (value || x), k);
      });
    }
  });

})(zaisu);