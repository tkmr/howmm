/*
 * Arrow Core {{{
 */
function Arrow(f) {
    if (f instanceof Arrow)
        return f;
    if (!(this instanceof Arrow))
        return new Arrow(f);

    if (f) {
        this.cpsFunction = function(x, k) { return k(f(x)) };
        this.name = f.name || this.name;
    }
}

Arrow.fromCPS = function(cpsFunction) {
    var arrow = new Arrow;
    arrow.cpsFunction = cpsFunction;
    return arrow;
}

Arrow.prototype.callCPS = function(x, k) {
    if (!('cpsFunction' in this)) {
        // this is a Function
        this.cpsFunction = function(x, k) { return k(f(x)) };
    }
    try {
        if(x === null || typeof(x)!=="object" || !x.is_long_error){
          //default
          this.cpsFunction(x, k);

        }else{
          if(this.is_long_error_catch){
            //Catch a long error.
            this.cpsFunction(x, k);

          }else{
            //Cann't catch a long error.
            k(x);

          }
        }
    } catch (e) {
        console.log("CallCPS error! line:"+e.line+" url:"+e.sourceURL);
        console.log(e);
        k(Arrow.LongError(e));
    }
}

Arrow.prototype.run = function(x) {
    var result;
    this.callCPS(x, function(y) { result = y });
    return result;
}

Arrow.prototype.call = Arrow.prototype.run;

Arrow.prototype.toString = function() {
    if (this.arrows) {
        return '(' + this.arrows.join(') ' + this.type + ' (') + ')';
    } else {
        return '[Arrow' + (this.name ? ' ' + this.name : '') + ']';
    }
}
/*
 * }}}
 */

/*
 * Basic Arrow Operators {{{
 * TODO: Give them proper names
 */
Arrow.defineAssociativeOperator = function(op, cpsFunction) {
    Arrow.prototype[op] = function(g) {
        var f = this, g = Arrow(g);
        var arrow = Arrow.fromCPS(cpsFunction);
        arrow.type = op;

        if(Array.concat){
          var ars = Array.concat(f.type == op ? f.arrows : f, g.type == op ? g.arrows : g);
        }else{
          var tmp_f = f.type == op ? f.arrows : f;
          var tmp_g = g.type == op ? g.arrows : g;
          var is_array = function(x){ return (typeof(x)==="object" && x.length); };
          tmp_f = is_array(tmp_f) ? tmp_f : [tmp_f];
          tmp_g = is_array(tmp_g) ? tmp_g : [tmp_g];
          while(tmp_g.length > 0){
            tmp_f.push(tmp_g.pop());
          }
          var ars = tmp_f;
        }
        arrow.arrows = ars;
        return arrow;
    };
}

// Compose arrows
//
// x -> y -> z
//
//  +---+ +---+
// -| f |-| g |->
//  +---+ +---+
//
Arrow.defineAssociativeOperator('>>>', function(x, k) {
    var arrows = this.arrows.slice();
    (function(x) {
        if (arrows.length) {
            arrows.shift().callCPS(x, arguments.callee);
        } else {
            k(x);
        }
    })(x)
});

Arrow.prototype.next = Arrow.prototype['>>>'];

// Fork arrow
//
// x -> [y1, y2, ..]
//
//    +---+
//  +-| f |->
//  | +---+
// -+
//  | +---+
//  +-| g |->
//    +---+
//
Arrow.defineAssociativeOperator('&&&', function(x, k) {
    var arrows = this.arrows;
    var results = [];
    var count = arrows.length;
    for (var i = 0; i < arrows.length; i++) {
        with ({ i: i }) {
            arrows[i].callCPS(x, function(y) { results[i] = y; if (!--count) k(results) });
        }
    }
});

// Combine arrows
//
// [x1, x2, ..] -> [y1, y2, ..]
//
//  +---+
// -| f |->
//  +---+
//  +---+
// -| g |->
//  +---+
//
Arrow.defineAssociativeOperator('***', function(x, k) {
    var arrows = this.arrows;
    var results = [];
    var count = arrows.length;
    for (var i = 0; i < arrows.length; i++) {
        with ({ i: i }) {
            arrows[i].callCPS(x[i], function(y) { results[i] = y; if (!--count) k(results) });
        }
    }
});

Arrow.prototype.and = Arrow.prototype['***'];

