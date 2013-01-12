<?php
/*
 * JavaScript Redstone Simulator
 * Copyright (C) 2012  Jonathan Lydall (Email: jonathan.lydall@gmail.com)
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA. 
 * 
 */

include_once 'utf8_handling.php';

if (!(strpos($_SERVER['HTTP_HOST'], 'mordritch.com') === false)) {
	$runningOnLive = true;
	ini_set('display_errors', 0);
}
else {
	$runningOnLive = false;
}

$error_handler_errors = array();
function error_handler($errno, $errstr, $errfile, $errline, $errcontext) {
	global $error_handler_errors;
	$this_error = array(
		'$errno' => $errno,
		'$errstr' => $errstr,
		'$errfile' => $errfile,
		'$errline' => $errline
	);
	$error_handler_errors[] = $this_error;
	//,'$errcontext' => $errcontext


	/*
	date_default_timezone_set("utc");
	$timeNow = date("Y-m-d H:i:s");
	$body = 
		"Previous Errors:" . PHP_EOL . print_r($this_error, true) . PHP_EOL .
	"";
	
	$headers = 
		"From: noreply@mordritch.com" . PHP_EOL .
		"Reply-To: noreply@mordritch.com" . PHP_EOL .
	"";
	
	$to = "jonathan.lydall+mcrss@gmail.com";
	$subject = "Javascript Redstone Simulator - Fatal server side error (" . $timeNow . ")";
	$body = wordwrap($body, 70);
	
	mail($to, $subject, $body, $headers);
	*/


	
}
set_error_handler('error_handler');


function shutdown() {
	global $error_handler_errors;
	global $runningOnLive;
	$lastError = error_get_last();
	$errorMessage = 'Fatal server side scripting error occurred. If you are uploading a file, it may have been too big and exhausted the maximum amount of memory for the PHP script on the server.';

	
	if ($lastError != null) {
		switch ($lastError['type']) {
			case E_ERROR:
			case E_PARSE:
			case E_CORE_ERROR:
			case E_CORE_WARNING:
			case E_COMPILE_ERROR:
			case E_COMPILE_WARNING:
				header('HTTP/1.1 200 OK');
				
				if ($runningOnLive) {
					echo json_encode(array(
						"error" => true,
						"authenticated" => false,
						"errorMessage" => $errorMessage,
						"errorDescription" => $errorMessage,
						"errorMessages" => array(
							"general" => $errorMessage
						)
					));
				}
				else {
					echo json_encode(array(
						"error" => true,
						"authenticated" => false,
						"errorMessage" => $errorMessage,
						"errorMessages" => array(
							"general" => $errorMessage
						),
						"errorDetails" => $lastError
					));
				}


				date_default_timezone_set("utc");
				$timeNow = date("Y-m-d H:i:s");
				$random_hash = md5($timeNow);

				$body = 
					"--$random_hash" . PHP_EOL .
					"Content-Type: text/plain; charset=ISO-8859-1" . PHP_EOL .
					PHP_EOL .
					"Previous Errors:" . PHP_EOL . print_r($error_handler_errors, true) . PHP_EOL .
					"Last Error:" . PHP_EOL . print_r($lastError, true) . PHP_EOL .
				 	"Backtrace:" . PHP_EOL . print_r(debug_backtrace(), true) . PHP_EOL .
				 	"Globals:" . PHP_EOL . print_r($GLOBALS, true) . PHP_EOL .
					PHP_EOL .
				"";
				$body = wordwrap($body, 70);
				
				foreach($_FILES as $att) {
					$fileContents = base64_encode(file_get_contents($att[tmp_name]));
					$fileName = $att['name'];
					$fileType = $att['type'];

					$body .=
						"--$random_hash" . PHP_EOL .
						"Content-Type: $fileType; name=\"$fileName\"" . PHP_EOL .
						"Content-Transfer-Encoding: base64" . PHP_EOL .
						"Content-Disposition: attachment; filename=\"$fileName\"" . PHP_EOL .
						PHP_EOL .
						wordwrap($fileContents, 70, PHP_EOL, true) . PHP_EOL .
					"";			
				}
				
				$body .= "--$random_hash--";
				$headers = 
					"From: noreply@mordritch.com" . PHP_EOL .
					"Reply-To: noreply@mordritch.com" . PHP_EOL .
					"Content-Type: multipart/mixed; boundary=\"".$random_hash."\"" . PHP_EOL .
				"";
				
				$to = "jonathan.lydall+mcrss@gmail.com";
				$subject = "Javascript Redstone Simulator - Fatal server side error (" . $timeNow . ")";
				
				
				mail($to, $subject, $body, $headers);



				break;	
		}
	}
}
register_shutdown_function('shutdown');
/*
*/
?>