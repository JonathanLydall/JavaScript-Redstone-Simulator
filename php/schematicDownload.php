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

include 'includes/class_schematicRetrieval.php';

$id = (isset($_GET["id"])) ? $_GET["id"] : -1;
$fileMetadata = schematicRetrieval::getMetadata($id);

if ($fileMetadata['error']) {
	$error = true;
	$errorText = $fileMetadata['errorDescription'];
}
else {
	$error = false;
	$fileContents = schematicRetrieval::getFile($id);
	$fileSize = strval(strlen($fileContents));
	$fileName = $fileMetadata['fileName'];
	
	header('Content-Description: File Transfer');
	header('Content-Type: application/octet-stream');
	header('Content-Disposition: attachment; filename=' . $fileName . '.schematic');
	header('Content-Transfer-Encoding: binary');
	header('Expires: 0');
	header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
	header('Pragma: public');
	header('Content-Length: ' . $fileSize);
	
	echo $fileContents;
}
?>