<?php
/*
 * JavaScript Redstone Simulator
 * Copyright (C) 2012  Jonathan Lydall (Email: jonathan.lydall@gmail.com)
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA. 
 * 
 */

ob_start("ob_gzhandler"); //HTTP compression
include 'php/includes/class_userManager.php';
include 'php/includes/class_localization.php';
include 'php/includes/class_schematicRetrieval.php';
include 'php/includes/googleAnalyticsScriptTagGenerator.php';
include 'php/socialButtons.php';

$runningOnLive = (!(strpos($_SERVER['HTTP_HOST'], 'mordritch.com') === false));
$language = "en_US"; //TODO: Have this autodetected from cookie or otherwise the request headers
$sessionData = json_encode(userManager::switchTask_standalone('process_getCurrentSessionData'));
$schematicIdToOpen = (isset($_GET["id"])) ? json_encode(intval($_GET["id"])) : "null";
$schematicMetadata = schematicRetrieval::getMetadata($schematicIdToOpen);
$schematicMetadataEncoded = json_encode($schematicMetadata);

function generateScriptTags($prependedWhitespace = '') {
	global $runningOnLive;
	global $language;
	$returnString = '';
	
	if ($runningOnLive) {
		$buildNumber = intval(file_get_contents('release/mc_rss-min.js_build#'));
		$returnString = $prependedWhitespace . '<script type="text/javascript" src="release/mc_rss-min.js?b='.$buildNumber.'"></script>'. PHP_EOL;
		
		$languageBuildNumber = intval(file_get_contents('release/locals/'.$language.'.js_build#'));
		$returnString .= $prependedWhitespace . '<script type="text/javascript" src="release/locals/'.$language.'.js?b='.$languageBuildNumber.'"></script>'. PHP_EOL;
	}
	else {
		$returnString .= $prependedWhitespace . '<!-- BEGIN GENERATED SCRIPT TAGS -->' . PHP_EOL;
		
		$fileList = file('src/_fileList.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
		for ($i=0; $i < count($fileList); $i++) { 
			if (substr($fileList[$i], 0, 1) == ';') continue; //Ignore lines beginning with a semicolon as these are comments
			$returnString .= $prependedWhitespace . '<script type="text/javascript" src="' . str_replace("\\", '/', $fileList[$i]) . '"></script>' . PHP_EOL;
		}
		$returnString .= $prependedWhitespace . '<!-- END GENERATED SCRIPT TAGS -->' . PHP_EOL;
		
		$returnString .= PHP_EOL;
		$returnString .= $prependedWhitespace . '<!-- BEGIN LOCALIZATION STRINGS -->' . PHP_EOL;
		$localizationData = json_encode(localization::getLanguageStrings($language));
		$returnString .= $prependedWhitespace . '<script type="text/javascript">localizationStrings = '. $localizationData . ';</script>' . PHP_EOL;
		$returnString .= $prependedWhitespace . '<!-- END LOCALIZATION STRINGS -->' . PHP_EOL;
	}
	
	return $returnString;
}

function generateNoScriptContent() {
		//TODO: Localize
		echo <<<EOD
<p>If you are seeing this message, then your web browser has JavaScript disabled or does not support it.</p>

<p>Please ensure the following:
	<ul>
		<li>You are using a browser capable of supporting JavaScript.</li>
		<li>JavaScript is enabled on your browser.</li>
	</ul>
</p>
EOD;
	echo getSchematicDetails();
}

function getSchematicDetails() {
	global $schematicMetadata;
	if (!$schematicMetadata['error']) {
		$title = htmlspecialchars($schematicMetadata['title']);
		$description = str_replace("\n", "<br />\n", htmlspecialchars($schematicMetadata['description']));
		$userDisplayName = htmlspecialchars($schematicMetadata['userDisplayName']);
		$schematicId = $schematicMetadata['schematicId'];
		
		return <<<EOD
<p>Please find details of the requested schematic URL below:<br /><br />
	<strong>{$title}</strong><br />
	uploaded by {$userDisplayName}<br /><br />
	{$description}
</p>

<p>Click <a href="./download/?downloadId={$schematicId}">here</a> to download this schematic file to your computer.</p>
EOD;
	}
	else {
		return "";
	}
}

function getNoCanvasError() {
	//TODO Localize
	return
		'<p>' .
			'Unfortunately your browser does not support the HTML5 canvas element, as such, you cannot use this website to view, edit or simulate redstone behaviour.' .
			'<br /><br />' .
			'Please try using any of the following web browsers which are known to support it:' .
			'<ul>' .
				'<li><a href="http://www.google.com/chrome/">Google Chrome</a></li>' .
				'<li><a href="http://www.mozilla.com/firefox/">Firefox 3.6+</a></li>' .
				'<li><a href="http://windows.microsoft.com/ie/">Internet Explorer 9+</a> (earlier versions of IE do not work unfortunately)</li>' .
				'<li><a href="http://www.apple.com/safari/">Safari 5+</a></li>' .
				'<li><a href="http://www.opera.com/browser/">Opera 11+</a></li>' .
			'</ul>' .
		'</p>';
}

?>
<!DOCTYPE html>
<html> 
	<head>
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8" >
		<title>Javascript Redstone Simulator</title> 
		<meta name="keywords" content=""> 
		<meta name="description" content="An in-browser, Javascript redstone simulator. Inspired by Baezon's simulator." /> 
		<link rel="stylesheet" href="css/guiFull.css" />
		<script>
			function redirectIfNoHistoryApiSupport(schematicIdToOpen) {
				if (schematicIdToOpen == null || typeof schematicIdToOpen == "undefined") {
					return;
				}
				
				if (!!window.HTMLCanvasElement && !(window.history && history.pushState)) {
					window.location.href = "./#" + schematicIdToOpen;
				}
			}
			
			var schematicIdToOpen = <?php echo $schematicIdToOpen; ?>;
			redirectIfNoHistoryApiSupport(schematicIdToOpen);
			
			var schematicMetadata = <?php echo $schematicMetadataEncoded; ?>;
			var userManager_cookieCheckResponse = <?php echo $sessionData; ?>;
		</script>

		<script src="js/defaultOptions.js"></script> 

		<script src="js/jquery/jquery-1.7.1.min.js"></script> 
		<script src="js/jquery/jquery-ui-1.8.17.custom.min.js"></script> 
		<script src="js/jquery/jquery.mousewheel.min.js"></script>
		<script src="js/jquery/jquery.form.js"></script>
		<script src="js/jquery/jquery.disableTextSelect.js"></script>
		<script src="js/jquery/jquery.ba-hashchange.min.js"></script>

<?php echo generateScriptTags('		'); ?>			
<?php generateGaqScriptTag(); ?>
	</head>
	
	<body>
		<?php facebookScriptTag(); ?>
		<div id="header">
			<span class="title">Mordritch's JavaScript Redstone Simulator<span id="headerDocumentTitle"></span></span>
			<div id="headerTopRight"><span id="socialButtons"><?php redditButton(); twitterButton(); facebookButton(); ?></span><span id="feedbackAndComments"></span><span id="userManagerHolder"></span></div>
		</div>
		
		<div id="unsupportedByBrowser">
			<noscript>
				<div>
					<?php generateNoScriptContent(); ?>
				</div>
			</noscript>
			
			<script>
				if (!window.HTMLCanvasElement) {
					//Canvas not supported
					var noCanvasError = <?php echo json_encode(getNoCanvasError()); ?>;
					var schematicDetails = <?php echo json_encode(getSchematicDetails()); ?>;
					document.write(noCanvasError);
					document.write(schematicDetails);
				}
			</script>
		</div>
	</body>
</html>
