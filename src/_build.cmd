@echo off
setlocal
cls
set projectPath=D:\Users\Jonathan Lydall\Documents\Aptana Studio 3 Workspace\mc_rss
set jsFileList_Relative=src\_fileList.txt
set jsTempFile_Relative=src\_build.temp
set jsDestFile_Relative=release\mc_rss-min.js
set buildNumberFile_Relative=release\mc_rss-min.js_build#
set javaBin="C:\Program Files\Java\jre7\bin\java.exe"
set yuiJarFile="D:\Utils\YUIC\build\yuicompressor-2.4.6.jar"
set phpProjectBuilderUrl="http://localhost/projects3/mc_rss/src/"
set phpProjectBuilderRelativeReleasePath="/../release/"
set phpCliPath="C:\Program Files (x86)\PHP\php-5.3.6-Win32-VC9-x86\php.exe"

set jsFileList="%projectPath%\%jsFileList_Relative%"
set jsTempFile="%projectPath%\%jsTempFile_Relative%"
set jsDestFile="%projectPath%\%jsDestFile_Relative%"
set buildNumberFile="%projectPath%\%buildNumberFile_Relative%"

set /p buildNumber=< %buildNumberFile%
set /a buildNumber=buildNumber+1
echo %buildNumber% > %buildNumberFile%

echo Build Number: %buildNumber%
echo ProjectPath set to "%projectPath%\".
echo Building localization files...
%phpCliPath% -n -f "%projectPath%\src\_build.php" buildLocalizationFiles %phpProjectBuilderUrl% %phpProjectBuilderRelativeReleasePath%
echo Deleting old temporary file...
del %jsTempFile%
echo Merging the following files into temporary file "\%jsTempFile_Relative%":
for /F "usebackq eol=;" %%i in (%jsFileList%) do (
	echo ; >> %jsTempFile%
	type "%projectPath%\%%i" >> %jsTempFile%
	echo   %%i...
)
echo Running YUI minifier to output file "\%jsDestFile_Relative%"...
%javaBin% -jar %yuiJarFile% %jsTempFile% -o %jsDestFile% --type js
echo End of batch file.
pause