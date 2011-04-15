(function($) { 
  $.easing.glide = function (x, t, b, c, d) {
    return -c * ((t=t/d-1)*t*t*t - 1) + b;
  }
  
  $.easing.boing = function (x, t, b, c, d, s) {
    if (s == undefined) s = 1.70158;
    return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
  };

  $.easing.bounce = function (x, t, b, c, d) {
    if ((t/=d) < (1/2.75)) {
      return c*(7.5625*t*t) + b;
    } else if (t < (2/2.75)) {
      return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
    } else if (t < (2.5/2.75)) {
      return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
    } else {
      return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
    }
  };

  function squash(e) {
    if(e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.target) e.target.blur();
    } 
  }

  function RevealControl(root, revealed, conf) {   
    var self = this;
    conf = $.extend({
      activeClass: 'active',
      upSwing: 'boing',
      downSwing: 'swing',
      upSpeed: 500,
      downSpeed: 1000,
      upState: {opacity: 1},
      downState: {opacity: 0},
      downDelay: 1000,
      revealedClass: 'revealed'
    }, conf);
    
    $.extend(self, {
      timer: null,
      activity: null,
      state: 'hidden',
      container: $(revealed),
      containers: $(revealed).add(root),
      
      show: function(event) {
        squash(event);
        self.interrupt();
        self.state = "visible";
        self.containers.addClass(conf.revealedClass);
        $(document).bind('click', function (e) { self.hideFast(e); });
        console.log('animating', self.container, 'to', conf.upState,conf.upSpeed, conf.upSwing);
        self.activity = self.container.animate(conf.upState, conf.upSpeed, conf.upSwing);  
      },      
      
      hide: function(time) {
        self.interrupt();
        if (!time) time = conf.downSpeed;
        self.activity = self.container.animate(conf.downState, time, conf.downSwing, function () {
          self.state = "hidden";
          self.containers.removeClass(conf.revealedClass);
          $(document).unbind('click');            // until the menu has completely gone, a click can be used to hurry it up
        });  
      },

      hideSoon: function(event) {
        squash(event);
        self.timer = window.setTimeout(self.hide, conf.downDelay);
      },
      
      // note that hideFast doesn't block the event: 
      // if called directly, it means that something else is happening that should be allowed to continue.
      hideFast: function(event) {
        self.interrupt();
        self.hide(100);
      },
      
      toggle: function (event) {
        squash(event);
        self.state == "visible" ? self.hideFast() : self.show();
      },
      
      interrupt: function () {
        if (self.activity) self.activity.stop(true, false);
        if (self.timer) window.clearTimeout(self.timer);
      }
    });
  
    root.click(function(e) { self.toggle(e); });
    self.containers.mouseenter(function(e) { self.show(e); });
    self.containers.mouseleave(function(e) { self.hideSoon(e); });
    self.hideFast();
  }
  
  $.fn.reveals = function(revealed, conf) { 
    this.each(function() {
      conf = conf || {};
      new RevealControl($(this), revealed, conf);
    });
    return this;
  };
  
  $.fn.banner = function(conf) { 
    var el = this.data("reveal");
    if (el) { return el; }     
    conf = $.extend({}, $.tools.reveal.conf, conf); 
    this.each(function() {
      var self = $(this);
      var revealed = self.find('.overlay');
      el = new RevealControl($(this), revealed, conf);
      $(this).data("reveal", el);
    });
  };
  
  
})(jQuery);

$(function() {
  $('#mask').fadeTo('fast', 0.8);
  $('#header').css("position","fixed").reveals($('#introduction'), {upState: {height: 440}, downState: {height: 0}});
});
