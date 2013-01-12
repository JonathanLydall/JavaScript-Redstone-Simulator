<?php
include 'includes/class_schematicRetrieval.php';

$id = (isset($_GET["id"])) ? $_GET["id"] : -1;
$fileMetadata = schematicRetrieval::getMetadata($id);

if ($fileMetadata['error']) {
	$error = true;
	$errorText = $fileMetadata['errorDescription'];
}
else {
	$error = false;
	$fileContents = schematicRetrieval::getFile($id);
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
}
?>