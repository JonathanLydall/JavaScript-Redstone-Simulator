<?php
header('Content-type: application/json; charset=UTF-8');
include_once 'includes/utf8_handling.php';
include_once 'includes/class_localization.php';
ob_start("ob_gzhandler");


if (!isset($_REQUEST["task"])) {
	$get_task = "getList";
}
else
{
	$get_task = $_REQUEST["task"];
}

switch ($get_task) {
	case "getLang":
		if (!isset($_REQUEST["lang"]))
		{
			$lang = "en_US";
		}
		else {
			$lang = $_REQUEST["lang"];
		}
		
		echo json_encode(localization::getLanguageStrings($lang));
		break;
	default:
		echo json_encode(localization::getLanguageList());
		break;
}
?>