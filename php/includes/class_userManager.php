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
//include_once 'utf8_handling.php';

include_once 'config_mysqlConnection.php';
include_once 'class_phpPass.php';
include_once 'function_removeMagicQuotesIfEnabled.php';

define('POST', 1);
define('GET', 2);
define('COOKIE', 3);
//sleep(2);
class userManager {
	private static $initDone = false;
	
	private static $mysqli = null;
	private static $hasher = null;
	
	private static $minPassLength = 8;
	private static $maxPassLength = 32;
	
	private static $minNameLength = 3;
	private static $maxNameLength = 32;
	
	/**
	 * Sets a $_GET variable to blank if not yet set.
	 * @param object $varName the $_GET value to check and set
	 */
	private static function _initRequestString_get($varName) {
		if (!isset($_GET[$varName])) $_GET[$varName] = ""; 
	}
	
	/**
	 * Sets a $_POST variable to blank if not yet set.
	 * @param object $varName the $_POST value to check and set
	 */
	private static function _initRequestString_post($varName) {
		if (!isset($_POST[$varName])) $_POST[$varName] = ""; 
	}
	
	/**
	 * Sets a $_COOKIE variable to blank if not yet set.
	 * @param object $varName the $_COOKIE value to check and set
	 */
	private static function _initRequestString_cookie($varName) {
		if (!isset($_COOKIE[$varName])) $_COOKIE[$varName] = ""; 
	}
	
	private static function _request($type, $varName) {
		switch ($type) {
			case POST:
				if (isset($_POST[$varName])) {
					return $_POST[$varName];
				}
				else {
					return "";
				}
				break;
			case GET:
				if (isset($_GET[$varName])) {
					return $_GET[$varName];
				}
				else {
					return "";
				}
				break;
			case COOKIE:
				if (isset($_COOKIE[$varName])) {
					return $_COOKIE[$varName];
				}
				else {
					return "";
				}
				break;
		}
		 
	}
	
	private static function _init() {
		if (!self::$initDone) {
			global $mysqlConfig;
			self::$mysqli = new mysqli($mysqlConfig['host'], $mysqlConfig['username'], $mysqlConfig['password'], $mysqlConfig['schema']);
			self::$mysqli->set_charset('utf8');
			self::$hasher = new PasswordHash(8, false);
			self::$initDone = false;
		}
	}
	
	public static function switchTask() {
		if (!isset($_GET['task'])) {
			$_GET['task'] = null;
		}
		
		return self::switchTask_standalone($_GET['task']);
	}

	public static function switchTask_standalone($task) {
		self::_init();
		self::task_checkForExistingSession();
		
		date_default_timezone_set("utc");

		switch ($task) {
			case "triggerError":
				self::nonExistantFunction();
				break;
			case "clearSessionOnly":
				//For testing, can be used to clear the session data, but not cookie data
				session_unset();
				break;
			case "process_getCurrentSessionData":
				return self::process_getCurrentSessionData();
				break;
			case "process_logIn":
				return self::process_logIn();
				break;
			case "process_logOut":
				self::task_logOut();
				return array(
					'error' => false
				);
				break;
			case "process_newAccount":
				return self::process_newAccount();
				break;
			case "process_saveOptions":
				return self::process_saveOptions();
				break;
			case "process_commitUserSettings":
				return self::process_commitUserSettings();
				break;
			case "process_resetPassword":
				return self::process_resetPassword();
				break;
			case "pwReset_setNewPassword":
				$token = self::_request(GET, 'token');
				$password = self::_request(POST, 'password');
				$confirmPassword = self::_request(POST, 'confirmPassword');
				return self::pwReset_setNewPassword($token, $password, $confirmPassword);
				break;
			case "process_editPassword":
				return self::process_editPassword();
				break;
			case "process_editProfile":
				return self::process_editProfile();
				break;
			case "get_schematicListForLoggedInUser":
				return self::get_schematicListForLoggedInUser();
				break;
			case "process_signIn":
				return self::process_signIn();
				break;
			default:
				return array(
					"error" => true,
					"errorMessage" => "Invalid task: " . $task
				);
				break;
		}
	}
	
