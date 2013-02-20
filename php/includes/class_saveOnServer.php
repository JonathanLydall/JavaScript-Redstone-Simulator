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

//include_once 'error_handling.php';
include_once 'utf8_handling.php';

include_once 'function_removeMagicQuotesIfEnabled.php';
include_once 'config_mysqlConnection.php';

include_once 'class_userManager.php';
include_once 'class_schematicRetrieval.php';

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
	
	private static function isLoggedOn()
	{
		return isset($_SESSION['userId']);
	}
	
	private static function getErrors()
	{
		$errorMessages = array("general" => "");

			if ($_POST['task'] == "overwriteExisting") {
			$stmt = self::$mysqli->prepare("SELECT `userId` FROM `schematics` WHERE id=?");
			$stmt->bind_param('i', $_POST['id']);
			$stmt->execute();
			$stmt->bind_result($userId);
			$stmt->fetch();
			$stmt->close();
			
			if ($userId != $_SESSION['userId']) {
				$errorMessages['general'] .= "Cannot overwrite a schematic uploaded by a different user. ";
			}
		}
		
		//TODO: Check if it's a valid NBT file, will need function written to do it though, we receive binary NBT data from users.

		$filenameLenMax = 64;
		$filenameLenMin = 1;
		if (mb_strlen($_POST['filename']) < $filenameLenMin || mb_strlen($_POST['filename']) > $filenameLenMax) {
			$errorMessages['filename'] = "Must be from $filenameLenMin to $filenameLenMax characters long.";
		}

		$titleLenMax = 128;
		if (mb_strlen($_POST['title']) > $titleLenMax) {
			$errorMessages['title'] = "Must be less than $titleLenMax long.";
		}
		
		$descriptionLenMax = 65000; //2^16
		if (mb_strlen($_POST['description']) > $descriptionLenMax) {
			$errorMessages['description'] = "Must be less than $descriptionLenMax long.";
		}
		
		return $errorMessages;
	}

	private static function insertIntoDatabase()
	{
		date_default_timezone_set("utc");
		
		$schematicData = base64_decode($_POST['schematicData']);
		$timeNow = date("Y-m-d H:i:s");
		$fileSize = strlen($schematicData);
		$dataBlob = NULL;
		$dataBlob_split = str_split($schematicData, self::$mysqlConfigMaxPacketSize);
		
		$stmt = self::$mysqli->prepare(
			"INSERT INTO " .
				"`schematics`" .
			" SET " . 
				/** 1 **/ "`dataBlob`=?," .
				/** 2 **/ "`userId`=?," .
				/** 3 **/ "`derivedFromId`=?," .
				/** 4 **/ "`fileSize`=?," .
				/** 5 **/ "`filename`=?," .
				/** 6 **/ "`title`=?," .
				/** 7 **/ "`description`=?," .
				/** 8 **/ "`firstCreated`=?," .
				/** 9 **/ "`lastModified`=?");
				
		$stmt->bind_param("biidsssss", 
			/** 1 **/ $dataBlob,
			/** 2 **/ $_SESSION['userId'],
			/** 3 **/ $_POST['derivedFromId'],
			/** 4 **/ $fileSize,
			/** 5 **/ $_POST['filename'],
			/** 6 **/ $_POST['title'],
			/** 7 **/ $_POST['description'],
			/** 8 **/ $timeNow,
			/** 9 **/ $timeNow);
		
		foreach($dataBlob_split as $packet) {
			 $stmt->send_long_data(0, $packet);
		}
		
		$stmt->execute();
		$insert_id = $stmt->insert_id;
		$stmt->close();
		
		return $insert_id;
	}
	
	private static function updateIntoDatabase()
	{
		date_default_timezone_set("utc");

		$schematicData = base64_decode($_POST['schematicData']);
		$timeNow = date("Y-m-d H:i:s");
		$fileSize = strlen($schematicData);
		$dataBlob = NULL;
		$dataBlob_split = str_split($schematicData, self::$mysqlConfigMaxPacketSize);

		$stmt = self::$mysqli->prepare(
			"UPDATE " .
				"`schematics`" . 
			" SET " .
				/** 1 **/ "`dataBlob`=?," .
				/** 2 **/ "`fileSize`=?," .
				/** 3 **/ "`filename`=?," .
				/** 4 **/ "`title`=?," .
				/** 5 **/ "`description`=?," .
				/** 6 **/ "`lastModified`=?".
			" WHERE ".
				/** 7 **/ "`id`=?");
		
		$stmt->bind_param("bdssssi",
			/** 1 **/ $dataBlob,
			/** 2 **/ $fileSize,
			/** 3 **/ $_POST['filename'],
			/** 4 **/ $_POST['title'],
			/** 5 **/ $_POST['description'],
			/** 6 **/ $timeNow,
			/** 7 **/ $_POST['id']
		);

		foreach($dataBlob_split as $packet) {
			 $stmt->send_long_data(0, $packet);
		}
		
		$stmt->execute();
		$stmt->close();
		
		return $_POST['id'];
	}
	
	public static function save() {
		self::init();
		self::checkPost('title');
		self::checkPost('filename');
		self::checkPost('description');
		self::checkPost('id');
		self::checkPost('derivedFromId');
		self::checkPost('schematicData');
		
		if (!self::isLoggedOn()) {
			$error = true;
			$errorMessages['general'] = "Not logged in.";
			return array(
				'error' => true,
				'errorMessages' => array("general" => "Not logged in.")
			);
		}
		
		$errorMessages = self::getErrors();
		if ($errorMessages['general'] != "") {
			return array(
				'error' => true,
				'errorMessages' => $errorMessages);
		}
		
		// If we are recieving a new schematic, the posted schematic ID is -1
		if ($_POST['id'] == -1)
		{
			$schematicId = self::insertIntoDatabase();
			$successMessage = 'New record inserted.';
		}
		else
		{
			$schematicId = self::updateIntoDatabase();
			$successMessage = 'Record updated.';
		}
		
		return array(
			'error' => false,
			'successMessage' => $successMessage,
			"metaData" => schematicRetrieval::getMetadata($schematicId)); 
	}
}
?>