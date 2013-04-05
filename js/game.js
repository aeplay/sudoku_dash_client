window.Game = function(ui, server, me, restartCallback){

	// CHAT (OUTGOING)

	ui.chat.registerPostHandler(function(message){
		server.send(['chat', message]);
	});

	// HISTORY UPDATES

	var onlinePlayers = {};
	var firstGameEvent = true;

	server.on('game_event', function(data){
		var game = data[0];
		var timestamp = data[1]
		var eventType = data[2];
		var eventData = data[3];

		if(firstGameEvent){
			onlinePlayers = {};
			ui.resetColors();
			ui.progress.playing();
			ui.board.show();
			ui.onlinePlayers.show();
			ui.chat.show();
			firstGameEvent = false;
		}

		console.log("game event: %o", eventType);

		if(eventType === 'start'){
			var board = eventData[1];
			board.forEach(ui.board.initializeCell);
			ui.chat.gameStarted(timestamp);

		}else if(eventType === 'join'){
			var player = eventData[0];
			var playerInfo = eventData[1];
			onlinePlayers[player] = {
				name: playerInfo[1],
				points: playerInfo[2],
				badges: playerInfo[3],
				online: true,
				show: (onlinePlayers[player] && onlinePlayers[player].show)
			};

		}else if(eventType === 'leave'){
			var player = eventData[0];
			onlinePlayers[player] && (onlinePlayers[player].online = false);

		}else if(eventType === 'chat'){
			var player = eventData[0];
			var message = eventData[1];
			ui.chat.appendPlayerMessage(player, message, timestamp, onlinePlayers);

		}else if(eventType === 'guess'){
			var player = eventData[0];
			var result = eventData[3];

			if(result[0] === 'good'){
				var pos = eventData[1];
				var num = eventData[2];

				onlinePlayers[player].points++;
				onlinePlayers[player].show = true;
				
				ui.board.setCellSolved(pos, num, player, onlinePlayers);
				if(ui.board.complete()){
					ui.chat.gameComplete(timestamp);
					setTimeout(function(){
						server.send(['leave', 'complete']);
					}, 9000);
				}

				if(guessPos === pos){
					ui.guessing.stop();
				}
			}else if(result[0] === 'bad'){
				var conflicts = result[1];
				onlinePlayers[player].points -= 2*conflicts.length;
			}else if(result[0] === 'ambigous'){
				onlinePlayers[player].points -= 3;
			}

		}

		ui.onlinePlayers.update(onlinePlayers);
	});

	server.on('player_event', function(data){
		if(data[0] === "leave" && data[1] === "complete"){
			firstGameEvent = true;
			ui.onlinePlayers.hide();
			ui.chat.empty();
			ui.chat.hide();
			ui.board.hide();
			setTimeout(restartCallback, 1000);
		}
	});

	// GUESSING

	var guessPos;
	var pendingGuesses = [];

	ui.guessing.registerStartHandler(function(pos){
		guessPos = pos;
	});

	ui.guessing.registerStopHandler(function(){
		guessPos = undefined;
	});

	ui.guessing.registerGuessHandler(function(num){
		server.send(['guess', guessPos, num]);
		pendingGuesses.push(guessPos);
		guessPos = undefined;
		ui.guessing.stop();
		ui.board.setCellPending(guessPos);
	}, function(){return guessPos});

	server.on('game_event', function(data){
		var eventType = data[2];
		var eventData = data[3];
		if(eventType === 'guess'){
			var player = eventData[0];
			if(player === me.id){
				var pos = eventData[1];
				var index = pendingGuesses.indexOf(pos);
				if(index !== -1){
					pendingGuesses.splice(index, 1);
					var result = eventData[3];

					ui.board.setCellNotPending(pos);

					if(result[0] === 'good'){
						ui.board.flashCellGood(pos);
					}else if(result[0] === 'bad'){
						var conflicts = result[1];
						ui.board.flashConflicts(conflicts);
						
					}else if(result[0] === 'ambigous'){
						ui.board.flashCellAmbigous(pos);

					}else if(result[0] === 'already_filled'){
						ui.board.flashCellAlreadyFilled(pos);
					}
				}
				
			}
		}
	});

}