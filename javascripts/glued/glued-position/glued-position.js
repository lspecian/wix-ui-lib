(function ($, window, document) {
	'use strict';

	function setPlacement(state) {
		Wix.Settings.setWindowPlacement(
			Wix.Utils.getOrigCompId(),
			state.placement,
			state.verticalMargin,
			state.horizontalMargin);
	}

	function updatePlacement(state, sliderPlugin, placement) {
		sliderPlugin.$el.removeClass('disabled');
		sliderPlugin.$el.removeClass(getPlacementOrientation(state));
		state.placement = placement;
		sliderPlugin.setValue(0, true);
		if (getPlacementOrientation(state) === 'other') {
			sliderPlugin.$el.addClass('disabled');
		} else {
			sliderPlugin.$el.addClass(getPlacementOrientation(state));
		}
		setPlacement(state);
	}

	function getPlacementOrientation(state) {
		if (state.placement === 'TOP_CENTER' || state.placement === 'BOTTOM_CENTER') {
			return 'horizontalMargin';
		} else if (state.placement === 'CENTER_RIGHT' || state.placement === 'CENTER_LEFT') {
			return 'verticalMargin';
		} else {
			return 'other';
		}
	}

	function getPlacement(cb) {
		Wix.Settings.getWindowPlacement(Wix.Utils.getOrigCompId(), cb);
	}

    function _getDefaults() {
        return {
            placements : [],
            slider : {
                minValue : -2,
                maxValue : 2
            },
            dropdown : {
				visibleRows:8,
				on:{}
			}
        };
    }

    function _getDropdownEvents(state, slider) {
        return {
			on:{
				create : function() {
					this.setIndexByValue(state.placement);
				},
				change : function(evt) {
					updatePlacement(state, slider, evt.value);
				}
			}
        };
    }

    function _getSliderEvents(state) {
        return {
            create : function () {
                var elWidth = this.$el.width();

                this.$center = $('<div class="wix-slider-back">');
                this.$leftLine = $('<div class="wix-slider-back">');
                this.$rightLine = $('<div class="wix-slider-back">');

                this.$leftLine.css({
                    left:elWidth/4,
                    background:'rgba(0,0,0,0.13)',
                    width:1
                }).prependTo(this.$el);

                this.$center.css({
                    left:elWidth/2 - 1,
                    background:'rgba(0,0,0,0.2)'
                }).prependTo(this.$el);

                this.$rightLine.css({
                    left:(elWidth/4)*3,
                    background:'rgba(0,0,0,0.13)',
                    width:1
                }).prependTo(this.$el);

                this.$ribbon = $('<div class="wix-slider-back">').prependTo(this.$el);

                if (getPlacementOrientation(state) === 'other') {
                    this.$el.addClass('disabled');
                } else {
                    this.$el.addClass(getPlacementOrientation(state));
                }
            },
            slide : function(val) {
                var pinWidth = this.$pin.width() / 2;
                var elWidth = this.$el.width() / 4;

                if(val > 1){
                    var range = (val - 1);
                    var w = elWidth * range;
                    this.$ribbon.css({
                        width:elWidth - w + range * pinWidth,
                        right:0,
                        left:'auto',
                        borderRadius: '0 8px 8px 0'
                    });
                }

                if(val >= 0 && val <= 1){
                    var w = elWidth * (val);
                    this.$ribbon.css({
                        width:w,
                        right:'auto',
                        left:elWidth * 2,
                        borderRadius:0
                    });
                }

                if(val < -1){
                    var range = ((val * -1) - 1);
                    var w = elWidth * range;
                    this.$ribbon.css({
                        width: (elWidth - w) + range * pinWidth,
                        left:0,
                        right:'auto',
                        borderRadius: '8px 0 0 8px'
                    });
                }


                if(val < 0 && val >= -1){
                    var w = elWidth * ((val * -1));
                    this.$ribbon.css({
                        width: w,
                        right:elWidth * 2,
                        left:'auto',
                        borderRadius:0
                    });
                }

                state[getPlacementOrientation(state)] = val;
                setPlacement(state);
            }
        };
    }

    function _setUserEvents(defaults, options) {
        if (typeof options.sliderCreate === 'function') {
            defaults.slider.create = options.sliderCreate;
        }

        if (typeof options.sliderChange === 'function') {
            defaults.slider.slide = options.sliderChange;
        }

        if (typeof options.dropDownChange === 'function') {
            defaults.dropdown.on.change = options.dropDownChange;
        }
        if (typeof options.dropDownCreate === 'function') {
            defaults.dropdown.on.create = options.dropDownCreate;
        }
    }

	var pluginName = 'GluedPosition';

	function Plugin(element, options) {
		this.state = {
			horizontalMargin : 0,
			verticalMargin : 0,
			placement : 'TOP_LEFT'
		};

		var defaults = _getDefaults();
		this.$el = $(element);
        if (options.initWithBinding) {
            this.initWithBinding(defaults, options);
        } else {
            this.init(defaults, options);
        }
	}

    Plugin.prototype.init = function (defaults, options) {
        var plugin = this;

        _setUserEvents(defaults, options);

		if(options.placements){
			options.dropdown.visibleRows = options.placements.length;
		}
		
        plugin.options = $.extend({}, defaults, options);
	
		plugin.slider = plugin.createSlider(plugin.options.slider);		
		plugin.dropdown = plugin.createDropDown(plugin.options.dropdown);
    }

	Plugin.prototype.initWithBinding = function (defaults, options) {
		var plugin = this;
		getPlacement(function (data) {
			
            $.extend(plugin.state, data);
            $.extend(defaults.slider, _getSliderEvents(plugin.state));
			plugin.options = $.extend({}, defaults, options);			
			plugin.slider = plugin.createSlider(plugin.options.slider);

			
			$.extend(plugin.options.dropdown, _getDropdownEvents(plugin.state, plugin.slider));
			plugin.dropdown = plugin.createDropDown(plugin.options.dropdown);
			
		});
	};


	Plugin.prototype.createSlider = function(options){
		options.value = this.state[getPlacementOrientation(this.state)] || 0;
		this.$slider = this.$el.find('.glued-slider');
		return this.$slider.AdvancedSlider(options).data('AdvancedSlider');
	};
	
	Plugin.prototype.createDropDown = function(options){
		options.visibleRows = this.options.placements.length;

		this.$dropdown = this.$el.find(".glued-dropdown")
			.html(this.dropdownHTML())
			.find('select')
			.msDropDown(options);

		return this.$dropdown.data('dd');
	};
	

	Plugin.prototype.dropdownHTML = function () {

		var placements = this.options.placements;
		if (placements.length === 0) {
			placements = ['TOP_LEFT', 'TOP_CENTER', 'TOP_RIGHT', 'CENTER_LEFT', 'CENTER_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_CENTER', 'BOTTOM_RIGHT'];
		}

		function getOption(value, imageSpriteData, title) {
			return '<option value="' + value + '" data-image="#" data-imagecss="positionIcons ' + imageSpriteData + '" selected="selected">' + title + '</option>';
		}

		var options = placements.map(function (value) {
				var imageSpriteData,
				text;

				switch (value) {
				case 'TOP_LEFT':
					imageSpriteData = 'topLeft';
					text = 'Top Left';
					break;
				case 'TOP_RIGHT':
					imageSpriteData = 'topRight';
					text = 'Top Right';
					break;
				case 'BOTTOM_RIGHT':
					imageSpriteData = 'bottomRight';
					text = 'Bottom Right';
					break;
				case 'BOTTOM_LEFT':
					imageSpriteData = 'bottomLeft';
					text = 'Bottom Left';
					break;
				case 'TOP_CENTER':
					imageSpriteData = 'top';
					text = 'Top';
					break;
				case 'CENTER_RIGHT':
					imageSpriteData = 'right';
					text = 'Right';
					break;
				case 'BOTTOM_CENTER':
					imageSpriteData = 'bottom';
					text = 'Bottom';
					break;
				case 'CENTER_LEFT':
					imageSpriteData = 'left';
					text = 'Left';
					break;
				}

				return getOption(value, imageSpriteData, text);
			}).join('\n');

		return '<p>Select the position for your widget</p><select name="positionSelection" class="positionSelection">' + options + '</select>';
	}

	$.fn[pluginName] = function (options) {
		return this.each(function () {
			if (!$.data(this, pluginName)) {
				$.data(this, pluginName,
					new Plugin(this, options));
			}
		});
	};

	$.fn[pluginName].Constructor = Plugin;

})(jQuery, window, document);
