window.generateID = function(){
	return 'xxxxxxxx'.replace(/[x]/g, function(c) {
		var r = Math.random()*36|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(36);
	});
};