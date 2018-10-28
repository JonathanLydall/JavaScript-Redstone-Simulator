<?php

// Copied and adapted from http://php.net/manual/en/features.commandline.webserver.php#122171

$indexFiles = ['index.html', 'index.php'];

$requestedAbsoluteFile = dirname(__FILE__) . $_SERVER['SCRIPT_NAME'];

// Replicate the URL rewrite rule we have on production:
if (preg_match('/^\/([0-9]+)/', $_SERVER['REQUEST_URI'], $matches))
{
  $_GET['id'] = $matches[1];
}

// if request is a directory call check if index files exist
if (is_dir($requestedAbsoluteFile))
{
  foreach ($indexFiles as $filename)
  {
    $fn = $requestedAbsoluteFile.'/'.$filename;
    if (is_file($fn))
    {
      $requestedAbsoluteFile = $fn;
      break;
    }
  }
}

// if requested file does not exist or is directory => 404
if (!is_file($requestedAbsoluteFile))
{
  header($_SERVER['SERVER_PROTOCOL'].' 404 Not Found');
  printf('"%s" does not exist', $_SERVER['SCRIPT_NAME']);
  return true;
}

// if requested file is'nt a php file
if (!preg_match('/\.php$/', $requestedAbsoluteFile)) {
  $type = pathinfo($requestedAbsoluteFile, PATHINFO_EXTENSION);
  switch ($type) {
      case "css":
          header('Content-Type: text/css');
          break;
      default:
          header('Content-Type: '.mime_content_type($requestedAbsoluteFile));
          break;
  }
  $fh = fopen($requestedAbsoluteFile, 'r');
  fpassthru($fh);
  fclose($fh);
  return true;
}

// if requested file is php, include it
include_once $requestedAbsoluteFile;