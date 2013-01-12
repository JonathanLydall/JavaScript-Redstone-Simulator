<?php
header('Content-type: application/json; charset=UTF-8');
//include_once 'includes/error_handling.php';

include 'includes/class_saveOnServer.php';

echo json_encode(saveOnServer::save());
//echo json_encode($_POST['schematicData']);
?>
