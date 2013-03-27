window.Game = function(ui, server, me){

	// CHAT (OUTGOING)

	ui.chat.registerPostHandler(function(message){
		server.send(['chat', message]);
	});

	// HISTORY UPDATES

	server.once('history_update', function(){
		ui.progress.playing();
		ui.board.show();
		ui.onlinePlayers.show();
		ui.chat.show();
	});

	var onlinePlayers = {};
	var lastHistoryIndex = 0;

	server.on('history_update', function(historyContainer){
		var history = historyContainer[0].reverse();
		history = history.slice(lastHistoryIndex);
		history.forEach(function(event){
			lastHistoryIndex ++;

			if(event[0] === 'start'){
				var timestamp = event[1];
				var board = event[2];
				board.forEach(ui.board.initializeCell);
				ui.chat.gameStarted(timestamp);

			}else if(event[0] === 'joined'){
				var player = event[2][0];
				onlinePlayers[player] = true;

			}else if(event[0] === 'left'){
				var player = event[2][0];
				onlinePlayers[player] = false;

			}else if(event[0] === 'chat'){
				var timestamp = event[1];
				var player = event[2][0];
				var message = event[3];
				ui.chat.appendPlayerMessage(player, message, timestamp);

			}else if(event[0] === 'guess'){
				var result = event[5][0];
				var player = event[4][0];

				if(result === 'good'){
					var pos = event[2];
					var num = event[3];
					
					ui.board.setCellSolved(pos, num, player);

					if(guessPos === pos){
						ui.guessing.stop();
					}
				}

			}else if(event[0] === 'complete'){
				var timestamp = event[1];
				ui.chat.gameComplete(timestamp);

			}
		});

		ui.onlinePlayers.update(onlinePlayers);
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

	server.on('guess_result', function(resultArray){
		var result = resultArray[0][0];
		var resultPos = pendingGuesses.shift();

		ui.board.setCellNotPending(resultPos);


		if(result === 'good'){
			ui.board.flashCellGood(resultPos);

		}else if(result === 'bad'){
			var conflicts = resultArray[0][1];
			ui.board.flashConflicts(conflicts);
			ui.board.tilt();
			
		}else if(result === 'ambigous'){
			ui.board.flashCellAmbigous(resultPos);
			ui.board.tilt();

		}else if(result === 'already_filled'){
			ui.board.flashCellAlreadyFilled(resultPos);
		}
	});

}