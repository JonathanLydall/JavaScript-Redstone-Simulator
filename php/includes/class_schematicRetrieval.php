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

include_once 'error_handling.php';
include_once 'utf8_handling.php';

include_once 'config_mysqlConnection.php';
include_once 'function_removeMagicQuotesIfEnabled.php';

class schematicRetrieval {
	public static function getMetadata($id) {
		if (strval(intval($id)) != strval($id)) {
			return array("error" => true, "runningOnLive" => self::runningOnLive(), "errorDescription" => "No record found with ID $id. (1)"); //Not an int
		}

		if (self::runningOnLive() || $id < 1000) {
			return self::getMetadataFromDB($id);
		}
		else {
			return self::getMetadataFromLive($id);
		}
	}
	
	public static function getFile($id) {
		if (strval(intval($id)) != strval($id)) {
			return null;
		}

		if (self::runningOnLive() || $id < 1000) {
			return self::getFileFromDB($id);
		}
		else {
			return self::getFileFromLive($id);
		}
	}
	
	public static function checkExists($id) {
		if (strval(intval($id)) != strval($id)) {
			return false;
		}
		
		if (self::runningOnLive() || $id < 1000) {
			return self::checkExistsFromDB($id);
		}
		else {
			return self::checkExistsFromLive($id);
		}
	}
	
	private static function runningOnLive() {
		return (!(strpos($_SERVER['HTTP_HOST'], 'mordritch.com') === false));
	}
		
	private static function getFileFromLive($id) {
		return file_get_contents('http://mordritch.com/mc_rss/php/openBinaryById.php?id='.$id);
	}
		
	private static function getFileFromDB($id) {
		global $mysqlConfig;

		$mysqli = new mysqli($mysqlConfig['host'], $mysqlConfig['username'], $mysqlConfig['password'], $mysqlConfig['schema']);
		$mysqli->set_charset('utf8');
		
		$stmt = $mysqli->prepare("SELECT `dataBlob` FROM `schematics` WHERE id=?");
		$stmt->bind_param('i', $id);
		$stmt->execute();
		$stmt->bind_result($dataBlob);
		if (!$stmt->fetch()) {
			$returnValue = null;
		}
		else {
			$returnValue = $dataBlob;
		}
		$stmt->close();
		
		return $returnValue;
	}
	
	private static function checkExistsFromLive($id) {
		$metadata = getMetadataFromLive($id);
		return !$metadata['error'];
	}

	private static function checkExistsFromDB($id) {
		global $mysqlConfig;
		
		$mysqli = new mysqli($mysqlConfig['host'], $mysqlConfig['username'], $mysqlConfig['password'], $mysqlConfig['schema']);
		$mysqli->set_charset('utf8');
		
		$queryString = 'SELECT EXISTS(SELECT * FROM `schematics` WHERE `schematics`.`id`=?)';
		
		$stmt = $mysqli->prepare($queryString);
		$stmt->bind_param('i', $id);
		$stmt->execute();
		$stmt->bind_result($result);
		$stmt->fetch();
		
		return ($result == 1);
	}

	private static function getMetadataFromLive($id) {
		$url = 'http://mordritch.com/mc_rss/php/getSchematicMetadata.php?id='.$id;
		$arr = json_decode(file_get_contents($url), true);
		$arr['downloaded'] = true;
		$arr['url'] = $url;
		return $arr;
	}
		
	private static function getMetadataFromDB($id) {
		global $mysqlConfig;
		
		$mysqli = new mysqli($mysqlConfig['host'], $mysqlConfig['username'], $mysqlConfig['password'], $mysqlConfig['schema']);
		$mysqli->set_charset('utf8');
		
		$queryString =
	 		'SELECT ' .
			    '`schematics`.`id`,' .
			    '`schematics`.`userId`,' .
			    '`users`.`displayName`,' .
			    '`schematics`.`authorName`,' .
			    '`schematics`.`filename`,' .
			    '`schematics`.`title`,' .
			    '`schematics`.`description`,' .
			    '`schematics`.`fileSize`,' .
			    '`schematics`.`firstCreated`,' .
			    '`schematics`.`lastModified`' .
			'FROM ' .
				'`schematics`' .
			'LEFT OUTER JOIN ' .
				'`users`' .
			'ON ' .
				'`schematics`.`userId` = `users`.`id`' .
			'WHERE ' .
				'`schematics`.`id`=?';
			
		$stmt = $mysqli->prepare($queryString);
		$stmt->bind_param('i', $id);
		$stmt->execute();
		$stmt->bind_result(
			$schematicId,
			$userId,
			$userDisplayName,
			$preUsersAuthorName,
			$fileName,
			$title,
			$description,
			$fileSize,
			$created,
			$lastModified
		);
		if ($stmt->fetch()) {
			$returnArray = array(
				'error' => false,
				'schematicId' => $schematicId,
				'userId' => $userId,
				'userDisplayName' => ($userDisplayName != NULL) ? $userDisplayName : $preUsersAuthorName,
				'fileName' => $fileName,
				'title' => $title,
				'description' => $description,
				'fileSize' => $fileSize,
				'created' => $created,
				'lastModified' => $lastModified
			);
			$stmt->close();
			return $returnArray;
		}
		else {
			$returnArray = array("error" => true, "runningOnLive" => self::runningOnLive(), "errorDescription" => "No record found with ID $id. (2)");
			$stmt->close();
			return $returnArray;
		}
	}
}
?>