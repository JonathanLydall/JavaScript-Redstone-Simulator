<?php
//include_once 'error_handling.php';
include_once 'utf8_handling.php';

include_once 'function_removeMagicQuotesIfEnabled.php';
include_once 'config_mysqlConnection.php';

include_once 'class_userManager.php';
//include_once 'class_parseJsonToNbt.php';

class saveOnServer {
	private static $initDone = false;
	private static $mysqli;
	private static $mysqlConfigMaxPacketSize;
	
	private static function init() {
		if (!self::$initDone) {
			global $mysqlConfig;
			self::$mysqlConfigMaxPacketSize = $mysqlConfig['max_allowed_packet'];
			self::$mysqli = new mysqli($mysqlConfig['host'], $mysqlConfig['username'], $mysqlConfig['password'], $mysqlConfig['schema']);
			self::$mysqli->set_charset('utf8');
			self::$initDone = true;
			userManager::task_checkForExistingSession();
		}
	}
	
	/**
	 * Sets a $_GET variable to blank if not yet set.
	 * @param object $varName the $_GET value to check and set
	 */
	private static function checkGet($varName) {
		if (!isset($_GET[$varName])) $_GET[$varName] = ""; 
	}
	
	/**
	 * Sets a $_POST variable to blank if not yet set.
	 * @param object $varName the $_POST value to check and set
	 */
	private static function checkPost($varName) {
		if (!isset($_POST[$varName])) $_POST[$varName] = ""; 
	}
	
	/**
	 * Sets a $_COOKIE variable to blank if not yet set.
	 * @param object $varName the $_COOKIE value to check and set
	 */
	private static function checkCookie($varName) {
		if (!isset($_COOKIE[$varName])) $_COOKIE[$varName] = ""; 
	}

	public static function save() {
		self::init();
		self::checkPost('title');
		self::checkPost('filename');
		self::checkPost('description');
		self::checkPost('id');
		self::checkPost('schematicData');
		
		$error = false;
		$errorMessages = array();
		
		if (!isset($_SESSION['userId'])) {
			$error = true;
			$errorMessages['general'] = "Not logged in.";
			return array(
				'error' => true,
				'errorMessages' => $errorMessages
			);

		}
		
		$errorMessages['general'] = ""; //initialize as blank.
		if ($_POST['task'] == "overwriteExisting") {
			$stmt = self::$mysqli->prepare("SELECT `userId` FROM `schematics` WHERE id=?");
			$stmt->bind_param('i', $_POST['id']);
			$stmt->execute();
			$stmt->bind_result($userId);
			$stmt->fetch();
			$stmt->close();
			
			if ($userId != $_SESSION['userId']) {
				$error = true;
				$errorMessages['general'] .= "Cannot overwrite a schematic uploaded by a different user. ";
			}
		}
		
		$schematicData = $_POST['schematicData'];
		$schematicData = base64_decode($schematicData);
		
		//TODO: Check if it's a valid NBT file, will need function written to do it though, we receive binary NBT data from users.

		$filenameLenMax = 64;
		$filenameLenMin = 1;
		if (mb_strlen($_POST['filename']) < $filenameLenMin || mb_strlen($_POST['filename']) > $filenameLenMax) {
			$error = true;
			$errorMessages['filename'] = "Must be from $filenameLenMin to $filenameLenMax characters long.";
		}

		$titleLenMax = 128;
		if (mb_strlen($_POST['title']) > $titleLenMax) {
			$error = true;
			$errorMessages['title'] = "Must be less than $titleLenMax long.";
		}
		
		$descriptionLenMax = 65000; //2^16
		if (mb_strlen($_POST['description']) > $descriptionLenMax) {
			$error = true;
			$errorMessages['description'] = "Must be less than $descriptionLenMax long.";
		}
		
		if ($error) {
			return array(
				'error' => true,
				'errorMessages' => $errorMessages
			);
		}
		else {
			
			//$schematicData = utf8_decode($schematicData);
			//$schematicData = gzencode($schematicData, 9); //gzencode compresses the file into gzip format
			
			
			$dataBlob = NULL;
			
			$fileSize = strlen($schematicData);
			
			
			
			$dataBlob_split = str_split($schematicData, self::$mysqlConfigMaxPacketSize);
			
			date_default_timezone_set("utc");
			$timeNow = date("Y-m-d H:i:s");

			if ($_POST['id'] != -1) {
				$setStr = "";
				$setStr .= "`dataBlob`=?,";
				$setStr .= "`fileSize`=?,";
				$setStr .= "`filename`=?,";
				$setStr .= "`title`=?,";
				$setStr .= "`description`=?,";
				$setStr .= "`lastModified`=?";
				
				$dataBlob = NULL;
		
				$stmt = self::$mysqli->prepare("UPDATE `schematics` SET $setStr WHERE `id`=?");
				$stmt->bind_param("bdssssi", 
					$dataBlob,
					$fileSize,
					$_POST['filename'],
					$_POST['title'],
					$_POST['description'],
					$timeNow,
					$_POST['id']
				);

				foreach($dataBlob_split as $packet) {
					 $stmt->send_long_data(0, $packet);
					 //$stmt->send_long_data(0, $schematicData);
					 
				}
				$stmt->execute();
				$stmt->close();

				return array(
					'error' => false,
					'successMessage' => 'Record updated.',
					"metaData" => array(
						"userId" => $_SESSION['userId'],
						"id" =>  $_POST['id'],
						"displayName" => $_SESSION['userData_client']['displayName'],
						"filename" => $_POST['filename'],
						"title" => $_POST['title'],
						"description" => $_POST['description'],
						"firstCreated" => $timeNow,
						"lastModified" => $timeNow
					)
				);
			}
			else {
				$setStr = "";
				$setStr .= "`dataBlob`=?,";
				$setStr .= "`userId`=?,";
				$setStr .= "`derivedFromId`=?,";
				$setStr .= "`fileSize`=?,";
				$setStr .= "`filename`=?,";
				$setStr .= "`title`=?,";
				$setStr .= "`description`=?,";
				$setStr .= "`firstCreated`=?,";
				$setStr .= "`lastModified`=?";
				
		
				$stmt = self::$mysqli->prepare("INSERT INTO `schematics` SET $setStr");
				$stmt->bind_param("biidsssss", 
					$dataBlob,
					$_SESSION['userId'],
					$_POST['id'],
					$fileSize,
					$_POST['filename'],
					$_POST['title'],
					$_POST['description'],
					$timeNow,
					$timeNow
				);
				
				foreach($dataBlob_split as $packet) {
					 $stmt->send_long_data(0, $packet);
				}
				$stmt->execute();
				$insert_id = $stmt->insert_id;
				$stmt->close();
				
				return array(
					'error' => false,
					'successMessage' => 'New record inserted. ' . $schematicData,
					"metaData" => array(
						"userId" => $_SESSION['userId'],
						"id" => $insert_id,
						"displayName" => $_SESSION['userData_client']['displayName'],
						"filename" => $_POST['filename'],
						"title" => $_POST['title'],
						"description" => $_POST['description'],
						"firstCreated" => $timeNow,
						"lastModified" => $timeNow
					)
				);
			}
		}
	}
}
?>