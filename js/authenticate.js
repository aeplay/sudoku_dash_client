// LOGIN
window.Authenticate = function(ui, server, authenticatedCallback){
	var me = {};
	var retryWithNextPortTimeout;

	var login = function(secret){
		server.send(['login', {secret: me.secret}]);
		ui.progress.loggingIn();
		server.timeoutEvents(server.retryWithNextPort, ['login_ok', 'login_invalid'], 3000);
	}

	if(localStorage['secret']){
		me.secret = localStorage['secret'];
		login();
	}else{
		ui.signup.show();

		var validateName = function(name){
			if(name.match(/^[a-zA-Z]{3,9}$/)){
				return name;
			}else{
				if(name.length < 3 || name.length > 9){
					return false;
				}
				return name.replace(/[^a-zA-Z]/g, '');
			}
		}

		var generateID = function(){
			return 'xxxxxxxx'.replace(/[x]/g, function(c) {
				var r = Math.random()*36|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(36);
			});
		};

		var generatePlayerAndLogin = function(name){
			me = {
				name: name,
				id: generateID(),
				secret: generateID()
			};
			server.send(['signup', me]);
			ui.progress.signingUp(me.name);
			server.timeoutEvents(server.retryWithNextPort, ['signup_ok', 'signup_invalid'], 3000);
			server.on('signup_ok', function(){
				login();
			});
		};

		ui.signup.registerValidationAndSignupCallback(validateName, generatePlayerAndLogin);
		
	}

	server.on('login_invalid', function(){
		localStorage.removeItem('secret');
		ui.progress.invalidLogin();
		ui.navigation.reloadSoon();
	});

	server.on('login_ok', function(playerContainer){
		localStorage['secret'] = me.secret;
		var player = playerContainer[0];
		me.name = player[0];
		me.id = player[1];
		ui.progress.loggedIn();
		ui.signup.done(function(){
			authenticatedCallback(me);
		});
	});

	server.on('player_down', function(reason){
		if(reason[0][0] === 'shutdown'
		&& reason[0][1][0] === 'game_over'
		&& reason[0][1][1] === 'complete'){
			ui.player.gameOver();
		}else{
			ui.player.error(reason.toString());
		}
		server.ignoreDisconnect();
	});

	server.on('other_client_connected', function(){
		ui.player.otherClientConnected();
	});
};