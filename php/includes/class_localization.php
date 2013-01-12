<?php
define('ROOT', substr(__FILE__, 0, strlen(__FILE__) - strlen('/php/includes/class_localization.php')));

class localization {
	private static $languages = array();
	private static $isInitialized = false;
	
	private static function _init() {
		if (self::$isInitialized) {
			return;
		}	
		else {
			self::$isInitialized = true;
		}
		
		$languagesFile = file(ROOT.'/php/resources/minecraft/lang/languages.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
		$output = array();
		foreach ($languagesFile as $languageLine)
		{
			$langArray = mb_split("=", $languageLine);
			self::$languages[$langArray[0]] = $langArray[1];
		}
	}
	
	public static function getLanguageList() {
		self::_init();
		return self::$languages;
	}

	public static function getLanguageStrings($lang = "en_US") {
		self::_init();

		if (!isset(self::$languages[$lang])) {
			return array(
				"error" => true,
				"errorDescription" => "No such language."
			);
		}
		
		if(!file_exists(ROOT."/php/resources/minecraft/lang/$lang.lang")) {
			return array(
				"error" => true,
				"errorDescription" => "Language file missing from web server."
			);
		}
		
		$languageFileLines = file(ROOT."/php/resources/minecraft/lang/$lang.lang", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
		$minecraftBlockNames = array();
		$languageDetails = array();
		
		for ($i=0;$i<count($languageFileLines); $i++) {
			$line = $languageFileLines[$i];
			
			if ($line[0] == "#") continue; //If the line begins with a "#" it's a comment and should be ignored.
				
			$splitByEqualsSign = mb_split("=", $line);
			$categories = mb_split("\.", $splitByEqualsSign[0]);
			
			$translatedText = $splitByEqualsSign[1];
			
			if($categories[0] == "tile" && $categories[count($categories)-1] == "name")
			{
				$minecraftBlockNames[$splitByEqualsSign[0]] = $translatedText;
			}
			elseif ($categories[0] == "language")
			{
				$languageDetails[$categories[1]] = $translatedText;
			}
		}

		/*
		 * Check to see if a locale file exists which contains translations for the website app:
		 * 
		 * TODO: Make this run out of a database which people can easily contribute to
		 */
		$defaultLanguageAppStrings_unkeyed = file(ROOT."/php/resources/locales/en_US.txt", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
		foreach($defaultLanguageAppStrings_unkeyed as $line)
		{
			if ($line[0] == "#") continue; //Skip commented lines (beginning with #)
				$stringName = substr($line, 0, strpos($line, "="));
				$stringContent = substr($line, strpos($line, "=") + 1);
				$defaultLanguageAppStrings[$stringName] = $stringContent;
				//$line_split = mb_split("=", $line);
				//$defaultLanguageAppStrings[$line_split[0]] = $line_split[1];
		}
		
		$localizedCount = 0;
		if(!file_exists(ROOT."/php/resources/locales/$lang.txt"))
		{
			$localizedAppStrings = $defaultLanguageAppStrings;
		}
		else {
			$localizedAppStrings_unKeyed = file(ROOT."/php/resources/locales/$lang.txt", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
			$localizedAppStrings = array();
			foreach($localizedAppStrings_unKeyed as $line)
			{
				if ($line[0] == "#") continue; //Skip commented lines (beginning with #)
				$stringName = substr($line, 0, strpos($line, "="));
				$stringContent = substr($line, strpos($line, "=") + 1);
				$localizedAppStrings[$stringName] = $stringContent;
				
				//$line_split = mb_split("=", $line);
				//$localizedAppStrings[$line_split[0]] = $line_split[1];
			}
			
			//And finally, let's fill any missing keys in our localized, with the values from the default:
			foreach($defaultLanguageAppStrings as $stringName => $stringValue)
			{
				if (!isset($localizedAppStrings[$stringName])) {
					$localizedAppStrings[$stringName] = $stringValue;
				}
				else {
					$localizedCount++;
				}
			}
		}
		$languageDetails["stringCount"] = count($defaultLanguageAppStrings);
		$languageDetails["localizedCount"] = $localizedCount;
		
		//var_dump($minecraftBlockNames);
		//var_dump($languageDetails);
		//var_dump($localizedAppStrings);
		return array(
			"error" => false,
			"languageDetails" => $languageDetails,
			"minecraftTileNameStrings" => $minecraftBlockNames,
			"applicationStrings" => $localizedAppStrings
		);
	}
}
?>