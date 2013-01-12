<?php
/**
 * We temporarily save it in the database so it can be requested with a HTTP GET request.
 * 
 * This is needed because IE chokes on iframes with too much data in them.
 */

//include_once 'includes/error_handling.php';
include_once 'includes/utf8_handling.php';
include_once 'includes/config_mysqlConnection.php';



function readFileAsBinary($filename) {
	$handle = gzopen($filename, "rb"); //using gzopen auto detects whether or not the file is compressed
	$contents = stream_get_contents($handle);
	
	return $contents;
}

function gzdecode_prePhp6($data) {
	$g=tempnam('/tmp','ff');
	@file_put_contents($g,$data);
	ob_start();
	readgzfile($g);
	$d=ob_get_clean();
	return $d;
}

function exitWithError($message) {
	echo json_encode(array("error" => true, "errorDescription" => $message));
	exit;
}


$mysqli = new mysqli($mysqlConfig['host'], $mysqlConfig['username'], $mysqlConfig['password'], $mysqlConfig['schema']);
$mysqli->set_charset('utf8');


date_default_timezone_set("utc");
$timeNow = date("Y-m-d H:i:s");


//Always delete any records which were uploaded more than an hour ago:
$deleteOlderThan = new DateTime();
$deleteOlderThan->sub(new DateInterval('PT1H')); //delete any records older than an hour
$formattedDate = $deleteOlderThan->format("Y-m-d H:i:s");


$stmt = $mysqli->prepare("DELETE FROM `schematics_tempholder` WHERE timestamp<?");
$stmt->bind_param('s', $formattedDate);
$stmt->execute();
$stmt->close();


if (!isset($_GET["task"])) exitWithError("Task not set.");

switch ($_GET["task"]) {
	case "put":
		$tempFile = $_FILES['schematicFile']['tmp_name'];
		
		$dataBlob_split = str_split(file_get_contents($tempFile), $mysqlConfig['max_allowed_packet']);
		$dataBlob = NULL;
		
		$stmt = $mysqli->prepare("INSERT INTO `schematics_tempholder` SET `data`=?, `timestamp`=?");
		$stmt->bind_param("bs", $dataBlob, $timeNow);
		if ( false===$stmt ) die('bind_param() failed: ' . htmlspecialchars($mysqli->error));

		foreach($dataBlob_split as $packet) {
			 $stmt->send_long_data(0, $packet);
		}
		$stmt->execute();
		$insert_id = $stmt->insert_id;
		$stmt->close();
		
		$returnArray = array("id" => $insert_id);

		if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest') {
			echo json_encode($returnArray);
		}
		else {
			echo '<textarea>' . json_encode($returnArray) . '</textarea>'; 
		}


		
		break;
	case "get":
		if (!isset($_GET["id"])) exitWithError("ID not set.");
		if (!is_numeric($_GET["id"])) exitWithError("ID not an integer.");
		$recordId = $_GET["id"];
		
		$stmt = $mysqli->prepare("SELECT `data` FROM `schematics_tempholder` WHERE id=?");
		$stmt->bind_param('i', $recordId);

		$stmt->execute();
		$stmt->bind_result($dataBlob);
		if (!$stmt->fetch()) {
			exitWithError("No record found with ID $recordId.");
		}
		$stmt->close();
		
		ob_start("ob_gzhandler"); //Enables GZIP compression.
		//header('Content-type: text/plain; charset=x-user-defined');
		header('Content-Type: text/html; charset=UTF-8');
		
		
		$dataBlob = gzdecode_prePhp6($dataBlob); //Slower in Javascript than in PHP and HTTP compression makes the size difference a non-issue
		$dataBlob = base64_encode($dataBlob); //Base64 encoding means json_encoding doesn't need to encode any characters, resulting in smaller string size. GZip compress also seems to be really effective on base64 strings
		//$dataBlob = json_encode($dataBlob); //JSON decoding big strings is *slow* in Javascript
		echo $dataBlob;
		
		//Delete the record:
		$stmt = $mysqli->prepare("DELETE FROM `schematics_tempholder` WHERE id=?");
		$stmt->bind_param('i', $recordId);
		$stmt->execute();
		$stmt->close();
		
		break;
}
?>