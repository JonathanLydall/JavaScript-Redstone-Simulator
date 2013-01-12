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

// If magic quotes are enabled, strip slashes from all user data (thanks: http://snippets.dzone.com/posts/show/324)
function stripslashes_recursive($var) {
	return (is_array($var) ? array_map('stripslashes_recursive', $var) : stripslashes($var));
}

if (get_magic_quotes_gpc()) {
	$_GET = stripslashes_recursive($_GET);
	$_POST = stripslashes_recursive($_POST);
	$_COOKIE = stripslashes_recursive($_COOKIE);
}
?>