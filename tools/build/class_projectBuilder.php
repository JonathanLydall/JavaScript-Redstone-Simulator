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

include_once $_SERVER['DOCUMENT_ROOT'].'/php/includes/class_localization.php';

class projectBuilder {
	private $buildFolder;
	private $sourcesJs = 'sources.js.txt';
	private $sourcesPhp = 'sources.php.txt';
	private $tempJsFileName = 'js.tmp';
	private $tempFolderName = 'temp';
	private $artifactsFolderName = 'artifacts';
	
	public function __construct($buildFolder) {
		if (!isset($buildFolder) || $buildFolder == null || $buildFolder == '')
			throw new Exception('$buildFolder is mandatory.');

		$this->buildFolder = $buildFolder;
		$this->clearFolder("$this->buildFolder/$this->tempFolderName");
		$this->clearFolder("$this->buildFolder/$this->artifactsFolderName");
	}

	private function log($string) {
		echo "$string\r\n";
	}

	private function clearFolder($dir) {
		if (file_exists($dir)) {
			$this->log("Clearing $dir");
			$this->delTree($dir);
		}

		mkdir($dir);
	}

	private function normalizePath($path) {
		if (DIRECTORY_SEPARATOR == '/') {
			$path = str_replace('\\', DIRECTORY_SEPARATOR, $path);
		}
		else {
			$path = str_replace('\\', DIRECTORY_SEPARATOR, $path);
		}

		while (strpos($path, DIRECTORY_SEPARATOR.DIRECTORY_SEPARATOR)) {
			$path = str_replace(DIRECTORY_SEPARATOR.DIRECTORY_SEPARATOR, DIRECTORY_SEPARATOR, $path);
		}

		return $path;
	}

	// https://stackoverflow.com/a/14531691/706555
	private function delTree($dir) {
        $files = array_diff(scandir($dir), array('.', '..')); 

        foreach ($files as $file) { 
            (is_dir("$dir/$file")) ? $this->delTree("$dir/$file") : unlink("$dir/$file"); 
        }

        return rmdir($dir); 
	}

	// https://stackoverflow.com/a/2050909/706555
	private function recurse_copy($src, $dst) { 
		$dir = opendir($src); 
		@mkdir($dst); 
		while(false !== ( $file = readdir($dir)) ) { 
			if (( $file != '.' ) && ( $file != '..' )) { 
				if ( is_dir($src . '/' . $file) ) { 
					$this->recurse_copy($src . '/' . $file,$dst . '/' . $file); 
				} 
				else {
					$this->log('Copying '.$src . '/' . $file,$dst . '/' . $file);
					copy($src . '/' . $file,$dst . '/' . $file); 
				} 
			} 
		} 
		closedir($dir); 
	} 	
	
	public function generateLocalizationFiles() {
		$localesPath = "$this->buildFolder/$this->artifactsFolderName/locales";
		if (!file_exists($localesPath)) {
			mkdir($localesPath);
		}

		foreach (localization::getLanguageList() as $languageCode => $languageName) {
			$file_jsFile = "$localesPath/$languageCode.js";
			$this->log("Writing $file_jsFile to disk.");
			file_put_contents($file_jsFile, "localizationStrings = ".json_encode(localization::getLanguageStrings($languageCode), JSON_FORCE_OBJECT).";");
		};
	}

	public function copyPhpFiles() {
		$lines = file("$this->buildFolder/$this->sourcesPhp", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
		foreach ($lines as $line) {
			//Ignore lines beginning with a semicolon as these are comments
			if (substr($line, 0, 1) == ';') {
				continue;
			}

			$pathParts = explode(DIRECTORY_SEPARATOR, $this->normalizePath(dirname($line)));
			$currentDir = "";
			foreach ($pathParts as $part) {
				if ($part == "") {
					break;
				}

				$currentDir .= DIRECTORY_SEPARATOR.$part;
				@mkdir("$this->buildFolder/$this->artifactsFolderName/$currentDir");
			}

			$this->log("Copying PHP file $line.");
			copy("$this->buildFolder/../../$line", "$this->buildFolder/$this->artifactsFolderName/$line");
		}
	}

	public function concatenateJsFiles() {
		$concatenatedContent = "";
		$lines = file("$this->buildFolder/$this->sourcesJs", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
		foreach ($lines as $line) {

			//Ignore lines beginning with a semicolon as these are comments
			if (substr($line, 0, 1) == ';') {
				continue;
			}

			$this->log("Reading JavaScript source file $line.");
			$concatenatedContent .= file_get_contents($line).PHP_EOL;
		}

		$concatenatedFileName = "$this->buildFolder/$this->tempFolderName/$this->tempJsFileName";
		$this->log("Writing $concatenatedFileName");
		file_put_contents($concatenatedFileName, $concatenatedContent);
	}

	public function minifyJsFile() {
		$jarFile = "$this->buildFolder/yuicompressor-2.4.7.jar";
		$inputFile = "$this->buildFolder/$this->tempFolderName/$this->tempJsFileName";
		$outputFile = "$this->buildFolder/$this->artifactsFolderName/js/mc_rss.min.js";
		$command = "java -jar \"$jarFile\" \"$inputFile\" -o \"$outputFile\" --type js";

		if (!file_exists(dirname($outputFile))) {
			mkdir(dirname($outputFile));
		}
		
		$this->log("Running minifier: $command");
		passthru("$command 2>&1", $result); // We don't see any output unless 2>&1 is on the end, it remaps stderr to stdout, or something like that

		if ($result != 0) {
			throw new Exception("An error occurred running the minifier. Ensure Java is installed or otherwise review the output above.");
		}

		$this->log("Minifier run complete.");
	}

	public function copyCss() {
		$srcFolder = "$this->buildFolder/../../css";
		$dstFolder = "$this->buildFolder/$this->artifactsFolderName/css";

		$this->recurse_copy($srcFolder, $dstFolder);
	}

	public function copyImages() {
		$srcFolder = "$this->buildFolder/../../images";
		$dstFolder = "$this->buildFolder/$this->artifactsFolderName/images";

		$this->recurse_copy($srcFolder, $dstFolder);
	}

	public function copyJsLibs() {
		$srcFolder = "$this->buildFolder/../../js";
		$dstFolder = "$this->buildFolder/$this->artifactsFolderName/js";

		$this->recurse_copy($srcFolder, $dstFolder);
	}
}
?>