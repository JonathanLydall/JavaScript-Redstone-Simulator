<?php
include_once 'includes/error_handling.php';
include_once 'includes/utf8_handling.php';

include_once 'includes/function_removeMagicQuotesIfEnabled.php';

$host = $_SERVER['HTTP_HOST'];
$url = $_SERVER['HTTP_REFERER'];
$email = $_POST["email"];
$message = $_POST["message"];
$magic = $_POST["magic"];

$body = $email;
$body .= "\n\n";
$body .= $url;
$body .= "\n\n";
$body .= $message;

$inputError = false;
if (str_replace(" ", "", $email . $message) == "") {
	$inputError = true;
	$errorDetails = "all fields blank";
}

if ($magic = "") {
	$inputError = true;
	$errorDetails = "no magic";
}

date_default_timezone_set("utc");
$timeNow = date("Y-m-d H:i:s");

$headers = 
	"From: noreply@mordritch.com" . PHP_EOL .
	"Reply-To: noreply@mordritch.com" . PHP_EOL .
	"";

$to = "jonathan.lydall+mcrss@gmail.com";
$subject = $spamDetected . "Javascript Redstone Simulator - Feedback (" . $timeNow . ")";

//$body .= PHP_EOL . PHP_EOL . PHP_EOL . "Globals:" . PHP_EOL . print_r($GLOBALS, true);
$body = wordwrap($body, 70);

if ($inputError) {
	echo json_encode(array('error' => 'true', 'type' => 'input', 'details' => $errorDetails));
}
else {
	if (mail($to, $subject, $body, $headers)) {
	//if (mail($to, $subject, $body, $headers) && !$inputError) {
		//echo("<p>Message successfully sent!</p>");
		echo json_encode(array('error' => 'false'));
	}
	else {
		echo json_encode(array('error' => 'true', 'type' => 'mailSend', 'details' => $errorDetails));
	}
}

?>