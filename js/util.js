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
}

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
}

jQuery.fn.center = function (obj) {
  var loc = obj.offset();
  this.css("top",(obj.outerHeight() - this.outerHeight()) / 2 + loc.top + 'px');
  this.css("left",(obj.outerWidth() - this.outerWidth())  / 2 + loc.left+ 'px');
  return this;
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
}


var updatePointsDisplay = function(pointsPerPlayer, onlinePlayers, me){
	$('#round').html('');
	Object.keys(pointsPerPlayer).sort(function(a, b){
		var comp = pointsPerPlayer[a] - pointsPerPlayer[b];
		if(comp === 0){
			// sort by player id
			return a[2] > b[2] ? 1 : -1;
		}
		return comp;
	}).forEach(function(player, i){
		player = player.split(',');
		var el = $(
			'<div class="player">'+
			'<div class="points">'+pointsPerPlayer[player]+'</div>'+
			'<div class="name '+colorize(player)+'">'+player[1]+'</div>'+
			'</div>'
		);
		if(!(player > me || player < me)){
			el.addClass('me');
		}
		if(onlinePlayers[player]){
			el.addClass('online');
			el.attr('title', 'online');
		}else{
			el.attr('title', 'offline');
		}
		el.appendTo('#round');
	});
}