	/**
	 * Process a request for the current logged in state, if logged in return client userdata
	 * 
	 * @return Array
	 */
	private static function process_getCurrentSessionData() {
		if (isset($_SESSION['userId'])) {
			return array(
				"error" => false,
				"authenticated" => true,
				"userData" => $_SESSION['userData_client']
			);
			
		} else {
			return array(
				"error" => false,
				"authenticated" => false
			);
		}
	}
	
	
	/**
	 * If we are not logged in, we will check if we have a cookie which matches a valid persistant session.
	 * 
	 * It is public because can be called by different scripts.
	 * 
	 * @return 
	 */
	public static function task_checkForExistingSession() {
		self::_init();
		session_start();
		
		//If the password in the database has changed, we need to destroy the session:
		if (isset($_SESSION['userId'])) {
			$stmt = self::$mysqli->prepare("SELECT `emailAddress`,`passwordHash` FROM `users` WHERE `id`=?");
			if ( false===$stmt ) die('prepare() failed: ' . self::$mysqli->error);
			$stmt->bind_param('i', $_SESSION['userId']);
			if ( false===$stmt ) die('bind_param() failed: ' . self::$mysqli->error);
			$stmt->execute();
			$stmt->bind_result($emailAddress, $passwordHash);
			$doLogout = false;
			while ($stmt->fetch()) {
				if ($emailAddress != $_SESSION['userData_db']['emailAddress'] || $passwordHash != $_SESSION['userData_db']['passwordHash']) {
					$doLogout = true;
					break;
				}
			}
			$stmt->close();
			
			if ($doLogout) self::task_logOut();
		}
		
		if (!isset($_SESSION['userId']) && isset($_COOKIE['persistantSessionIdentifier'])) {
			$stmt = self::$mysqli->prepare("SELECT `id`,`userId` FROM `persistantsessions` WHERE `cookieString`=?");
			$stmt->bind_param('s', $_COOKIE['persistantSessionIdentifier']);
			$stmt->execute();
			$stmt->store_result();
			$stmt->bind_result($id, $userId);
			$stmt->fetch();
			$resultCount = $stmt->num_rows;
			$stmt->close();

			if ($resultCount > 0) {
				$_SESSION['userId'] = $userId;
				self::dbTask_updateLastLogin($userId);
				self::task_populateSessionWithUserData();
			}
			else {
				//The cookie is set to something for which we no longer have a record, set it to the past, 1 second since unix epoch.
				setcookie('persistantSessionIdentifier', '', 1);
				unset($_COOKIE['persistantSessionIdentifier']);
			}
		}
	}
	
