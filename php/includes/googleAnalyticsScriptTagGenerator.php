<?php
function generateGaqScriptTag() {
	$googleAnalyticsString = <<<EOD
		<script type="text/javascript">
		  var _gaq = _gaq || [];
		  _gaq.push(['_setAccount', 'UA-23638105-1']);
		  _gaq.push(['_trackPageview']);
		
		  (function() {
		    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
		    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
		  })();
		</script>

EOD;

	$runningOnLive = (!(strpos($_SERVER['HTTP_HOST'], 'mordritch.com') === false));
	if ($runningOnLive) {
		echo $googleAnalyticsString;
	}
	else {
		echo "		<!-- Skipped creation of Google Analytics script tag -->\n";
	}
}
?>