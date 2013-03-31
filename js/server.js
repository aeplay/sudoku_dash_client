window.Server = function(ui){

	// generate unique client id
	var clientId = window.generateID();

	// WEBSOCKET
	var host;
	var ports = [80, 2739];

	if(window.location.protocol === 'file:'){
		host = 'localhost:2739';
	}else{
		host = 'darwin.sudokudash.com';
		if(!localStorage['portN']){
			localStorage['portN'] = 0;
		}

		host += ':' + ports[parseInt(localStorage['portN'])];
	}

	ui.progress.attemptWebSocket();

	var bullet = $.bullet('ws://'+host+'/realtime');

	ui.progress.connectingTo(host);

	bullet.onopen = function(){
		server.send(["hello"]);
	}

	bullet.onclose = function(event){
		ui.progress.connectionError(event.code);
	};

	var serverListeners = {};
	var timeoutsForEvents = {};

	bullet.onheartbeat = function(){
        bullet.send('ping');
    }

	bullet.onmessage = function(event){
		console.log('in raw: %o', event.data);
		if(event.data !== "pong"){
			data = JSON.parse(event.data);
			for(var i = 0; i < data[1].length; i++){
				message = data[1][i];
				type = message.shift();
				console.log('in %o: %o', type, message);
				if(serverListeners[type]){
					serverListeners[type].forEach(function(listener){
						listener(message);
					});
				}
				if(timeoutsForEvents[type]){
					timeoutsForEvents[type].forEach(function(timeout){
						console.log('Cleared timeout for: '+type);
						clearTimeout(timeout);
						timeoutsForEvents[type].splice(timeoutsForEvents[type].indexOf(timeout), 1);
					});
				}
			}
		}
	};

	/* TODO: CONNECTION ALGORITHM 
	   find server which the player process is already on OR the nearest one
	   try all ports at once, use the one that responds
	   on login, do the same again
	   after that stay on the same port
	*/


	var server = {
		send: function(data){
			data.push(clientId);
			console.log('out %o', data);
			bullet.send(JSON.stringify(data))
		},
		on: function(type, callback){
			if(!serverListeners[type]) serverListeners[type] = [];
			serverListeners[type].push(callback);
		},
		once: function(type, callback){
			var callbackWrap = function(message){
				callback(message);
				serverListeners[type].splice(serverListeners[type].indexOf(callbackWrap), 1);
			}
			server.on(type, callbackWrap);
		},
		timeoutEvents: function(f, eventTypes, time){
			console.log('Registered timeout for: '+eventTypes);
			var timeout = setTimeout(f, time);
			eventTypes.forEach(function(eventType){
				if(!timeoutsForEvents[eventType]){timeoutsForEvents[eventType] = []};
				timeoutsForEvents[eventType].push(timeout);
			});
		},
		ready: function(){return bullet.readyState === 1},
		retryWithNextPort: function(){
			localStorage['portN'] = (parseInt(localStorage['portN']) + 1) % ports.length;
			ui.progress.retryingWithAnotherPort();
			ui.navigation.reloadSoon();
			server.ignoreDisconnect();
		},
		ignoreDisconnect: function(){
			bullet.onclose = function(){};
		}
	};

	server.timeoutEvents(server.retryWithNextPort, ['hello'], 5000);

	server.on('hello', function(){
		ui.progress.connected(host);
	});

	return server;
}