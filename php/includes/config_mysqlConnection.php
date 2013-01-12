<?php
if (!(strpos($_SERVER['HTTP_HOST'], 'mordritch.com') === false)) {
	include('config_mysqlConnection_live.php');
}
else {
	$mysqlConfig = array(
		"host" => "localhost",
		"username" => "mc_rss",
		"password" => "mc_rss",
		"schema" => "mordritc_mcrss",
		"max_allowed_packet" => 1048576 //Use the following SQL query to retrieve: SHOW VARIABLES LIKE  'max_allowed_packet'
	);
}
?>