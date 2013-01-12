<?php
//include_once 'includes/error_handling.php';
include 'includes/config_mysqlConnection.php';


//Because, inexplicably, gzdecode is not yet in PHP and will only be part of PHP version 6.
// http://www.php.net/manual/en/function.gzdecode.php#84174
function gzdecode_prePhp6($data) {
	$g=tempnam('/tmp','ff');
	@file_put_contents($g,$data);
	ob_start();
	readgzfile($g);
	$d=ob_get_clean();
	return $d;
}

$recordId = $_GET['id'];
if (intval($recordId) == 0) {
	//echo json_encode(array("error" => true, "errorDescription" => "Requested ID ($recordId) is not an integer."));
	exit;
}

function getFromDb($id, $mysqlConfig) {
	$mysqli = new mysqli($mysqlConfig['host'], $mysqlConfig['username'], $mysqlConfig['password'], $mysqlConfig['schema']);
	$mysqli->set_charset('utf8');
	
	$stmt = $mysqli->prepare("SELECT `dataBlob` FROM `schematics` WHERE id=?");
	$stmt->bind_param('i', $id);
	$stmt->execute();
	$stmt->bind_result($dataBlob);
	if (!$stmt->fetch()) {
		echo json_encode(array("error" => true, "errorDescription" => "No record found with ID $id"));
		exit;
	}
	$stmt->close();
	
	$dataBlob = gzdecode_prePhp6($dataBlob); //decompressing in javascript is much slower and because we are using HTTP compression, there is no substantial difference in size.
	$dataBlob = base64_encode($dataBlob);
	return $dataBlob;	
}


function getFromLiveSite($id) {
	return file_get_contents('http://mordritch.com/mc_rss/php/openBinaryById.php?id='.$id);
}

$runningOnLive = (!(strpos($_SERVER['HTTP_HOST'], 'mordritch.com') === false));

if (!$runningOnLive && $recordId >= 1000) {
	$dataBlob = getFromLiveSite($recordId);
}
else {
	$dataBlob = getFromDb($recordId, $mysqlConfig);
}

ob_start("ob_gzhandler"); //Enables GZIP compression.
header('Content-Type: text/html; charset=UTF-8');

echo $dataBlob; //In the database it's stored as a GZIP encoded file. 
?>