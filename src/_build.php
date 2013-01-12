<?php
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