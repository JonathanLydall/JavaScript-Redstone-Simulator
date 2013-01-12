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

header('Content-type: application/json; charset=UTF-8');
include_once 'includes/utf8_handling.php';
include_once 'includes/class_localization.php';
ob_start("ob_gzhandler");


if (!isset($_REQUEST["task"])) {
	$get_task = "getList";
}
else
{
	$get_task = $_REQUEST["task"];
}

switch ($get_task) {
	case "getLang":
		if (!isset($_REQUEST["lang"]))
		{
			$lang = "en_US";
		}
		else {
			$lang = $_REQUEST["lang"];
		}
		
		echo json_encode(localization::getLanguageStrings($lang));
		break;
	default:
		echo json_encode(localization::getLanguageList());
		break;
}
?>