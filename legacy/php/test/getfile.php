<?php
//year=2012&month=1&day=1&hour=1&quality=lo

error_reporting(0);

$ip = $_SERVER['REMOTE_ADDR'];
//if ($ip != "128.2.97.61")
//  exit;

$date = $_GET['date'];
$arr = explode("-",$date);
$year = $arr[0];
$month = $arr[1];
$day = $arr[2];
$hour = $arr[3];
$quality = $arr[4];

$file = "/raid/htdocs/logs/$year/$month/$day/wrct-log_$quality-$year-$month-$day"."_"."$hour.mp3";
//$file = "/raid/htdocs/logs/2012/01/01/wrct-log_lo-2012-01-01"."_"."00.mp3";

if (file_exists($file)) {
    header('Content-Description: File Transfer');
    header('Content-Type: audio/mpeg');
    header('Content-Disposition: attachment; filename='.basename($file));
    header('Content-Transfer-Encoding: binary');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($file));
    ob_clean();
    flush();
    readfile($file);
    exit;
}
?>

