window.Ui = function(){

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

	var removeNormalUI = function(){
		$('#intro').remove();
		$('#signup').remove();
		$('#board').remove();
		$('#guesser').remove();
		$('#guesser_background').remove();
		$('#round').remove();
		$('#invite').remove();
		$('#chat').remove();
		$('#log_out').remove();
		$('#login_link').remove();
		$('#login_link_descr').remove();
	};

	var fadeOutNormalUI = function(){
		fadeOut($('#intro'));
		fadeOut($('#signup'));
		fadeOut($('#board'));
		fadeOut($('#guesser'));
		fadeOut($('#guesser_background'));
		fadeOut($('#round'));
		fadeOut($('#profile'));
		fadeOut($('#chat'));
		fadeOut($('#login_link'));
		fadeOut($('#login_link_descr'));
	};

	jQuery.fn.center = function (obj) {
		var loc = obj.offset();
		this.css("top",(obj.outerHeight() - this.outerHeight()) / 2 + loc.top - $('#main.container').offset().top + 'px');
		this.css("left",(obj.outerWidth() - this.outerWidth())  / 2 + loc.left - $('#main.container').offset().left + 'px');
		return this;
	};

	var timestampToDate = function(timestamp){
		if(timestamp){
			return moment(new Date(timestamp[0]*1000000*1000 + timestamp[1]*1000));
		}else{
			return ""
		}
	}

	var timestampToTimeDiv = function(timestamp){
		if(timestamp){
			var date = timestampToDate(timestamp);
			return '<span class="time" title="'+date.format('LLLL')+'">'+date.format('H:mm:ss')+'</span>';
		}else{
			return '<span class="time""></span>';
		}
	};

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

	var changeStatus = function(newStatus, error, showReloadLink, hideAnyways){
		console.log("Status: "+newStatus);
		$("#status").show();
		$("#status").html(newStatus);
		if(error || hideAnyways){
			removeNormalUI();
		}

		if(error){
			$("#status").html(newStatus+'</br></br>I\'m sorry :(');
			$("#status").addClass("error");
		}

		if(showReloadLink){
			$('</br></br><a href="#" id="reloader">Reload</a>').appendTo("#status");
			$("#reloader").click(ui.navigation.reload);
		}
	}

	var spawnPointsToast = function(pos, deltaPoints){
		var boardCell = $('#board_'+pos);
		var toast = $("<div>"+(deltaPoints > 0 ? "+" + deltaPoints : deltaPoints)+"</div>");
		toast.addClass("points_toast");
		if(deltaPoints > 0){
			toast.addClass('good');
		}else{
			toast.addClass('bad');
		}
		toast.appendTo("#board");
		toast.offset({left: boardCell.offset().left+boardCell.width(), top: boardCell.offset().top});
		toast.animate({
			opacity: 0,
			top: '-=50'
		}, 1000, function(){
			toast.remove();
		})
	};

	// Initialization
	$(".nano").nanoScroller();

	$(".copy_link input").on('click', function(event){
		event.target.select();
	});

	var ui = {

		progress: {
			error: function(message, url, line){
				changeStatus("JavaScript error: "+url+" line "+line+"</br>"+message, true);
				return false;
			},

			jsLoaded: function(){
				changeStatus("JavaScript loaded");
			},

			attemptWebSocket: function(){
				changeStatus("Trying to create Websocket...");
			},

			connectingTo: function(host){
				changeStatus("Connecting to '"+host+"'...");
			},

			retryingWithAnotherPort: function(){
				changeStatus("Connection issues, retrying with another port...", true);
			},

			connectionError: function(code){
				changeStatus("Connection Error "+code, true, true);
			},

			connected: function(){
				changeStatus("Connected");
				$("#status").hide();
			},

			loggingIn: function(){
				changeStatus("Logging in...");
			},

			signingUp: function(name){
				changeStatus("Signing up as "+name+"...");
			},

			invalidLogin: function(){
				changeStatus("Invalid login data.</br>Logging out and reloading...", true);
			},

			loggedIn: function(){
				changeStatus("Logged in");
				$("#status").hide();
			},

			findingGame: function(){
				changeStatus("Finding game...");
			},

			playing: function(){
				changeStatus("Playing :)");
				$("#status").hide();
			}
		},

		navigation: {

			reload: function(){
				window.location = window.location;
			},

			reloadSoon: function(){
				console.log("Reloading soon");
				setTimeout(ui.navigation.reload, 5000);
			}

		},

		signup: {
			show: function(){
				fadeIn($("#intro"));
				fadeIn($("#signup"));
				fadeIn($("#existing_hint"));
			},

			registerValidationAndSignupCallback: function(validateF, signupCallbackF){
				$('#signup #name').on('keyup', function(){
					var name = $('#signup #name').val();
					var validatedName = validateF(name);
					if(name === validatedName){
						$('#signup button').addClass('good');
					}else{
						$('#signup button').removeClass('good');
					}
				});

				$('#signup').on('submit', function(event){
					event.preventDefault();
					var name = $('#signup #name').val();
					var validatedName = validateF(name);
					if(name === validatedName){
						$("#signup").hide();
						$("#existing_hint").hide();
						signupCallbackF(name);
					}
				});
			},

			done: function(fadeOutCallback){
				fadeOutAndRemove($("#intro"), fadeOutCallback);
			}
		},

		player: {
			gameOver: function(){
				fadeOutNormalUI();
				setTimeout(ui.navigation.reload, 500);
			},

			error: function(reason){
				changeStatus("Player process died, reason: "+reason, true, true);
			},

			otherClientConnected: function(){
				changeStatus("You connected from somewhere else. If you want to play here instead, please reload.", false, true, true);
			}
		},

		loginLink: {

			show: function(loginUrl, qrLoginUrl, playerName){
				$("#login_link input").val(loginUrl);
				$("#login_qr").attr('src', "http://2.chart.apis.google.com/chart?cht=qr&chs=64x64&cht=qr&chld=L|0&chl="+encodeURIComponent(qrLoginUrl));
				var mailtoUrl = "mailto:?to=&subject=";
				mailtoUrl += encodeURIComponent("sudoku dash: "+playerName+"'s login link");
				mailtoUrl += "&body=";
				mailtoUrl += encodeURIComponent("Note to self, use this link to play sudoku dash as "+playerName+":\n\n"+loginUrl);
				$("#login_link_email").attr('href', mailtoUrl);

				fadeIn($("#login_link"));
				fadeIn($("#login_link_descr"));
			}

		},

		inviteLink: {

			show: function(inviteUrl, qrInviteUrl){
				$("#invite_link input").val(inviteUrl);
				$("#invite_qr").attr('src', "http://1.chart.apis.google.com/chart?cht=qr&chs=64x64&cht=qr&chld=L|0&chl="+encodeURIComponent(qrInviteUrl));
				fadeIn($("#invite"));
			}


		},

		resetColors: function(){
			playerToColorMaps = {};
		},

		chat: {
			show: function(){
				$("#chat_form").show();
				fadeInWithoutHiding($("#chat"));
			},

			hide: function(){
				$("#chat_form").hide();
				fadeOut($("#chat"));
			},

			registerPostHandler: function(handlerF){
				$('#chat_form').on('submit', function(event){
					event.preventDefault();
					handlerF($('#chat_form #message').val());
					$('#chat_form #message').val('');
					$('#chat_form #message').attr('disabled', 'disabled');
					$('#chat_form #message').attr('placeholder', 'Say something...');
					setTimeout(function(){
						$('#chat_form #message').removeAttr('disabled');
					}, 200);
				});
			},

			append: function(item, timestamp){
				console.log("Chat (%o): %o", timestampToDate(timestamp), item);
				var last = $('.last_chat_message');
				last.removeClass('last_chat_message');
				last.after(
					'<p class="last_chat_message message">'+
					timestampToTimeDiv(timestamp)+
					item+
					'</p>'
				);
				$("#chat").nanoScroller({ scroll: 'bottom' });
			},

			empty: function(){
				$("#chat .message").remove();
				$("#chat .beginning").addClass('last_chat_message');
			},

			appendPlayerMessage: function(player, message, timestamp, playerInfo){
				var name = playerInfo[player].name;
				// escape magic
				var text = ': ' + $('<div/>').text(message).html();
				ui.chat.append('<span class="'+colorize(player)+'">'+name+'</span>'+text, timestamp);
			},

			gameStarted: function(timestamp){
				ui.chat.append('Game started.', timestamp);
				$('#chat_form #message').attr('placeholder', 'Say hello!');
			},

			gameComplete: function(timestamp){
				ui.chat.append('Game complete!', timestamp);
				$('#chat_form #message').attr('placeholder', 'Party hard!');
				setTimeout(function(){ui.chat.append('Closing...', null);}, 7000);
			}

		},

		board: {

			show: function(){
				fadeIn($("#board"));
			},

			hide: function(){
				fadeOut($("#board"));
			},

			initializeCell: function(num, pos){
				$('#board_'+pos).removeAttr('title');
				$('#board_'+pos).removeClass('solved');
				$('#board_'+pos).removeClass('given');
				$('#board_'+pos).removeClass('pending');
				if(num === 0){
					$('#board_'+pos+' div').html("");
					$('#board_'+pos).addClass('empty');
				}else{
					$('#board_'+pos+' div').html(num);
					$('#board_'+pos).removeClass('empty');
					$('#board_'+pos).addClass('given');
				}
			},

			setCellSolved: function(pos, num, player, playerInfos){
				var name = player[0];
				var boardCell = $('#board_'+pos);
				boardCell.children('div').html(num);
				boardCell.removeClass('empty');
				boardCell.addClass('solved');
				boardCell.addClass(colorize(player));
				boardCell.attr('title', playerInfos[player].name);
			},

			setCellPending: function(pos){
				$('#board_'+pos).addClass('pending');
			},

			setCellNotPending: function(pos){
				$('#board_'+pos).removeClass('pending');
			},

			complete: function(){
				return $('#board .empty').length === 0;
			},

			flashCellGood: function(pos){
				spawnPointsToast(pos, 1);
				var boardCell = $('#board_'+pos);
				boardCell.addClass('good');
				setTimeout(function(){
					boardCell.removeClass('good');
				}, 700);
			},

			flashConflicts: function(conflicts){
				conflicts.forEach(function(pos){
					spawnPointsToast(pos, -1);
					var boardCell = $('#board_'+pos);
					boardCell.addClass('bad');
					setTimeout(function(){
						boardCell.removeClass('bad');
					}, 1000);
				});
			},

			flashCellAmbigous: function(pos){
				spawnPointsToast(pos, -1);
				var boardCell = $('#board_'+pos);
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
				}, 2000);
			},

			flashCellAlreadyFilled: function(pos){
				var boardCell = $('#board_'+pos);
				boardCell.addClass('already_filled');
				setTimeout(function(){
					boardCell.removeClass('already_filled');
				}, 700);
			}

		},

		guessing: {

			stop: function(){
				$('#guesser').hide();
				$('#guesser_background').hide();
			},

			registerStartHandler: function(startHandlerF){
				$('#board').on('click', '.cell.empty', function(event){
					var el;
					if($(event.target).hasClass('cell')){
						el = $(event.target);
					}else{
						el = $(event.target).parent();
					}
					$('#guesser').center(el);
					$('#guesser').show();
					$('#guesser_background').show();
					$('#guesser_background').css('opacity', 0);
					setTimeout(function(){
						$('#guesser_background').css('opacity', '');
					},0);

					startHandlerF(parseInt(el.attr('id').slice(6)));
				});
			},

			registerStopHandler: function(stopHandlerF){
				$('#guesser_background').on('click', function(event){
					ui.guessing.stop();
					stopHandlerF();
				});
			},

			registerGuessHandler: function(guessHandlerF, currentlyGuessingF){
				$('#guesser').on('click', 'td', function(event){
					var num = parseInt($(event.target).text());
					guessHandlerF(num);
				});

				$(document).keypress(function(event){
					if(currentlyGuessingF()){
						var num = parseInt(String.fromCharCode(event.which));
						if(num > 0 && num < 10){
							guessHandlerF(num);
						}
					}
				});
			}

		},

		onlinePlayers: {
			show: function(){
				fadeIn($("#round"));
			},

			hide: function(){
				fadeOut($("#round"));
			},

			update: function(onlinePlayers){
				$('#round').html('');
				Object.keys(onlinePlayers).forEach(function(id){
					var player = onlinePlayers[id];
					if(player.show || player.online){
						var el = $(
							'<span class="player '
							+(player.show ? colorize(id) : '')
							+'">'
							+player.name
							+' '
							+player.points
							+'<span class="badges">'
							+player.badges.map(function(badge){return '<span title="'+badge[1]+'">'+badge[0]+'</span>'}).reverse().join('')
							+'</span></span>');
						if(!player.online){
							el.addClass('offline');
							el.attr('title', 'offline');
						}
						el.appendTo('#round');
					}
				});
			}

		}
	}

	return ui;
}