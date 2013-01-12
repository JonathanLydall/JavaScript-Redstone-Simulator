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