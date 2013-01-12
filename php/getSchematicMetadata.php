<?php
include 'includes/class_schematicRetrieval.php';

$recordId = (isset($_GET['id'])) ? $_GET['id'] : 0;
echo json_encode(schematicRetrieval::getMetadata($recordId));
?>