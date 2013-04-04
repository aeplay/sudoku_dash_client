var fs = require('fs');
var csso = require('csso');
var UglifyJS = require("uglify-js");

html = fs.readFileSync('index_full.html', 'utf-8');

html = html.replace(/<link href="css\/(.+?)" rel="stylesheet">/g, function(match, submatch){
	var css = csso.justDoIt(fs.readFileSync('css/'+submatch, 'utf-8'));
	return "<!-- automatically inlined "+submatch+"-->\n\t\t<style>\n\t\t\t"+css+"\n\t\t</style>";
});

allJs = "";

html = html.replace(/<script src="js\/(.+?)"><\/script>/g, function(match, submatch){
	allJs += fs.readFileSync('js/'+submatch, 'utf-8') + '\n';
	return "REPLACE_WITH_JS";
});


allJs = UglifyJS.minify(allJs, {fromString: true, compress: {unsafe: true}}).code;
allJs = "<script>"+allJs+"</script>"

// prevent bug that inserts matched string for $, see MDN String.replace
html = html.replace(/REPLACE_WITH_JS(\s+REPLACE_WITH_JS)+/g, function(){return allJs});

console.log(html);