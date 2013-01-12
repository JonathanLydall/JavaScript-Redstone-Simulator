<?php
$runningOnLive = (!(strpos($_SERVER['HTTP_HOST'], 'mordritch.com') === false));

function facebookScriptTag() {
	//1. Include the JavaScript SDK on your page once, ideally right after the opening <body> tag.
	global $runningOnLive;
	if ($runningOnLive) {
		echo 
			'<div id="fb-root"></div>' .
			'<script>(function(d, s, id) {' .
				'var js, fjs = d.getElementsByTagName(s)[0];' .
				'if (d.getElementById(id)) return;' .
				'js = d.createElement(s); js.id = id;' .
				'js.src = "//connect.facebook.net/en_GB/all.js#xfbml=1";' .
				'fjs.parentNode.insertBefore(js, fjs);' .
			'}(document, \'script\', \'facebook-jssdk\'));</script>';
	}
}

function facebookButton() {
	// 2. Place the code for your plugin wherever you want the plugin to appear on your page.
	global $runningOnLive;
	if ($runningOnLive) {
			echo
			'<span class="facebookButton">' .
			'<div class="fb-like" data-href="http://mordritch.com/mc_rss/" data-send="false" data-layout="button_count" data-width="100" data-show-faces="false" data-font="arial"></div>' .
			'</span>';
	}
}

function twitterButton() {
	global $runningOnLive;
	if ($runningOnLive) {
		echo 
			'<span class="twitterButton">' .
			'<a href="https://twitter.com/share" class="twitter-share-button" data-url="http://mordritch.com/mc_rss/" data-text="JavaScript Minecraft Redstone Simulator" data-dnt="true">Tweet</a>' .
			'<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>' .
			'</span>';
	}
}

function redditButton() {
	global $runningOnLive;
	if ($runningOnLive) {
		echo
			'<span class="redditButton">' .
			'<script type="text/javascript">' . 
				'var reddit_url = "http://mordritch.com/mc_rss/"; ' .
				'var reddit_target = "redstone"; ' .
				'var reddit_title = "JavaScript Minecraft Redstone Simulator"; ' .
				'var reddit_newwindow="1"; ' .
			'</script>' .
			'<script type="text/javascript" src="http://www.reddit.com/static/button/button1.js"></script>' .
			'</span>';
	}
}
?>