// Choose arrow
//
//      +---+
//     -| f |-.
//      +---+  \
// -+           +-> (choose route by input value, route information remains)
//   \  +---+  /
//    `-| g |-'
//      +---+
Arrow.defineAssociativeOperator('|||', function(x, k) {
    var arrows = this.arrows;
    if (!(x instanceof Arrow.Value.In)) {
        x = Arrow.Value.In(0)(x);
    }
    arrows[x.index].callCPS(x.value, function(y) { k(Arrow.Value.In(x.index)(y)) });
});

//
// Join arrows
//
//      +---+
//     -| f |-.
//      +---+  \
// -+           +-> (choose route by input value, discard route information)
//   \  +---+  /
//    `-| g |-'
//      +---+
Arrow.defineAssociativeOperator('+++', function(x, k) {
    var arrows = this.arrows;
    if (!(x instanceof Arrow.Value.In)) {
        x = Arrow.Value.In(0)(x);
    }
    arrows[x.index].callCPS(x.value, k);
});

Arrow.prototype.error = function(g) {
    return this['>>>']((Arrow.Identity)['+++'](g));
}

// Fork & choose arrow
//
//      +---+
//    .-| f |-
//   /  +---+
// -+           +-> (faster arrow is chosen)
//   \  +---+  /
//    `-| g |-'
//      +---+
Arrow.defineAssociativeOperator('<+>', function(x, k) {
    var called;
    var arrows = this.arrows;
    for (var i = 0; i < arrows.length; i++) {
        with ({ i: i }) {
            arrows[i].callCPS(x, function(y) { cancelBut(i); callCont(y) });
        }
    }
    function callCont(y) {
        if (!called)
            k(y);
        called = true;
    }
    function cancelBut(index) {
        for (var i = 0; i < arrows.length; i++) {
            if (i == index) continue;
            arrows[i].cancel && arrows[i].cancel();
        }
    }
});

Arrow.prototype.or = Arrow.prototype['<+>'];
/*
 * }}}
 */

/*
 * Basic arrow generators {{{
 */
Arrow.Const = function(x) {
    return Arrow(function() { return x });
}

Arrow.Identity = Arrow.NOP = Arrow(function(x) { return x });

Arrow.Stop = Arrow.fromCPS(function(x, k) { });

Arrow.Loop = function(a) {
    return Arrow.fromCPS(function(x) {
        a.callCPS(x, arguments.callee);
    });
}

Arrow.prototype.loop = function() {
    return Arrow.Loop(this);
}
/*
 * }}}
 */

/*
 * Arrow.Value.In {{{
 */
Arrow.Value = function() { };

Arrow.Value.prototype.toString = function() {
    return '[Arrow.Value ' + this.value + ']';
}

Arrow.Value.In = function(index, value) {
    if (!(this instanceof Arrow.Value.In)) {
        var constructor = Arrow.Value.In.constructors[index];
        if (!constructor) {
            constructor = Arrow.Value.In.constructors[index] = function(value) {
                if (!(this instanceof constructor))
                    return new constructor(value);
                this.index = index;
                this.value = value;
            };
            constructor.prototype = new Arrow.Value.In;
        }
        if (arguments.length == 1) {
            return constructor;
        } else {
            return new constructor(value);
        }
    }
    this.index = index;
    this.value = value;
}

Arrow.Value.prototype.toString = function() {
    return '[Arrow.Value.In(' + this.index + ') ' + this.value + ']';
}

Arrow.Value.In.constructors = [];

Arrow.Value.In.prototype = new Arrow.Value;
/*
 * }}}
 */

/*
 * Arrow.Error {{{
 */
Arrow.Error     = Arrow.Value.In(1);
Arrow.LongError = function(e){
  return {
    error: e,
    is_long_error: true
  }
}

Arrow.prototype.errors = function(f){
  var fun = Arrow(f);
  var arr = Arrow.fromCPS(function(x,k){
    if(typeof(x)==="object" && x.is_long_error){
      fun.next(k).run(x.Error);
    }else{
      k(x);
    }
  });

  arr.is_long_error_catch = true;
  return this['>>>'](arr);
}

/*
 * }}}
 */

/*
 * Asynchronous Arrows {{{
 * TODO: Add Arrow.Async class
 */
Arrow.Delay = function(msec) {
    return Arrow.fromCPS(function(x, k) {
        this.setTimeoutID = setTimeout(function() { k(x) }, msec);
        this.cancel = function() { clearTimeout(this.setTimeoutID) };
    });
}

