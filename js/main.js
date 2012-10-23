$(document).ready(function(){
	$(".nano").nanoScroller();

	var removeNormalUI = function(){
		$('#intro').remove();
		$('#guest_login').remove();
		$('#ws_connecting').remove();
		$('#board').remove();
		$('#guesser').remove();
		$('#guesser_background').remove();
		$('#round').remove();
		$('#profile').remove();
		$('#chat').remove();
	};

	var fadeOutNormalUI = function(){
		fadeOut($('#intro'));
		fadeOut($('#guest_login'));
		fadeOut($('#ws_connecting'));
		fadeOut($('#board'));
		fadeOut($('#guesser'));
		fadeOut($('#guesser_background'));
		fadeOut($('#round'));
		fadeOut($('#profile'));
		fadeOut($('#chat'));
	};

	// WEBSOCKET
	var host;

	var ports = [80, 2739];

	if(window.location.protocol === 'file:'){
		host = 'localhost:2739';
	}else{
		host = window.location.host;
		if(!localStorage['portN']){
			localStorage['portN'] = 0;
		}
		host += ':' + ports[parseInt(localStorage['portN'])];
	}

	var websocket = new WebSocket('ws://'+host+'/websocket');

	$('#js_ws_note').remove();

	websocket.onclose = function(event){
		$('#ws_error_code').html(event.code);
		$('#ws_error').show();
		removeNormalUI();
	};

	var websocketListeners = {};

	websocket.onmessage = function(event){
		message = JSON.parse(event.data);
		type = message.shift();
		console.log('in %o: %o', type, message);
		websocketListeners[type].forEach(function(listener){
			listener(message)
		});
	};

	var server = {
		send: function(data){console.log('out %o', data);websocket.send(JSON.stringify(data))},
		on: function(type, callback){
			if(!websocketListeners[type]) websocketListeners[type] = [];
			websocketListeners[type].push(callback);
		},
		ready: function(){return websocket.readyState === 1}
	};

	var retryWithNextPortTimeout = setTimeout(function(){
		localStorage['portN'] = (parseInt(localStorage['portN']) + 1) % ports.length;
		window.location = window.location;
	}, 3000);

	server.on('hello', function(){
		clearTimeout(retryWithNextPortTimeout);
	});

	// LOGIN

	var me;
	if(localStorage['me']){
		me = JSON.parse(localStorage['me']);
		$('#guest_login #name').val(me[1]);
		$('#guest_login #name').focus();
	};

	if(sessionStorage['me']){
		$('#intro').hide();
		fadeIn($('#ws_connecting'));
		server.on('hello', function(){
			server.send(['login', me]);
			fadeOutAndRemove($("#ws_connecting"));
		});
	}else{
		setTimeout(function(){
			fadeIn($('#guest_login'));
			fadeIn($('#ws_connecting'));
		}, 500);

		var checkEnteredName = function(){
			if(server.ready()){
				if($('#guest_login #name').val().match(/^[a-zA-Z]{3,13}$/)){
					$('#guest_login button').addClass('good')
				}else{
					$('#guest_login button').removeClass('good')
					setTimeout(function(){
						$('#guest_login #name').val(
							$('#guest_login #name').val().replace(/[^a-zA-Z]/g, '')
						);
						checkEnteredName();
					}, 1000);
				}
			}else{
				$('#guest_login button').removeClass('good')
			}
		}


		server.on('hello', function(){
			fadeOutAndRemove($("#ws_connecting"));
			checkEnteredName();
		});
		$('#guest_login #name').on('keyup', checkEnteredName);

		$('#guest_login').on('submit', function(event){
			event.preventDefault();
			if($('#guest_login #name').val().match(/^[a-zA-Z]{3,13}$/)){
				loginGuest($('#guest_login #name').val().replace(/[^a-zA-Z]/g, ''));
			}
		});

		var generateUUID = function(){
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
		};

		var loginGuest = function(guestName){
			// reuse ID, only if no me saved, create new one
			if(!me || me[1] !== guestName){
				me = ['guest', guestName, generateUUID()];
			}
			server.send(['login', me]);
		};
	}

	

	server.on('login_ok', function(){
		localStorage['me'] = JSON.stringify(me);
		sessionStorage['me'] = JSON.stringify(me);
		$('#guest_login').remove();
		fadeOutAndRemove($('#intro'), function(){
			fadeIn($('#board'));
			fadeIn($('#round'));
			fadeInWithoutHiding($('#chat'));
			setTimeout(function(){
				fadeIn($('#profile'));
				$("#player_name").html(me[1]);
			}, 1000);
		});
		findGame();
	});

	server.on('player_down', function(reason){
		if(reason[0][0] === 'shutdown'
		&& reason[0][1][0] === 'game_over'
		&& reason[0][1][1] === 'complete'){
			fadeOutNormalUI();
			websocket.onclose = function(){};
			setTimeout(function(){
				window.location = window.location;
			}, 500);
		}else{
			$('#player_error_reason').html(reason.toString());
			$('#player_error').show();
			removeNormalUI();
		}
	});

	server.on('other_client_connected', function(){
		$('#other_client_error').show();
		removeNormalUI();
	});

	var findGame = function(){
		server.send(['find_game', []]);
	};

	// CHAT (OUTGOING)

	$('#chat_form').on('submit', function(event){
		event.preventDefault();
		server.send(['chat', $('#chat_form #message').val()]);
		$('#chat_form #message').val('');
		$('#chat_form #message').attr('disabled', 'disabled');
		setTimeout(function(){
			$('#chat_form #message').removeAttr('disabled');
		}, 200);
	});

	// HISTORY UPDATES

	var appendToChat = function(item, timestamp){
		var last = $('.last_chat_message');
		last.removeClass('last_chat_message');
		last.after(
			'<p class="last_chat_message">'+
			timestampToTimeDiv(timestamp)+
			item+
			'</p>'
		);
		$("#chat").nanoScroller({ scroll: 'bottom' });
	};

	var pointsPerPlayer = {};
	var onlinePlayers = {};

	var lastHistoryIndex = 0;

	server.on('history_update', function(historyContainer){
		history = historyContainer[0].reverse();
		history = history.slice(lastHistoryIndex);
		console.log(history);
		history.forEach(function(event){
			lastHistoryIndex ++;

			if(event[0] === 'start'){
				var board = event[2];
				board.forEach(function(num, pos){
					if(num !== 0){
						$('#board_'+pos+' div').html(num);
						$('#board_'+pos).removeClass('empty');
						$('#board_'+pos).addClass('given');
					}
				});
				appendToChat('Game started.', event[1]);
			}else if(event[0] === 'joined'){
				var player = event[2][0];

				if(!pointsPerPlayer[player]){
					pointsPerPlayer[player] = 0;
				}

				onlinePlayers[player] = true;
			}else if(event[0] === 'left'){
				var player = event[2][0];
				delete onlinePlayers[player];
			}else if(event[0] === 'chat'){
				var player = event[2][0];
				var name = player[1];

				// escape magic
				var text = ': ' + $('<div/>').text(event[3]).html();

				appendToChat('<span class="me '+colorize(player)+'">'+name+'</span>'+text, event[1]);
			}else if(event[0] === 'guess'){
				var result = event[5][0];
				var player = event[4][0];
				if(result === 'good'){
					var pos = event[2];
					var num = event[3];
					var name = player[1];
					var boardCell = $('#board_'+pos);
					boardCell.children('div').html(num);
					boardCell.removeClass('empty');
					boardCell.addClass('solved');
					boardCell.addClass(colorize(player));
					boardCell.attr('title', name);

					pointsPerPlayer[player] += 1;

					if(guessPos === pos){
						$('#guesser_background').click();
					}
				}else{
					pointsPerPlayer[player] -= 1;
				}
			}else if(event[0] === 'complete'){
				var winners = [];
				var highestPoints = 0;
				Object.keys(pointsPerPlayer).forEach(function(player){
					var points = pointsPerPlayer[player];
					if(points > highestPoints){
						winners = [player];
						highestPoints = points;
					}else if(points === highestPoints){
						winners.push(player);
					}
				});

				console.log('winners');
				console.log(winners);

				var text = 'Game over.';

				if(highestPoints > 0 && Object.keys(pointsPerPlayer).length > 1){
					text += '</br>'
					winners.forEach(function(winner, i){
						winner = winner.split(',');
						text += '<span class="'+colorize(winner)+'">'+winner[1]+'</span>';
						if(i === winners.length-2){
							text += ' and ';
						}else if(i < winners.length-2){
							text += ', ';
						}
					});

					if(winners.length === 1){
						text += ' wins.'
					}else{
						text += ' win.'
					}
				}

				appendToChat(text, event[1]);
			}
		});

		updatePointsDisplay(pointsPerPlayer, onlinePlayers, me);
	});

	// GUESSING

	var guessPos;
	var lastGuessPos;

	$('#board').on('click', '.cell.empty', function(event){
		var el;
		if($(event.target).hasClass('cell')){
			el = $(event.target);
		}else{
			el = $(event.target).parent();
		}
		guessPos = parseInt(el.attr('id').slice(6));
		$('#guesser').center(el);
		$('#guesser').show();
		$('#guesser_background').show();
		$('#guesser_background').css('opacity', 0);
		setTimeout(function(){
			$('#guesser_background').css('opacity', '');
		},0);
	});

	$('#guesser').on('click', 'td', function(event){
		var num = parseInt($(event.target).text());
		server.send(['guess', guessPos, num]);
		lastGuessPos = guessPos;
		guessPos = undefined;
		$('#guesser').hide();
		$('#guesser_background').hide();
	});

	$('#guesser_background').on('click', function(event){
		guessPos = undefined;
		$('#guesser').hide();
		$('#guesser_background').hide();
	});

	$(document).keypress(function(event){
		if(guessPos){
			var num = parseInt(String.fromCharCode(event.which));
			if(num > 0 && num < 10){
				server.send(['guess', guessPos, num]);
				lastGuessPos = guessPos;
				guessPos = undefined;
				$('#guesser').hide();
				$('#guesser_background').hide();
			}
		}
	});

	server.on('guess_result', function(resultArray){
		var result = resultArray[0][0];
		if(result === 'good'){
			var boardCell = $('#board_'+lastGuessPos);
			boardCell.addClass('good');
			setTimeout(function(){
				boardCell.removeClass('good');
			}, 700);
		}else if(result === 'bad'){
			var conflicts = resultArray[0][1];
			conflicts.forEach(function(pos){
				var boardCell = $('#board_'+pos);
				boardCell.addClass('bad');
				setTimeout(function(){
					boardCell.removeClass('bad');
				}, 700);
			});
		}else if(result === 'ambigous'){
			var boardCell = $('#board_'+lastGuessPos);
			boardCell.addClass('ambigous');
			boardCell.children('div').html('?');
			fadeIn($('#ambigous_message'));
			setTimeout(function(){
				boardCell.removeClass('ambigous');
				if(boardCell.children('div').html() === '?'){
					boardCell.children('div').html('');
				}
			}, 1000);
			setTimeout(function(){
				fadeOut($('#ambigous_message'));
			}, 3000);
		}else if(result === 'already_filled'){
			var boardCell = $('#board_'+lastGuessPos);
			boardCell.addClass('already_filled');
			setTimeout(function(){
				boardCell.removeClass('already_filled');
			}, 700);
		}
	});

});