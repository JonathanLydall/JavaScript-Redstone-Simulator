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

class emailHelper
{
	private $attachments = "";
	private $body = "";
	private $randomHash = "";
	private $subject = "";
	private $to = "jonathan.lydall+mcrss@gmail.com";
	private $from = "noreply@mordritch.com";
	
	function __construct()
	{
		$this->randomHash = $this->getRandomHash();
	}
	
	public function addAttachment($fileContents, $fileName, $fileType)
	{
		$base64EncodedFileContents = base64_encode($fileContents);
		
		$this->attachments .=
			"--" . $this->randomHash . PHP_EOL .
			"Content-Type: $fileType; name=\"$fileName\"" . PHP_EOL .
			"Content-Transfer-Encoding: base64" . PHP_EOL .
			"Content-Disposition: attachment; filename=\"$fileName\"" . PHP_EOL .
			PHP_EOL .
			wordwrap($base64EncodedFileContents, 70, PHP_EOL, true) . PHP_EOL .
		"";
	}
	
	public function appendToBody($text)
	{
		$this->body .= $text;
	}
	
	public function setSubject($text)
	{
		$this->subject = $text;
	}
	
	public function send()
	{
		$message =
			"--" . $this->randomHash . PHP_EOL .
			"Content-Type: text/plain; charset=ISO-8859-1" . PHP_EOL .
			PHP_EOL .
			wordwrap($this->body, 70) .
			PHP_EOL .
			$this->attachments .
			"--" . $this->randomHash . "--";
		
		return mail(
			$this->to,
			$this->subject,
			$message,
			$this->getHeaders());
	}

	private function getRandomHash()
	{
		date_default_timezone_set("utc");
		return md5(date("Y-m-d H:i:s"));
	}
	
	private function getHeaders()
	{
		return 
			"From: " . $this->from . PHP_EOL .
			"Reply-To: " . $this->from . PHP_EOL .
			"Content-Type: multipart/mixed; boundary=\"".$this->randomHash."\"" . PHP_EOL .
		"";
	}
}
?>