$(document).ready(function(){

	var urlLogin = /\?(?:qr)?login=(.+)/.exec(window.location.search)
	if(urlLogin && urlLogin[1]){
		localStorage['secret'] = urlLogin[1];
		window.location = window.location.toString().replace(window.location.search, '');
		return;
	}

	var ui = window.Ui();

	window.onerror = ui.progress.error;

	var server = window.Server(ui);
	server.on('hello', function(){
		var authentication = window.Authenticate(ui, server, onAuthenticated);
	});

	var onAuthenticated = function(me){
		var loginUrl = "http://sudokudash.com/?login="+me.secret;
		var qrLoginUrl = "http://sudokudash.com/?qrlogin="+me.secret;
		ui.loginLink.show(loginUrl, qrLoginUrl, me.name);

		var inviteUrl = "http://sudokudash.com/?join="+me.id;
		var qrInviteUrl = "http://sudokudash.com/?qrjoin="+me.id;
		ui.inviteLink.show(inviteUrl, qrInviteUrl);
		
		var game = window.Game(ui, server, me, findGame);
		findGame();
	}

	var findGame = function(){
		ui.progress.findingGame();
		server.send(['find_game', []]);
	}

});