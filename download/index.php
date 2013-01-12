<?php
include '../php/includes/class_schematicRetrieval.php';
include '../php/includes/utf8_handling.php';
include '../php/includes/googleAnalyticsScriptTagGenerator.php';

function canDoDownload() {
	$referer = (isset($_SERVER['HTTP_REFERER'])) ? $_SERVER['HTTP_REFERER'] : "";
	$schematicId = (isset($_GET['downloadId'])) ? $_GET['downloadId'] : -1;
	$httpHost = $_SERVER['HTTP_HOST'];
	
	return (
		$referer != "" &&
		strpos($referer, "http://" . $httpHost) == 0 &&
		$schematicId >= 0 &&
		schematicRetrieval::checkExists($schematicId));
}

function doDownloadAndExit() {
	$fileMetadata = schematicRetrieval::getMetadata($_GET['downloadId']);
	$fileContents = schematicRetrieval::getFile($_GET['downloadId']);
	$fileSize = strval(strlen($fileContents));
	$fileName = $fileMetadata['fileName'];
	
	header('Content-Description: File Transfer');
	header('Content-Type: application/octet-stream');
	header('Content-Disposition: attachment; filename=' . $fileName . '.schematic');
	header('Content-Transfer-Encoding: binary');
	header('Expires: 0');
	header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
	header('Pragma: public');
	header('Content-Length: ' . $fileSize);
	
	echo $fileContents;
	
	exit;
}

function id() {
	global $schematicMetadata;
	echo htmlspecialchars($schematicMetadata['schematicId']);
}

function noRedirect() {
	echo (isset($_GET['noRedirect'])) ? "true" : "false";
}

function author() {
	global $schematicMetadata;
	echo htmlspecialchars($schematicMetadata['userDisplayName']);
}

function fileName() {
	global $schematicMetadata;
	echo htmlspecialchars($schematicMetadata['fileName']) .".schematic";
}

if (canDoDownload()) {
	doDownloadAndExit();
}
else {
	$schematicMetadata = schematicRetrieval::getMetadata($_GET['downloadId']);
}
?>
<!DOCTYPE html>
<html> 
	<head>
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8" >
		<title>Javascript Redstone Simulator</title> 
		<meta name="keywords" content=""> 
		<meta name="description" content="An in-browser, Javascript redstone simulator. Inspired by Baezon's simulator." />
		<style>
			body {font-family: Arial};
		</style>
<?php generateGaqScriptTag(); ?>
	</head>
	<body>
		<h1>Mordritch's Javascript Redstone Simulator</h1>
<?php
	if (!$schematicMetadata['error']) {
?>
		<div>
			<script type="text/javascript">
				window.onload = function() {
					var schematicId = <?php id(); ?>;
					var noRedirect = <?php noRedirect(); ?>;
					if (!noRedirect) {
						window.location.href = './?noRedirect=true&downloadId=' + schematicId;
					}
				}
			</script>
			<img src="../images/icons/download-2.png" />
			<p>You are downloading <b><?php fileName(); ?></b> which was uploaded by <b><?php author(); ?></b> using <a href="../">Mordritch's Javascript Redstone Simulator</a>.</p>
			<p>If the download does not start automatically, click <a href="./?downloadId=<?php id(); ?>">here</a>.</p>
			<p>You can also view/edit the schematic online <a href="../#<?php id(); ?>">here</a> from inside your web browser.</p>
		</div>
<?php
	} else {
?>
		<div>
			<p>No schematic found with the requested ID.</p>
			<p>Make your own schematic <a href="../">here</a>.</p>
		</div>
<?php
	}
?>		
	</body>
</html>
