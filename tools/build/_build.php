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
switch (php_sapi_name()) {
	case 'cli':
	{
		echo file_get_contents('http://localhost:8088/tools/build/_build.php');
		break;
	}
	default:
	{
		ini_set('html_errors', 'false');
		if (function_exists('xdebug_disable')) {
			//Disables stack traces
			//Disable showing stack traces on error conditions.
			xdebug_disable();
		}

		include 'class_projectBuilder.php';
		$root = $_SERVER['DOCUMENT_ROOT'];
		
		$projectBuilder = new projectBuilder("$root/tools/build");
		$projectBuilder->generateLocalizationFiles();
		$projectBuilder->concatenateJsFiles();
		$projectBuilder->minifyJsFile();
		$projectBuilder->copyPhpFiles();
		$projectBuilder->copyImages();
		$projectBuilder->copyJsLibs();
		$projectBuilder->copyCss();
		break;
	}
}