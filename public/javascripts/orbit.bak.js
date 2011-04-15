(function($){
  
  $.easing.glide = function (x, t, b, c, d) {
    return -c * ((t=t/d-1)*t*t*t - 1) + b;
  }
  
  $.easing.boing = function (x, t, b, c, d, s) {
    if (s == undefined) s = 1.70158;
    return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
  };

  // required params: width = integer (px)
  //                  height = integer (px)
  //                  center = [x,y] (px)
  //                  start = offset from north (degrees)
  //                  end = offset from north (degrees)
  // optional params: dir = +/-1
  //                  scaling = factor by which perspective is exaggerated
    
  $.path.scaled_elliptical_arc = function(params) {
    for(var i in params) this[i] = params[i];
    
    this.dir = this.dir || 1;
    this.scaling = this.scaling || 1.4;
    
    while(this.start > this.end && this.dir > 0) this.start -= 360;
    while(this.start < this.end && this.dir < 0) this.start += 360;

    this.css = function(p) {
      var angle = this.start * (p) + this.end * (1-(p));
      var radians = angle * 3.1415927 / 180;
      var sa = Math.sin(radians);
      var ca = Math.cos(radians);
      var scale = (sa + 1)/(2 * this.scaling);
      
      var w = 400 * scale;
      var h = 300 * scale;
      var x = this.center[0] + ((this.width / 2) * ca);
      var y = this.center[1] + ((this.height / 2) * sa);
      var o = scale * scale * 1.5;
      var z = Math.floor(1000 * scale);
      
      return {
        top: y + "px", 
        left: x + "px",
        width: w + "px",
        height: h + "px",
        opacity: o + "",
        zIndex: z + "",
        fontSize: scale + 'em'
      };
    } 
  };

  $.fn.showMe = function() {
    var self = $(this).eq(0);
    // $('#caption').html(self.html()).fadeIn('fast');
    self.find('.case').fadeTo('slow', 1);
  };
  
  $.fn.orbitToFront = function(event) {
    if (event) event.preventDefault();
    var satellite = $(this)[0];
    var self = $(satellite);
    var position = $.data(satellite, 'orbital_position');
    var dir = (position > 90) ? -1 : 1;
    var delta = $.orbit.front - position;
    // $(".case").css({opacity: "0.1"});
    $(".satellite").orbitBy(delta, dir);
    self.showMe();
  };
  
  $.fn.orbitBy = function(delta, dir) {
    this.each(function() {
      var self = $(this);
      var position = $.data(this, 'orbital_position');
      var destination = position + delta;
      self.orbitTo(destination, dir);
    });
  };

  $.fn.orbitTo = function(destination, dir) {
    this.each(function() {
      var self = $(this);
      var position = $.data(this, 'orbital_position');
      dir = dir || 1;
      var arc = $.orbit.segment(position, destination, dir);
      self.set_position(destination);
      self.animate({path: arc}, 1000, 'glide');
    });
  };

  $.fn.set_position = function(destination) {
    $(this).each(function() {
      $.data(this, 'orbital_position', destination % 360);
    });
  };
  
  $.fn.launch = function() {
    var spacing = 360 / this.length;
    this.each(function(i) {
      $(this).orbitTo(spacing * i);
    });
  };
  
  $.fn.place_in_orbit = function() { 
    this.each(function() {
      $.data(this, 'orbital_position', 0);
      $.data(this, 'orbital_destination', 0);
      var self = $(this);
      self.click(self.orbitToFront);
    });
    this.launch();
    return this;
  };
})(jQuery);

function Orbit(center, width, height, front) {
  var self = this;
  $.extend(self, {
    center: center,
    width: width,
    height: height,
    front: front || 90,
    segment: function (angle_from, angle_to, dir) {
      if (!dir) dir = (angle_to > angle_from) ? -1 : 1;
      //console.log('orbit.segment: dir', dir);
      return new $.path.scaled_elliptical_arc({
        center: self.center,
        width: self.width,
        height: self.height,
        start: angle_from,
        end: angle_to,
        dir: dir
      });
    },
    plot: function () {
      var dots = $('<div id="plot" />');
      var path = self.segment(0, 359, 1);
      for(var t=0; t<1;t+= 0.005) {    
        dots.append($('<span class="dot" />').css( path.css(t) ));
      }
      dots.append($('<span class="center" />').css({top: self.center[1], left: self.center[0]}));
      $('#wrapper').append(dots);
    }
  });
}

$(function() {
  $.orbit = new Orbit([180,50], 400, 40, 100);
  // $.orbit.plot();
  $('#mask').fadeTo('fast', 0.7);
  $('#mask, #blurb').css("position","fixed");
  $('#wrapper').find(".satellite").place_in_orbit().eq(0).orbitToFront();
});
