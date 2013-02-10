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

include_once 'class_localization.php';

class projectBuilder {
	private $outputPath;
	
	public function __construct($outputPath = null) {
		if (is_null($outputPath)) {
			throw new Exception("outputpath must be defined", 1);
		}
		else {
			$this->outputPath = $outputPath;
		}
	}
	
	public function generateLocalizationFiles() {
		foreach (localization::getLanguageList() as $languageCode => $languageName) {
			$file_jsFile = $this->outputPath."/locals/".$languageCode.".js";
			$file_buildNumber = $file_jsFile."_build#";
			
			$newContents = "localizationStrings = ".json_encode(localization::getLanguageStrings($languageCode), JSON_FORCE_OBJECT).";";

			$md5_existing = (file_exists($file_jsFile)) ? md5_file($file_jsFile) : false;
			$buildNumber = (file_exists($file_buildNumber)) ? file_get_contents($file_buildNumber) : 1;

			if ($md5_existing != md5($newContents) || !file_exists($file_jsFile)) {
				file_put_contents($file_buildNumber, ++$buildNumber);
				file_put_contents($file_jsFile, $newContents);
				echo "  Wrote new $languageCode to disk.".PHP_EOL;
			}
			else {
				echo "  Skipped $languageCode as content is unchanged.".PHP_EOL;
			}
		};
	}
	
	
}
?>