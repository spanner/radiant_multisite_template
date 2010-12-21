/*
  Page interaction for radiant_platform
  by William Ross for spanner
  3 August 2010
  will@spanner.org
  
  The underlying framework here is jQuery, with the addition of the jQueryTools package to provide 
  interface primitives upon which we elaborate.
  
  to minify: java -jar ~/jars/yuicompressor-2.4.2/build/yuicompressor-2.4.2.jar -o tlms.min.js tlms.js

 * Cookie jquery plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */

// general-purpose event blocker
function squash(e) {
 if(e) {
   e.preventDefault();
   e.stopPropagation();
   if (e.target) e.target.blur();
 } 
}

jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};

(function($) { 

  /* 
   * These two easing functions are borrowed from the effects library to save loading the whole lot.
   * Glide is just quartic out. Boing is back out.
   */

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

	// static constructs
	$.tools = $.tools || {version: '1.2.3'};
	
	// detect ektron edit mode
	$.editing = $("#widgetlist").length > 0; 
		
	// slightly less verbose global find
	function find(root, query) { 
		var el = $(query);
		return el.length < 2 ? el : root.parent().find(query);
	}	
	
  /*
   * Looper
   * is a modified version of the jQuery Tools 1.2.3 Scrollable 
   * tweaked and simplified to add an offset, improve its
   * support for circular scrolling and eventually to add ipad support
   * we still use data('scrollable') so that scrollable plugins can be used without modification.
   *
   * Circularity is achieved by cloning the first few blocks at the end of the row, and the last few at the start.
   * We never actually scroll more than one block into the cloned set: because they look exactly the same as the 
   * other end of the row, when we reach the clones we can jump imperceptibly back to the beginning and seem to keep
   * on scrolling in that direction.
   */
	
  $.tools.looper = {
		conf: {	
			activeClass: 'active',
			circular: false,
			clonedClass: 'cloned',
			disabledClass: 'disabled',
			easing: 'glide',
			initialIndex: 1,
			item: null,
			items: '.items',
			next: '.next',   
			prev: '.prev', 
			speed: 1000,
			vertical: false,
			wheelSpeed: 0,
			detent: 0,
			clonedItems: 1
		}
	};

	var current;		
	
	// constructor
	function LoopControl(root, conf) {   
		
		// current instance
		var self = this, 
			 fire = root.add(self),
			 itemWrap = root.children(),
			 index = 0,
			 vertical = conf.vertical;
				
		if (!current) { current = self; } 
		if (itemWrap.length > 1) { itemWrap = $(conf.items, root); }

		// in this version the items are not exstensible
		items = itemWrap.children(conf.item).not("." + conf.clonedClass);
		
		// create a buffer of three cloned items at each end to mask the loop reset
		items.slice(-3).clone().prependTo(itemWrap);
	  items.slice(0, 3).clone().appendTo(itemWrap);
	  
		// methods
		$.extend(self, {
				
			getConf: function() {
				return conf;	
			},			
			
			getIndex: function() {
				return index;	
			}, 

			getSize: function() {
				return self.getItems().size();	
			},

			getNaviButtons: function() {
				return prev.add(next);	
			},
			
			getRoot: function() {
				return root;	
			},
			
			getItemWrap: function() {
				return itemWrap;	
			},

			getItems: function() {
				return items;
			},
			firstItem: function () {
        return items.slice(0,1);
			},
			lastItem: function () {
        return items.slice(-1);
			},
			
			move: function(offset, time) {
				return self.seekTo(index + offset, time);
			},
			
			next: function(time) {
				return self.move(1, time);	
			},
			
			prev: function(time) {
				return self.move(-1, time);	
			},
			
			begin: function(time) {
				return self.seekTo(0, time);	
			},
			
			end: function(time) {
				return self.seekTo(self.getSize()-1, time);	
			},
			
			focus: function() {
				current = self;
				return self;
			},			
			
			seekTo: function(i, time, fn) {	
        /*
				* 'items' are the original set. 
				* we only ever go one step into the marginal buffers
				* (the others are there to prevent visible gaps)
				* so we don't really care about numbers: just scroll 
				* to the next sibling and then shuffle to the uncloned end
				*/
				var item, shuffle;
				if (i < 0) {
					item = self.firstItem().prev();
					fn = function () { self.end(0); };
				} else if (i >= self.getSize()) {
					item = self.lastItem().next();
					fn = function () { self.begin(0); };
				} else {
					item = self.getItems().eq(i);
				}
				
				// callbacks are preserved because the plugins use them
				var e = $.Event("onBeforeSeek"); 
				if (!fn) {
					fire.trigger(e, [i, time]);				
					if (e.isDefaultPrevented() || !item.length) { return self; }			
				}  

        // conf.detent is a consistent offset that allows the previous block to appear as a link
				var props = vertical ? {top: -(item.position().top + conf.detent)} : {left: -(item.position().left + conf.detent)};
				
				index = i;
				current = self;  
				if (time === undefined) { time = conf.speed; }
				itemWrap.animate(props, time, conf.easing, fn || function() { fire.trigger("onSeek", [i]); });
				return self; 
			}
		});
				
		// callbacks	
		$.each(['onBeforeSeek', 'onSeek'], function(i, name) {
				
			// configuration
			if ($.isFunction(conf[name])) { 
				$(self).bind(name, conf[name]); 
			}
			
			self[name] = function(fn) {
				$(self).bind(name, fn);
				return self;
			};
		});  
				
		// next/prev buttons
		var prev = find(root, conf.prev).click(function(e) { squash(e); self.prev(); }),
			 next = find(root, conf.next).click(function(e) { squash(e); self.next(); });	

		// initial index
		self.seekTo(0);
	} 

	$.fn.looper = function(conf) { 

		var el = this.data("scrollable");
		if (el) { return el; }		 

		conf = $.extend({}, $.tools.looper.conf, conf); 
		
		this.each(function() {			
			el = new LoopControl($(this), conf);
			$(this).data("scrollable", el);	
		});
		
		return conf.api ? el: this; 
	};
	
	$.tools.looper.autoscroll = {
		conf: {
			autoplay: true,
			interval: 3000,
			autopause: true
		}
	};	
	
  /*
   * autoscroll 
   * is a scrollable plugin
   * here slightly simplified to remove
   * unneeded configurability.
   * Note not currently in use.
   */

	$.fn.autoscroll = function(conf) { 
		if (typeof conf == 'number') {
			conf = {interval: conf};	
		}
		
		var opts = $.extend({}, $.tools.looper.autoscroll.conf, conf), ret;
		this.each(function() {		
			var api = $(this).data("scrollable");			
			if (api) { ret = api; }
			
			var timer, hoverTimer, stopped = true;
	
			api.play = function() {
	
				if (timer) { return; }
				stopped = false;
				timer = setInterval(function() { 
					api.next();				
				}, opts.interval);
				
				api.next();
			};	

			api.pause = function() {
				timer = clearInterval(timer);	
			};
			
			api.stop = function() {
				api.pause();
				stopped = true;	
			};
		
			/* when mouse enters, autoscroll stops */
			if (opts.autopause) {
				api.getRoot().add(api.getNaviButtons()).hover(function() {			
					api.pause();
					clearInterval(hoverTimer);
					
				}, function() {
					if (!stopped) {						
						hoverTimer = setTimeout(api.play, opts.interval);						
					}
				});
			}			
			
			if (opts.autoplay) {
				setTimeout(api.play, opts.interval);				
			}

		});
		
		return opts.api ? ret : this;
	}; 
	
  /*
   * navigator
   * is a scrollable plugin that adds a blob-control panel.
   * slightly hacked here to deal with the more than one visible block.
  */

	$.tools.looper.navigator = {
		conf: {
			navi: '.navi',
			naviItem: null,		
			activeClass: 'active',
			indexed: false,
			idPrefix: null
		}
	};		
		
	$.fn.navigator = function(conf) {

		if (typeof conf == 'string') { conf = {navi: conf}; } 
		conf = $.extend({}, $.tools.looper.navigator.conf, conf);
		
		var ret;
		
		this.each(function() {
				
			var api = $(this).data("scrollable"),
				 navi = find(api.getRoot(), conf.navi), 
				 buttons = api.getNaviButtons(),
				 cls = conf.activeClass;
			
			api.getNaviButtons = function() {
				return buttons.add(navi);	
			}; 
			
			function doClick(el, i, e) {
				api.seekTo(i);				
				return e.preventDefault();			
			}
			
			function els() {
				return navi.find(conf.naviItem || '> *');	
			}
			
			function addItem(i) {  
				
				var item = $("<" + (conf.naviItem || 'a') + "/>").click(function(e)  {
					doClick($(this), i, e);
					
				}).attr("href", "#" + i);
				
				// index number / id attribute
				if (i <= 1) {  item.addClass(cls); }
				if (conf.indexed)  { item.text(i + 1); }
				if (conf.idPrefix) { item.attr("id", conf.idPrefix + i); } 
				
				return item.appendTo(navi);
			}
			
			// generate navigator
			if (els().length) {
				els().each(function(i) { 
					$(this).click(function(e)  {
						doClick($(this), i, e);		
					});
				});
				
			} else {
				$.each(api.getItems(), function(i) {
					addItem(i); 
				});
			}   
			
			// activate correct entry
			api.onBeforeSeek(function(e, index) {
				setTimeout(function() {
					if (!e.isDefaultPrevented()) {	
						var foreground = els().eq(index);
						var nextItem = (index == els().length-1) ? els().eq(0) : els().eq(index+1);
						if (!e.isDefaultPrevented() && foreground.length) {			
							els().removeClass(cls);
							foreground.addClass(cls);
							nextItem.addClass(cls);
						}
					}
				}, 1);
			}); 
		});		
		
		return conf.api ? ret : this;
	};

  /*
   * Reveal 
   * is a general-purpose handler of page elements that transition in and out of view.
   * it handles transitions and mouse events with all the right 
   * delays and cancellations including a delayed-disappearance mechanism to allow for mousing about.
  */

	$.tools.reveal = {
		conf: {	
			activeClass: 'active',
			upSwing: 'boing',
			downSwing: 'swing',
			upSpeed: 500,
			downSpeed: 1000,
			upState: {opacity: 1},
			downState: {opacity: 0},
			downDelay: 1000,
			revealedClass: 'revealed',
			alsoReveal: null
		}
	};
	
	function RevealControl(root, revealed, conf) {   
		var self = this;
	  
		$.extend(self, {
			timer: null,
			activity: null,
			state: 'hidden',
			container: $(revealed),
			containers: $(revealed).add(root).add($(conf.alsoReveal)),
			
			show: function(event) {
			  squash(event);
        self.interrupt();
        self.state = "visible";
        self.containers.addClass(conf.revealedClass);
        $(document).bind('click', function (e) { self.hideFast(e); });
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
	
    // root.click(function(e) { self.toggle(e); });
    self.containers.mouseenter(function(e) { self.show(e); });
    self.containers.mouseleave(function(e) { self.hideSoon(e); });
	  self.hide();
	}
	
	$.fn.reveal = function(revealed, conf) { 
		var el = this.data("reveal");
		if (el) { return el; }		 
		conf = $.extend({}, $.tools.reveal.conf, conf); 
		this.each(function() {			
			el = new RevealControl($(this), revealed, conf);
			self.data("reveal", el);	
		});
		return conf.api ? el: this;
	};
	
	$.fn.banner = function(conf) { 
		var el = this.data("reveal");
		if (el) { return el; }
		conf = $.extend({}, $.tools.reveal.conf, {
		  upSpeed: 100,
		  downSpeed: 500,
		  downState: {opacity: 0.2},
		  downDelay: 0
		}, conf); 
		this.each(function() {
		  var self = $(this);
		  var revealed = self.find('.overlay');
			el = new RevealControl($(this), revealed, conf);
			self.data("reveal", el);
		});
	};

	$.fn.navbar = function(conf) { 
		var el = this.data("reveal");
		if (el) { return el; }		 
		conf = $.extend({}, $.tools.reveal.conf, conf); 
		this.each(function() {
		  var self = $(this);
			el = new RevealControl(self, self, conf);
			self.data("reveal", el);
		});
	};
	
	$.tools.tabs.cookied = {
		conf: {
			name: '_tab'
		}
	};		
		
  /*
   * cookied
   * is an extension to the jQueryTools tab mechanism 
   * to store in a cookie the tab last chosen so that on returning to the page it is still displayed.
  */

	$.fn.cookied = function(conf) {
		if (typeof conf == 'string') { conf = {name: conf}; } 
		conf = $.extend({}, $.tools.tabs.cookied.conf, conf);
		this.each(function() {
			var api = $(this).data("tabs");
			api.onClick(function(e, index) { $.cookie(cookie_name, index); }); 
		  if (!location.hash) {
  		  var cookie_name = this.id + '_' + conf.name;
        initialIndex = ($.cookie(cookie_name)) ? parseInt($.cookie(cookie_name), 10) : 0;
  		  api.click(initialIndex);
  		}
		});		
		
		return this;
	};

  /*
   * shrink_if_longer_than
   * 
   * Headlines (or anything else) longer than [limit] characters are given 
   * the 'smaller' css class, which does make them smaller, yes.
  */
	
	$.fn.shrink_if_longer_than = function(limit) { 
		this.each(function() {
		  if (!limit) limit = 64;
      var self = $(this);
      if (self.text().length > limit) self.addClass('smaller');
		});
  	return this; 
	};

  /*
   * show_on_big_screen
   * 
   * uses Thumb objects to create a simple but effective photo gallery that throws pictures
   * into another page element (identified by .screen) as backgrounds.
   *
   * * previewed image comes from link href
   * * title comes from link title
   * * caption comes from the innerHTML of any contained span
   *   (so it can contain links and other html elements)
  */

	function Thumb(container, s, c) {   
		var self = $(container);
    var a = self.find('a');
    var src = a.attr('href');
    var title = a.attr('title');
    var caption = self.find('span').html();
    self.find('span').remove();

    $.extend(self, {
		  deactivate: function (event) {
        self.fadeTo('slow', 0.3);
        a.css('cursor', 'text');
        a.click(function (e) { squash(e); });
		  },
		  activate: function (event) {
        self.fadeTo('slow', 1);
        a.css('cursor', 'pointer');
        a.click(function (e) {
          squash(e);
          s.css({backgroundImage: 'url("' + src + '")'});
          s.hide().fadeIn();
          c.find('h2').text(title);
          c.find('p').text(caption);
        });
		  }
		});
		
		self.deactivate();
    var preload = $(new Image());
    preload.bind("load", function () { self.activate(); });
		preload.attr('src', src);
	};
	
	$.fn.show_on_big_screen = function() {
    var screener = $('.screen');
    var captioner = $('.subtitle');
		this.each(function() {
      new Thumb(this, screener, captioner);
		});
  	return this; 
	};

  /*
   * frame
   * 
   * turns an img tag into a div.framed with that image in the background and a span.frame in the foreground.
  */
	
	$.fn.frame = function(limit) { 
		this.each(function() {
		  if (!limit) limit = 64;
      var self = $(this);
      var span = $('<span class="frame" />');
      var framed = $('<div class="framed" />');
      if (self.hasClass('big')) framed.addClass('big');
      framed.css({backgroundImage: 'url("' + self.attr('src') + '")'}).append(span).insertAfter(self);
      self.hide();
		});
  	return this; 
	};

})(jQuery);

