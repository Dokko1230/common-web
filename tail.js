(function (undefined) {
  var tail,
      hasModule = (typeof module !== 'undefined' && module.exports),

      globals = {
        pageviewsEventName: "pageviews",
        clicksEventName: "clicks",
        formSubmissionsEventName: "form-submissions",
        globalProperties: {
          page_url: window.location.href,
          referrer_url: document.referrer
        }
      };

  // create a common namespace with options
  tail = function(query) {
    return new Tail(query);
  };

  function Tail(query) {
    this._queue = [];
    this._elements = document.querySelectorAll(query);
  };

  /************************************
      Tail Prototype
  ************************************/
  extend(Tail.prototype, {
    on : function (type) {
      this._eventType = type || 'click';
      return this;
    },
    track : function (properties) {
      each(this._elements, function _web_adder (node, i) {
        node.addEventListener(this._eventType, function(event) {
          var obj = {};
          each(properties, function (prop) {
            if(event.hasOwnProperty(prop)) {
              obj[prop] = event[prop];
            }
          });
          // this._queue.push(obj);
          this._addEvent(obj);
        }.bind(this));
      }.bind(this));
      return this;
    },

    limitTo : function (hookConfig) {
      return this;
    },

    groupBy : function (hookConfig) {
      return this;
    },

    data : function (middleware) {
      if(typeof middleware !== 'function') { return this._queue; }
      this._queue = middleware.call(this, this._queue);
      return this;
    },

    hook : function (hooker) { // Teehee
      this._vessel = hooker.initialize.call(this);
      this._methodMap = extend({}, hooker.methodMap);
      return this;
    },

    onPost: function () {
      return this;
    },

    _addEvent : function (obj) {
      //this.addEvent('shit', {});
      //this.set({});
      //this.addEvent('shit', {});
      debugger;
      this._vessel[this._methodMap.add.name](this._eventType, obj);
    }

  });

  /************************************
      Helpers
  ************************************/
  function each(list, fn) {
    if(list == null) return {};
    var length = list.length;
    if(length === +length) {
      for(var i = 0; i < list.length; i++) {
        fn(list[i], i, list);
      }
    } else {
      for(var key in list) {
        fn(list[key], key, list);
      }
    }
  }

  function extend() {
    var args = Array.prototype.slice.call(arguments, 0);
    var main = args[0] || {};
    for(var i = 1; i < args.length; i++) {
      var obj = args[i];
      each(obj, function(value, key, collection) {
        main[key] = value;
      });
    }
    return main;
  }

  this['tail'] = tail;

}).call(this);