Arrow.prototype.wait = function(msec) {
    return this['>>>'](Arrow.Delay(msec));
}

Arrow.Event = function(object, event) {
    return Arrow.fromCPS(function(x, k) {
        var stop = false;
        var listener = function(e) {
            if (stop) return;
            stop = true;
            k(e);
        };
        Arrow.Compat.addEventListener(object, event, listener, true);
        this.cancel = function() { stop = true };
    });
}

// TODO: Parameters for method, query
Arrow.XHR = function(url) {
    return Arrow.fromCPS(function(x, k) {
        var stop = false;
        try {
            var xhr = Arrow.Compat.newXHR();
            xhr.onreadystatechange = function() {
                if (stop)
                    return;
                if (xhr.readyState == 4) {
                    if (/^2\d\d$/.exec(xhr.status)) {
                        k(xhr);
                    } else {
                        k(Arrow.Error(xhr));
                    }
                }
            };
            xhr.open('GET', url, true);
            xhr.send(null);
        } catch (e) {
            k(Arrow.Error(e));
        }
        this.cancel = function() { stop = true };
    });
}

Arrow.JSONP = function(url) {
    if (!('_count' in Arrow.JSONP))
        Arrow.JSONP._count = 0;

    return Arrow.fromCPS(function(x, k) {
        Arrow.JSONP['callback' + Arrow.JSONP._count] = k;
        var script = document.createElement('script');
        script.src = url + (url.indexOf('?') != -1 ? '&' : '?') + 'callback=Arrow.JSONP.callback' + Arrow.JSONP._count;
        script.type = 'text/javascript';
        document.getElementsByTagName('head')[0].appendChild(script);
        Arrow.JSONP._count++;
    });
}

Arrow.Compat = { };

Arrow.Compat.addEventListener = function(object, event, callback, capture) {
    if (object.addEventListener) {
        return object.addEventListener(event, callback, capture);
    } else {
        return object.attachEvent('on' + event, function() { callback(window.event) });
    }
}

Arrow.Compat.newXHR = function() {
    return new XMLHttpRequest;
}

Arrow._export = function(object) {
    for (var p in Arrow) if (p != 'prototype') {
        object[p] = Arrow[p];
    }
}

Arrow.exportToFunction = function() {
    for (var p in Arrow.prototype) {
        Function.prototype[p] = Arrow.prototype[p];
    }
}

//// extend //////////////////////////////////////////////
jQuery.aAjax = function(options){
  options.before_success = options.before_success || function(x){ return x; }
  return Arrow.fromCPS(function(x, k){
    $.ajax($.extend({
      success: function(resp){
        k(options.before_success(resp));
      },
      error: function(resp){
        k(Arrow.LongError(resp));
      }
    }, options));
  });
}

jQuery.aGetJSON = function(url, data){
  return $.aAjax({
    url: url,
    data: data,
    before_success: function(resp){
      var obj;
      try{
        obj = zaisu.util.parseJSON(resp);
      }catch(e){
        obj = Arrow.LongError(e);
      }
      return obj;
    }
  });
}

Arrow.simpleCPS = function(cps){
  return function(){
    return Arrow.fromCPS(cps)
  };
}

Arrow.Match = function(checker){
  return Arrow.fromCPS(function(x,k){
    console.log("match check....");
    if(checker(x)){
      k(x);
    }else{
      throw "Arrow.aMatch is fail.";
    }
  });
}
Arrow.prototype.match = function(checker){
  return this['>>>'](Arrow.Match(checker));
}

Arrow.prototype.end = function(){
  return this['>>>'](Arrow.Stop);
}

Arrow.prototype.logger = function(message){
  return this['>>>'](Arrow.fromCPS(function(x,k){
    console.log("now logger..." + (message||""));
    console.log(x);
    k(x);
  }));
}

Arrow.prototype.which = function(arrows){
  if(!(arrows.success && arrows.error)){
    throw "Error!! we need success and error"
  }
  return this['>>>'](
    (Arrow(arrows.success))['+++'](Arrow(arrows.error))
  );
}

Arrow.WaitUntil = function(target, event_name){
  return Arrow.simpleCPS(function(x, k){
    $(target).one(event_name, k);
  });
}

Arrow.prototype.wait_until = function(target, event_name){
  return this['>>>'](
    Arrow.WaitUntil(target, event_name)
  );
}
