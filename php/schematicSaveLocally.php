<?php
//include_once 'includes/error_handling.php';
include_once 'includes/utf8_handling.php';
include_once 'includes/config_mysqlConnection.php';

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
		if (!isset($_POST['schematicData'])) exitWithError("No data.");
		if (!isset($_POST['fileName'])) exitWithError("No file name.");

		$fileData = base64_decode($_POST['schematicData']);
		$fileName = utf8_decode($_POST['fileName']);
		
		$dataBlob_split = str_split($fileData, $mysqlConfig['max_allowed_packet']);
		$dataBlob = NULL;
		
		$stmt = $mysqli->prepare("INSERT INTO `schematics_tempholder` SET `data`=?, `fileName`=?, `timestamp`=?");
		$stmt->bind_param("bss", $dataBlob, $fileName, $timeNow);
		if ( false===$stmt ) exitWithError('bind_param() failed: ' . htmlspecialchars($mysqli->error));

		foreach($dataBlob_split as $packet) {
			 $stmt->send_long_data(0, $packet);
		}
		$stmt->execute();
		$insert_id = $stmt->insert_id;
		$stmt->close();
		
		$returnArray = array("id" => $insert_id, "fileSize" => strlen($fileData));

		if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest') {
			echo json_encode($returnArray);
		}
		else {
			echo '<textarea>' . json_encode($returnArray) . '</textarea>'; 
		}


		
		break;
	case "get":
		if (!isset($_POST["id"])) exitWithError("ID not set.");
		if (!is_numeric($_POST["id"])) exitWithError("ID not an integer.");
		$recordId = $_POST["id"];
		
		$stmt = $mysqli->prepare("SELECT `data`, `fileName` FROM `schematics_tempholder` WHERE id=?");
		$stmt->bind_param('i', $recordId);

		$stmt->execute();
		$stmt->bind_result($fileContents, $fileName);
		if (!$stmt->fetch()) {
			exitWithError("No record found with ID $recordId.");
		}
		$stmt->close();
		
		$fileSize = strlen($fileContents);
			
		header('Content-Description: File Transfer');
		header('Content-Type: application/octet-stream');
		header('Content-Disposition: attachment; filename=' . $fileName . '.schematic');
		header('Content-Transfer-Encoding: binary');
		header('Expires: 0');
		header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
		header('Pragma: public');
		header('Content-Length: ' . $fileSize);
		echo $fileContents;
		
		//Delete the record:
		$stmt = $mysqli->prepare("DELETE FROM `schematics_tempholder` WHERE id=?");
		$stmt->bind_param('i', $recordId);
		$stmt->execute();
		$stmt->close();
		
		break;
}
?>