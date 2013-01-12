<?php
//header('Content-type: application/json; charset=UTF-8');
include_once 'includes/error_handling.php';
include 'includes/class_userManager.php';




//sleep(1); //Artificial response delay
echo json_encode(userManager::switchTask());
?>