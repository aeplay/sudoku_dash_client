var fs = require('fs');
var csso = require('csso');
var UglifyJS = require("uglify-js");

html = fs.readFileSync('index_full.html', 'utf-8');

html = html.replace(/<link href="css\/(.+?)" rel="stylesheet">/g, function(match, submatch){
	var css = csso.justDoIt(fs.readFileSync('css/'+submatch, 'utf-8'));
	return "<!-- automatically inlined "+submatch+"-->\n\t\t<style>\n\t\t\t"+css+"\n\t\t</style>";
});

html = html.replace(/<script src="js\/(.+?)"><\/script>/g, function(match, submatch){
	js = UglifyJS.minify('js/'+submatch).code;
	return "<!-- automatically inlined "+submatch+"-->\n\t<script>\n\t\t"+js+"\n\t</script>";
});

console.log(html);