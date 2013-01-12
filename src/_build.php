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


/**
 * PHP CLI doesn't have as many functions available as PHP does when running in CGI so
 * we make the CLI part a mere proxy to a web service. 
 */
$task = (isset($argv[1])) ? $argv[1] : "";
$url = (isset($argv[2])) ? $argv[2] : "";
$releasePath = (isset($argv[3])) ? $argv[3] : "";

if (php_sapi_name() == "cli" && (
	$url == "" ||
	$task == "" ||
	$releasePath == "")
	) {
	echo "Please specify a task, url and releasePath. Example usage: _build.php doLocalization http://localhost/development/mc_rss/src/ /../release/";
	exit;
}

if (php_sapi_name() == "cli") {
	echo file_get_contents($url."_build.php?task=".$task."&releasePath=".urlencode($releasePath));
	exit;
}

/**
 * Server side code below:
 */

include '../php/includes/class_projectBuilder.php';
$projectBuilder = new projectBuilder(realpath(getcwd() . $_GET['releasePath']));

switch ((isset($_GET['task'])) ? $_GET['task'] : "") {
	case "buildLocalizationFiles":
		$projectBuilder->generateLocalizationFiles();
		break;
	default: echo "Unknown task: \"$task\"";
}
?>