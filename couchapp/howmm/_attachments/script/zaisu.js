var zaisu = {};
(function(za){

  //instance
  var Base = function(){};
  Base.prototype.initialize = function(){};
  Base.prototype.log = console.log;

  var util = {
    to_callback: function(func){
      return {
        success: func
      };
    }
  };

  //klass
  var newclass = function(methods, superclass){
    var klass = function(){
      this.initialize.apply(this, arguments);
    }
    superclass = superclass || Base;
    jQuery.extend(klass.prototype, superclass.prototype, methods);
    return klass;
  }

  za.DB = newclass({
    initialize: function(name, options){
      options = options || {};
      this.db = jQuery.couch.db(name, options);
      this.design_name = options.design;
    },
    view: function(name, func){
      this.db.view(this.design_name+'/'+name, util.to_callback(func));
    }
  });

})(zaisu);