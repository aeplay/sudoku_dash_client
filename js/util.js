var fadeOut = function(el){
	el.css('-webkit-transition', 'opacity 0.5s ease-in');
	el.css('-moz-transition', 'opacity 0.5s ease-in');
	el.css('-o-transition', 'opacity 0.5s ease-in');
	el.css('-ms-transition', 'opacity 0.5s ease-in');
	el.css('transition', 'opacity 0.5s ease-in');
	el.css('opacity', '0');
};

var fadeOutAndRemove = function(el, callback){
	fadeOut(el);
	setTimeout(function(){
		el.remove();
		callback && callback();
	}, 510);
};

var fadeIn = function(el){
	el.hide();
	el.css('opacity', '0');
	el.css('-webkit-transition', 'opacity 0.5s ease-in');
	el.css('-moz-transition', 'opacity 0.5s ease-in');
	el.css('-o-transition', 'opacity 0.5s ease-in');
	el.css('-ms-transition', 'opacity 0.5s ease-in');
	el.css('transition', 'opacity 0.5s ease-in');
	setTimeout(function(){
		el.show();
		el.css('opacity', '1');
	}, 50);
};

var fadeInWithoutHiding = function(el){
	el.css('-webkit-transition', 'opacity 0.5s ease-in');
	el.css('-moz-transition', 'opacity 0.5s ease-in');
	el.css('-o-transition', 'opacity 0.5s ease-in');
	el.css('-ms-transition', 'opacity 0.5s ease-in');
	el.css('transition', 'opacity 0.5s ease-in');
	setTimeout(function(){
		el.css('opacity', '1');
	}, 50);
};

var timestampToTimeDiv = function(timestamp){
	var date = moment(new Date(timestamp[0]*1000000*1000 + timestamp[1]*1000));
	return '<span class="time" title="'+date.format('LLLL')+'">'+date.format('H:mm:ss')+'</span>';
};

jQuery.fn.center = function (obj) {
  var loc = obj.offset();
  this.css("top",(obj.outerHeight() - this.outerHeight()) / 2 + loc.top - $('#container').offset().top + 'px');
  this.css("left",(obj.outerWidth() - this.outerWidth())  / 2 + loc.left - $('#container').offset().left + 'px');
  return this;
};

var logOut = function(){
	localStorage.clear();
	sessionStorage.clear();
	window.location=window.location;
}


var playerToColorMaps = {};
var colorClasses = ['color_1', 'color_2', 'color_3', 'color_4', 'color_5', 'color_6'];
var nextColor = Math.floor(colorClasses.length*Math.random());

var colorize = function(player){
	if(!playerToColorMaps[player]){
		playerToColorMaps[player] = colorClasses[nextColor];
		nextColor = (nextColor+1)%colorClasses.length;
	}
	return playerToColorMaps[player];
};

var updateOnlinePlayers = function(onlinePlayers){
	$('#round').html('');
	Object.keys(onlinePlayers).forEach(function(player){
		player = player.split(',');
		var name = player[1];
		var el = $('<span class="player '+colorize(player)+'">'+name+'</span>');
		if(!onlinePlayers[player]){
			el.addClass('offline');
			el.attr('title', 'offline');
		}
		el.appendTo('#round');
	});
};