	/**
	 * Creates a persistant cookie if none exists.
	 * 
	 * @return 
	 */
	private static function task_setPersistantCookie() {
		$userId = $_SESSION['userId'];
		$userIp = $_SERVER['REMOTE_ADDR'];
		$timeNow = date("Y-m-d H:i:s");

		if (!isset($_COOKIE['persistantSessionIdentifier'])) {
			//A difficult to predict random string based on the account data:
			$cookieValue = md5($_SESSION['userData_db']['passwordHash'] . mt_rand());

			$setStr = 
				"`userId`=?," .
				"`cookieString`=?," .
				"`lastIp`=?," .
				"`lastLogin`=?"
			;
			
			$stmt = self::$mysqli->prepare("INSERT INTO `persistantsessions` SET $setStr");
			$stmt->bind_param('isss',
				$userId,
				$cookieValue,
				$userIp,
				$timeNow
			);
			$stmt->execute();
			$stmt->close();
		}
		else {
			$cookieValue = $_COOKIE['persistantSessionIdentifier'];
			
			$setStr = 
				"`lastIp`=?," .
				"`lastLogin`=?"
			;
			
			$stmt = self::$mysqli->prepare("UPDATE `persistantsessions` SET $setStr WHERE `cookieString`=?");
			$stmt->bind_param('sss',
				$userIp,
				$timeNow,
				$cookieValue
			);
			$stmt->execute();
			$affectedRowCount = $stmt->affected_rows;
			$stmt->close();
			
			if ($affectedRowCount < 1) {
				$cookieValue = md5($_SESSION['userData_db']['passwordHash'] . mt_rand());
				$stmt = self::$mysqli->prepare("
					INSERT INTO
						`persistantsessions`
					SET
						`userId`=?,
						`cookieString`=?,
						`lastIp`=?,
						`lastLogin`=?
				");
				
				$stmt->bind_param('isss',
					$userId,
					$cookieValue,
					$userIp,
					$timeNow
				);
				$stmt->execute();
				$stmt->close();
			}
		}
		
		$cookieExpires = time() + (18 * 30 * 24 * 60 * 60); //18 months, 30 days per month, 24 hours per day, 60m per hour, 60s per minute
		setcookie('persistantSessionIdentifier', $cookieValue, $cookieExpires, '/');
	}


	/**
	 * Populates the session with information about the user account.
	 * 
	 * Splits the info into data which will be sent to the client and data which can only be accessed by the server.
	 * For example the password hash is never sent to the client.
	 * 
	 * @return 
	 */
	private static function task_populateSessionWithUserData() {
		$stmt = self::$mysqli->prepare("
			SELECT 
				`emailAddress`,
				`passwordHash`,
				`displayName`,
				`optionsBlob`,
				`bindingsBlob`,
				`userSettingsBlob`
			FROM `users`
			WHERE id=?
		");
		$stmt->bind_param('i', $_SESSION['userId']);
		$stmt->execute();
		$stmt->store_result();
		$stmt->bind_result(
			$emailAddress,
			$passwordHash,
			$displayName,
			$optionsBlob,
			$bindingsBlob,
			$userSettingsBlob
		);
		$stmt->fetch();
		$stmt->close();
		

		$_SESSION['userData_client'] = array(
			"userId" => $_SESSION['userId'],
			"emailAddress" => $emailAddress,
			"displayName" => $displayName,
			"options" => json_decode($optionsBlob, $assoc = true),
			"bindings" => json_decode($bindingsBlob, $assoc = true),
			"userSettings" => json_decode($userSettingsBlob, $assoc = true)
		);
		
		$_SESSION['userData_db'] = array(
			'id' => $_SESSION['userId'],
			'emailAddress' => $emailAddress,
			'displayName' => $displayName,
			'passwordHash' => $passwordHash
		);
		
		self::task_setPersistantCookie();
	}

	/**
	 * Processes a login request.
	 * 
	 * @return 
	 */
	private static function process_logIn() {
		$authFailure = false;
		if (
			!isset($_POST['existing_emailAddress']) ||
			!isset($_POST['existing_password']) ||
			!filter_var($_POST['existing_emailAddress'], FILTER_VALIDATE_EMAIL)
		) {
			$authFailure = true;
		}
		
		if (!$authFailure) {
			self::dbTask_checkLoginAgainstSchematicData($_POST['existing_emailAddress'], $_POST['existing_password']);

			$emailAddress = $_POST['existing_emailAddress'];
			
			$stmt = self::$mysqli->prepare("SELECT `id`,`passwordHash`,`loginCount` FROM `users` WHERE `emailAddress`=?");
			$stmt->bind_param('s', $emailAddress);
			$stmt->execute();
			$stmt->store_result();
			$stmt->bind_result($userId, $passwordHash, $loginCount);
			$stmt->fetch();
			$resultCount = $stmt->num_rows;
			$stmt->close();
		}
		
		if (!$authFailure && $resultCount < 1) {
			$authFailure = true;
		}
		
		if (!$authFailure && !phpPass::checkPassword($_POST['existing_password'], $passwordHash)) {
			$authFailure = true;
		}
		
		if ($authFailure) {
			return array(
				"error" => true,
				"errorMessages" => array(
					"existing_general" => "Email address and password combination invalid or no account with that email address."
				)
			);
		}
		else {
			$_SESSION['userId'] = $userId;
			self::task_populateSessionWithUserData();
			self::dbTask_claimSchematicToUserId($_SESSION['userData_db']['emailAddress'], $userId);
			self::dbTask_updateLastLogin($userId);
			return array(
				"error" => false,
				"authenticated" => true,
				"userData" => $_SESSION['userData_client']
			);
		}
	}
	
	/**
	 * Deletes session and persistant cookie
	 * 
	 * @return 
	 */
	private static function task_logOut() {
		session_unset();
		
		if (isset($_COOKIE['persistantSessionIdentifier'])) {
			$stmt = self::$mysqli->prepare("DELETE FROM `persistantsessions` WHERE `cookieString`=?");
			if ( false===$stmt ) die('prepare() failed: ' . htmlspecialchars(self::$mysqli->error));
			$stmt->bind_param('s',
				$_COOKIE['persistantSessionIdentifier']
			);
			if ( false===$stmt ) die('bind_param() failed: ' . htmlspecialchars(self::$mysqli->error));
			$stmt->execute();
			$stmt->close();
		}

		setcookie('persistantSessionIdentifier', '', 1);
		unset($_COOKIE['persistantSessionIdentifier']);
	}
	
	/**
	 * Incremements login count for a userId and updates their last login date.
	 * 
	 * @param integer $userId
	 * @return 
	 */
	private static function dbTask_updateLastLogin($userId) {
		$timeNow = date("Y-m-d H:i:s");
		$stmt = self::$mysqli->prepare("UPDATE `users` SET `lastLogin`=?,`loginCount`=(`loginCount` + 1) WHERE `id`=?");
		$stmt->bind_param('si',
			$timeNow,
			$userId
		);
		$stmt->execute();
		$stmt->close();
	}

	/**
	 * Single form which is used for both login and sign up.
	 */
	private static function process_signIn() {
		switch ($_POST['task']) {
			case "existing":
				return self::process_logIn();
				break;
			case "new":
				return self::process_newAccount();
				break;
			case "forgottenPassword":
				return self::process_resetPassword();
				break;
			default:
				return array(
					"error" => true,
					"errorMessage" => "Uknown sign in task."
				);
				break;
		}
	}
	
	/**
	 * When a user tries to make a new account.
	 * 
	 * @return Array with error set appropriately and success message or error details set based on success.
	 */
	private static function process_newAccount() {
		//Check input
		$inputError = false;
		$errors = array();
		if (filter_var($_POST['new_emailAddress'], FILTER_VALIDATE_EMAIL) == false) {
			$inputError = true;
			$errors['new_emailAddress'] = "Invalid email address.";
		} else {
			$stmt = self::$mysqli->prepare("SELECT `id` FROM `users` WHERE emailAddress=?");
			$stmt->bind_param('s', $_POST['new_emailAddress']);
			$stmt->execute();
			$stmt->store_result(); //necessary for num_rows to populate
			$resultCount = $stmt->num_rows;
			$stmt->close();
			if ($resultCount > 0) {
				$inputError = true;
				$errors['new_emailAddress'] = "Account with that email address already exists.";
			}
		}

		if (mb_strlen($_POST['new_password']) < self::$minPassLength || mb_strlen($_POST['new_password']) > self::$maxPassLength) {
			$inputError = true;
			$errors['new_password'] = "Length must be from " . self::$minPassLength . " to " . self::$maxPassLength . " characters long.";
		}
		
		if ($_POST['new_confirmPassword'] != $_POST['new_password']) {
			$inputError = true;
			$errors['new_confirmPassword'] = "Password and confirm password do not match.";
		}
		
		$maxDisplayNameLen = self::$maxNameLength;
		$minDisplayNameLen = self::$minNameLength;
		if (mb_strlen($_POST['new_displayName']) < $minDisplayNameLen || mb_strlen($_POST['new_displayName']) > $maxDisplayNameLen) {
			$inputError = true;
			$errors['new_displayName'] = "Length must be from $minDisplayNameLen to $maxDisplayNameLen characters long.";
		}
		
		if ($inputError) {
			return array(
				"error" => true,
				"errorMessages" => $errors
			);
		}
		else {
			$emailAddress = $_POST['new_emailAddress'];
			$displayName = $_POST['new_displayName'];
			$password = $_POST['new_password'];
			
			$insert_id = self::dbTask_insertUser($emailAddress, $password, $displayName);
			self::dbTask_claimSchematicToUserId($emailAddress, $insert_id);
			
			$_SESSION['userId'] = $insert_id;
			self::task_populateSessionWithUserData();
			
			return array(
				"error" => false,
				"successMessage" => 'User account successfully created.',
				"userData" => $_SESSION['userData_client']
			);
		}
	}
	
	/**
	 * Used to save options selected by a user in the database.
	 * 
	 * @return Array with error state and error message.
	 */
	private static function process_saveOptions() {
		if (!isset($_SESSION['userId'])) {
			return array(
				"error" => true,
				"errorMessage" => "Not logged in."
			);
		}
		
		if (!isset($_GET['data'])) {
			return array(
				"error" => true,
				"errorMessage" => "No data to save."
			);
		}
		
		if (json_decode($_GET['data']) == null) {
			return array(
				"error" => true,
				"errorMessage" => "Data not valid JSON."
			);
		}
		
		global $mysqlConfig;
		$userOptions = $_GET['data']; //It's in JSON format.
		$optionsBlob_split = str_split($userOptions, $mysqlConfig['max_allowed_packet']);
		$optionsBlob = null;
		
		$stmt = self::$mysqli->prepare("UPDATE `users` SET `optionsBlob`=? WHERE `id`=?");
		$stmt->bind_param('bi',
			$optionsBlob,
			$_SESSION['userId']
		);

		foreach($optionsBlob_split as $packet) {
			 $stmt->send_long_data(0, $packet);
		}
		
		$stmt->execute();
		$stmt->close();
		
		self::task_populateSessionWithUserData();
		
		return array(
			"error" => false
		);
	}
	
	/**
	 * Commits users userSettings to the database
	 * 
	 * @return Array with error state and error message.
	 */
	private static function process_commitUserSettings() {
		if (!isset($_SESSION['userId'])) {
			return array(
				"error" => true,
				"errorMessage" => "Not logged in."
			);
		}
		
		if (!isset($_GET['type'])) {
			return array(
				"error" => true,
				"errorMessage" => "No type specified."
			);
		}
		
		if (!isset($_POST['data'])) {
			return array(
				"error" => true,
				"errorMessage" => "No data to save."
			);
		}
		
		if (json_decode($_POST['data']) == null) {
			return array(
				"error" => true,
				"errorMessage" => "Data not valid JSON."
			);
		}
		
		self::task_populateSessionWithUserData(); //Re-populate with latest data, to minimize possible use of stale data
		$_SESSION['userData_client']['userSettings'][$_GET['type']] = json_decode($_POST['data'], $assoc = true); 
		$userSettings = json_encode($_SESSION['userData_client']['userSettings']);

		
		global $mysqlConfig;
		$userSettingsBlob_split = str_split($userSettings, $mysqlConfig['max_allowed_packet']);
		$userSettingsBlob = null;
		
		$stmt = self::$mysqli->prepare("UPDATE `users` SET `userSettingsBlob`=? WHERE `id`=?");
		$stmt->bind_param('bi',
			$userSettingsBlob,
			$_SESSION['userId']
		);

		foreach($userSettingsBlob_split as $packet) {
			 $stmt->send_long_data(0, $packet);
		}
		
		$stmt->execute();
		$stmt->close();
		
		self::task_populateSessionWithUserData();
		
		return array(
			"error" => false
		);
	}
	
	/** 
	 * Sends a password reset request email for an email address if it exists in the database. 
	 * 
	 * @return 
	 */
	private static function process_resetPassword() {
		$notFoundError = 'Invalid email address and/or email address not found.';
		self::_initRequestString_post('forgottenPassword_emailAddress');
		$emailAddress = $_POST['forgottenPassword_emailAddress'];
		if (
			!filter_var($emailAddress, FILTER_VALIDATE_EMAIL)
		) {
			return array(
				"error" => true,
				"errorMessages" => array(
					'forgottenPassword_emailAddress' => $notFoundError
				)
			);
		}
		
		
		$stmt = self::$mysqli->prepare("SELECT `id`,`passwordHash` FROM `users` WHERE `emailAddress`=?");
		$stmt->bind_param('s', $emailAddress);
		$stmt->execute();
		$stmt->store_result();
		$stmt->bind_result($userId, $passwordHash);
		$stmt->fetch();
		$resultCount = $stmt->num_rows;
		$stmt->close();
		
		if ($resultCount != 1) {
			return array(
				"error" => true,
				"errorMessages" => array(
					'forgottenPassword_emailAddress' => $notFoundError
				)
			);
		}
		
		$randomToken = md5($userId . $passwordHash . mt_rand());
		
		$stmt = self::$mysqli->prepare("UPDATE `users` SET `passwordResetToken`=? WHERE `id`=?");
		$stmt->bind_param('si',
			$randomToken,
			$userId
		);
		$stmt->execute();
		$stmt->close();
		
		$to = $emailAddress;
		$subject = "Javascript Redstone Simulator - Password Reset Request";
		$body = 
			'A request was entered at http://mordritch.com/mc_rss/ to reset the password for an account created at this email address.' . PHP_EOL .
			PHP_EOL .
			'If you did not request this, you can ignore and delete this email.' . PHP_EOL .
			PHP_EOL .
			'If you do want to reset your password, please use the link below:' . PHP_EOL .
		"";

		$headers = 
			"From: noreply@mordritch.com" . PHP_EOL .
			"Reply-To: noreply@mordritch.com" . PHP_EOL .
		"";

		$body = wordwrap($body, 70);
		$body .= 'http://mordritch.com/passwordreset/?token='. $randomToken;


		if (!mb_send_mail($to, $subject, $body, $headers)) {
			return array(
				"error" => true,
				"errorMessages" => array(
					'forgottenPassword_emailAddress' => "Your email address was found, but due to a technical failure on the web server, it could not send the password reset email."
				)
			);
		}
		else {
			//It's not really an error, but the way the webpage interprets it, it's a feedback message.
			return array(
				"error" => true,
				"errorMessages" => array(
					'forgottenPassword_emailAddress' => "Password reset email sent to " . $emailAddress . "."
				)
			);

			/*
			return array(
				"error" => false,
				"successMessage" => "Password reset email sent to " . $_POST['emailAddress'] . " ."
			);
			*/
		}
		
	}
	
	/**
	 * Called by a logged in user wanting to change their password.
	 * 
	 * @return 
	 */
	private static function process_editPassword() {
		self::_initRequestString_post('oldPassword');
		self::_initRequestString_post('password');
		self::_initRequestString_post('confirmPassword');
		

		
		$error = false;
		$errorMessages = array(); 
		
		if (!isset($_SESSION['userId'])) {
			$error = true;
			$errorMessages['general'] = 'Not logged in.';

			return array(
				"error" => true,
				"errorMessages" => $errorMessages
			);
		}
		
		if (!phpPass::checkPassword($_POST['oldPassword'], $_SESSION['userData_db']['passwordHash'])) {
			$error = true;
			$errorMessages['oldPassword'] = 'Password not the same as old.';
		}
		
		if (mb_strlen($_POST['password']) < self::$minPassLength || mb_strlen($_POST['password']) > self::$maxPassLength) {
			$error = true;
			$errorMessages['password'] = 'Password must be from ' . self::$minPassLength . ' to ' . self::$maxPassLength . ' characters long.';
		}
		
		if ($_POST['password'] != $_POST['confirmPassword']) {
			$error = true;
			$errorMessages['confirmPassword'] = 'Password and confirm password fields do not match.';
		}
		
		if ($error) {
			return array(
				"error" => true,
				"errorMessages" => $errorMessages
			);
		}
		else {
			$passwordHash = phpPass::hashPassword($_POST['password']);
			$passwordResetToken = null;
			
			$stmt = self::$mysqli->prepare(
				"UPDATE `users` SET " .
					"`passwordHash`=?," . 
					"`passwordResetToken`=?" . 
				" WHERE `id`=?"
			);
			$stmt->bind_param('ssi',
				$passwordHash,
				$passwordResetToken,
				$_SESSION['userId']
			);
			$stmt->execute();
			$stmt->close();
			
			self::dbTask_deletePersistantSessions($_SESSION['userId']);
			self::task_populateSessionWithUserData();

			return array(
				'error' => false,
				'successMessage' => 'Password updated.',
				'userData' => $_SESSION['userData_client']
			);
		}
	}
	
	private static function process_editProfile() {
		self::_initRequestString_post('emailAddress');
		self::_initRequestString_post('displayName');
		
		$error = false;
		$errorMessages = array(); 
		
		if (!isset($_SESSION['userId'])) {
			$error = true;
			$errorMessages['general'] = 'Not logged in.';

			return json_encode(array(
				"error" => true,
				"errorMessages" => $errorMessages
			));
		}
		
		if (filter_var($_POST['emailAddress'], FILTER_VALIDATE_EMAIL) == false) {
			$error = true;
			$errorMessages['emailAddress'] = "Invalid email address.";
		}
		
		if (!$error && $_POST['emailAddress'] != $_SESSION['userData_db']['emailAddress']) {
			$stmt = self::$mysqli->prepare("SELECT `id` FROM `users` WHERE emailAddress=?");
			$stmt->bind_param('s', $_POST['emailAddress']);
			$stmt->execute();
			$stmt->store_result(); //necessary for num_rows to populate
			$resultCount = $stmt->num_rows;
			$stmt->close();
			if ($resultCount > 0) {
				$error = true;
				$errorMessages['emailAddress'] = "Account with that email address already exists.";
			}
		}

		if (mb_strlen($_POST['displayName']) < self::$minNameLength || mb_strlen($_POST['displayName']) > self::$maxNameLength) {
			$error = true;
			$errorMessages['displayName'] = 'Length must be from ' . self::$minNameLength . ' to ' . self::$maxNameLength . ' characters long.';
		}
		
		if ($error) {
			return array(
				"error" => true,
				"errorMessages" => $errorMessages
			);
		}
		else {
			$errorMessages['general'] = 'Input is fine, but function not yet implemented.';
			
			if ($_POST['emailAddress'] == $_SESSION['userData_db']['emailAddress']) {
				$stmt = self::$mysqli->prepare("UPDATE `users` SET `displayName`=? WHERE `id`=?");
				$stmt->bind_param('si',
					$_POST['displayName'],
					$_SESSION['userId']
				);
				$stmt->execute();
				$stmt->close();
				
				self::task_populateSessionWithUserData();
			}
			else {
				$emailVerified = 0;
				$passwordResetToken = null;
				
				$stmt = self::$mysqli->prepare(
					"UPDATE `users` SET " .
						"`displayName`=?," .
						"`emailAddress`=?," .
						"`emailVerified`=?," .
						"`passwordResetToken`=?" .
					" WHERE `id`=?"
				);
				$stmt->bind_param('ssisi',
					$_POST['displayName'],
					$_POST['emailAddress'],
					$emailVerified,
					$passwordResetToken,
					$_SESSION['userId']
				);
				$stmt->execute();
				$stmt->close();
				
				
				self::dbTask_deletePersistantSessions($_SESSION['userId']);
				self::task_populateSessionWithUserData();
			}
			

			return array(
				'error' => false,
				'successMessage' => 'Profile updated.',
				'userData' => $_SESSION['userData_client']
			);
		}
	}
	
	/**
	 * Checks if a password reset token exists in the database
	 * 
	 * @return Array specifying validity of token as well as email address and user id if token is valid 
	 */
	public static function pwReset_checkToken($token) {
		self::_init();
		
		$stmt = self::$mysqli->prepare("SELECT `id`,`emailAddress` FROM `users` WHERE `passwordResetToken`=?");
		$stmt->bind_param('s', $token);
		$stmt->execute();
		$stmt->store_result();
		$stmt->bind_result($userId, $emailAddress);
		$stmt->fetch();
		$resultCount = $stmt->num_rows;
		$stmt->close();
		
		if ($resultCount == 1 && strlen($token) > 30) {
			return array(
				"valid" => true,
				"emailAddress" => $emailAddress,
				"token" => $token,
				"userId" => $userId
			);
		}
		else {
			return array(
				"valid" => false
			);
		}
	}
	
	/**
	 * If any aspect of authentication details change, we call this to clear persistant sessions associated with that user ID.
	 * 
	 * @param object $userId
	 * @return 
	 */
	private static function dbTask_deletePersistantSessions($userId) {
		$stmt = self::$mysqli->prepare("DELETE FROM `persistantsessions` WHERE `userid`=?");
		$stmt->bind_param('i',
			$userId
		);
		$stmt->execute();
		$stmt->close();
	}
	
	/**
	 * 3rd part of the password reset process, when the user is promoted to choose a new password.
	 * 
	 * @param object $token
	 * @param object $password
	 * @param object $confirmPassword
	 * @return 
	 */
	public static function pwReset_setNewPassword($token, $password, $confirmPassword) {
		self::_init();
		
		$tokenInfo = self::pwReset_checkToken($token);
		
		if (!$tokenInfo['valid']) {
			return array(
				"error" => true,
				"errorMessage" => "The token submitted is invalid or expired, please initiate a new password reset from the website."
			);
		}
		
		if (mb_strlen($password) < self::$minPassLength || mb_strlen($password) > self::$maxPassLength) {
			return array(
				"error" => true,
				"errorMessage" => "Password must be from " . self::$minPassLength . " to " . self::$maxPassLength . " characters long."
			);
		}
		
		if ($password!= $confirmPassword) {
			return array(
				"error" => true,
				"errorMessage" => "Password and confirm password fields do not match."
			);
		}
		

		$passwordResetToken = "";
		$passwordHash = phpPass::hashPassword($password);

		$stmt = self::$mysqli->prepare("UPDATE `users` SET `passwordResetToken`=?,`passwordHash`=? WHERE `id`=?");
		$stmt->bind_param('sss',
			$passwordResetToken,
			$passwordHash,
			$tokenInfo['userId']
		);
		$stmt->execute();
		$stmt->close();
		
		$userId = $tokenInfo['userId'];
		
		
		$_SESSION['userId'] = $userId;
		self::dbTask_deletePersistantSessions($userId);
		self::task_populateSessionWithUserData();
		self::dbTask_updateLastLogin($userId);

		return array(
			"error" => false,
			"successMessage" => "Your password was updated successfully.",
			"redirectTo" => "http://mordritch.com/mc_rss/"
		);
	}
	
	/**
	 * Claims schematics which were made before user accounts were implemented.
	 * 
	 * @param object $emailAddress
	 * @param object $userId
	 * @return 
	 */
	private static function dbTask_claimSchematicToUserId($emailAddress, $userId) {
		$sqlString = "UPDATE `schematics` SET `userId`=? where `email`=? AND `userId` IS NULL";
		$stmt = self::$mysqli->prepare($sqlString);
		$stmt->bind_param('is',
			$userId,
			$emailAddress
		);
		$stmt->execute();
		$stmt->close();
	}
	
	/**
	 * Will migrate logins from legendary schematic logins.
	 * 
	 * Used before trying to use actual logins, if the schematics table has entries from the email address, and if the password matches one
	 * of them, then it automatically creates an account with those details and the new account adopts all schematics by that same email addres.
	 * 
	 * @param object $emailAddress as in the schematics table
	 * @param object $passwordHash as in the schematics table
	 * @return 
	 */
	private static function dbTask_checkLoginAgainstSchematicData($emailAddress, $password) {
		$sqlString = "SELECT `authorName`,`password` FROM `schematics` WHERE `email`=? AND `userId` IS NULL";
		$stmt = self::$mysqli->prepare($sqlString);
		$stmt->bind_param('s',
			$emailAddress
		);
		$stmt->execute();

		$stmt->bind_result($displayName, $passwordHash);
		
		$foundMatch = false;
		while ($stmt->fetch()) {
			if (phpPass::checkPassword($password, $passwordHash)) {
				$foundMatch = true;
				break;
			}
		}
		$stmt->close();
		
		if ($foundMatch) {
			$userId = self::dbTask_insertUser($emailAddress, $password, $displayName);
			self::dbTask_claimSchematicToUserId($emailAddress, $userId);
		}
	}
	
	/**
	 * Inserts a user account field into the DB and returns the insert_id.
	 * 
	 * @param object $emailAddress (username)
	 * @param object $password (in clear text)
	 * @param object $displayName
	 * @return 
	 */
	private static function dbTask_insertUser($emailAddress, $password, $displayName) {
		self::_init();
		$passwordHash = phpPass::hashPassword($password);
		$stmt = self::$mysqli->prepare("INSERT INTO `users` SET `emailAddress`=?,`displayName`=?,`passwordHash`=?");

		/*
		Can be used for debugging:
		if ( false===$stmt ) die('prepare() failed: ' . htmlspecialchars(self::$mysqli->error));
		*/

		$stmt->bind_param('sss',
			$emailAddress,
			$displayName,
			$passwordHash
		);

		$stmt->execute();
		$insertId = $stmt->insert_id;
		$stmt->close();
		
		return $insertId;
	}
	
	private static function get_schematicListForLoggedInUser() {
		self::_init();
		if (!isset($_SESSION['userId'])) {
			return array(
				'error' => true,
				'errorMessage' => 'Not logged in.'
			);
		}
		
		$stmt = self::$mysqli->prepare("
			SELECT 
				`id`,
				`filename`,
				`fileSize`,
				`title`,
				`description`,
				`firstCreated`,
				`lastModified`
			FROM
				`schematics`
			WHERE
				`userId`=?
		");
		$stmt->bind_param('i',
			$_SESSION['userId']
		);
		$stmt->execute();

		$stmt->bind_result(
			$id,
			$filename,
			$fileSize,
			$title,
			$description,
			$firstCreated,
			$lastModified
		);
		
		$foundMatch = false;
		$resultArray = array();
		while ($stmt->fetch()) {
			$resultArray[] = array(
				'id' => $id,
				'filename' => htmlspecialchars($filename),
				'fileSize' => $fileSize,
				'title' => htmlspecialchars($title),
				'description' => htmlspecialchars($description),
				'firstCreated' => $firstCreated,
				'lastModified' => $lastModified
			);			
		}
		$stmt->close();
		return array(
			'error' => false,
			'schematicList' => $resultArray
		);
		
	}
}
?>