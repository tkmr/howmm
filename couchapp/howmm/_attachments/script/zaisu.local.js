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
    },

    //methods
    init: function(callback){
      callback = (callback || function(){});
      setTimeout(callback, 1);
    },
    get: function(key, callback){
      key = this.uniqkey(key);
      var val = localStorage.getItem(key);
      callback(val);
    },
    put: function(key, value, callback){
      key = this.uniqkey(key);
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