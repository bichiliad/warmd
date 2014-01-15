<?PHP

//////////////////////////////////////////////////////////////////////////
// First: this is an edited version for use on the popup player
//  -cfperron 9/22/11
//
// YO. So you're here because you're either really nosy...or because 
// something broke. Bummer dude. Well here's the general idea:
// 1.  First we check to see if we're on automation because that supercedes
//     any other possible state. To do that a cron job runs a shell script
//     that wgets a php file from the burk switching computer (currently 
//     heaviside - used to be armstrong) and checks its contents to see
//     if we're on automation.
// 1a. If we are then we parse the automation log (which is scp'ed from
//     nfap every minute by a cron job on nfap for the automation log) to
//     find the last song in the log file. This is displayed -> we're done.
// 2.  Otherwise a room is on. So next we check to see if there's a playlist
//     created during this timeslot. This requires access to the database
//     via mysql. If a playlist exists then display the name of that program
//     as well as a link to "view the current playlist".
// 3.  What if there's no playlist but we're not on automation?? Glad you asked...
//     This sounds like practically all PA shows. Therefore we'll scavenge
//     the Programs table for the program that exists during this timeslot.
//     This actually was a little complicated because dates aren't very pretty
//     in PHP and you have to take weird cases into consideration such as
//     programs wrapping around days and such. Regardless, I think it works.
// 4.  Finally, what if we're not on automation and there's no current playlist
//     for this time AND there's no program listed - well then some nice
//     person (probably jjfernan) is covering dead air! This will be duely
//     noted by a friendly comment (which can be found near the bottom).
// 4a. The only other kinda strange case is if someone is filling scheduled
//     dead air and creates a playlist (as they should). It will therefore
//     be assigned a special ProgramID which will display "Random Schedule"
//     unless a comment is specified - then it'll display that instead.
//
// Written by cfperron on 03/06/2011
//////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////
// THESE SHOULD BE THE ONLY VALUES THAT NEED CHANGING
//constants
$STATUSPATH = "/home/wrct/autolog/auto.php";
$AUTOLOGPATH = "/home/wrct/autolog/automation";
$AUTOSTRON = "Automation is on";
//$PGRMURL = "http://db.wrct.org/display.cgi?tbl=Program&amp;ProgramID=";
$PGRMURL = "http://www.wrct.org/show/";
//$PLSTURL = "http://db.wrct.org/playlist.cgi?id=";
$PLSTURL = "http://www.wrct.org/playlist/";
$RNDID = 137;
$NOSONGNAME = "-unknown-";

//mysql params
$mysqlhost = "localhost";
$mysqluser = "www";
$mysqlpass = "fuckyou";
////////////////////////////////////////////////////////

//open up the file that indicates automation status
$handle = fopen($STATUSPATH, "r");
$value = fread($handle, 100);
fclose($handle);

$getdbinfo = 1;

//if automation is on, display the current automated track
if ($value == $AUTOSTRON){
	$trackname = "";

	$lines = file($AUTOLOGPATH);

	//iterate through every line from the bottom up
	for ($i = count($lines); $i >= 0; $i--){
		$line = $lines[$i];

		if (substr($line, 16, 52) == 'nfap automation: DEBUG - In do_action for play_files'){
			$getdbinfo = 1;
			break;
		}
		
		if (substr($line, 16, 36) != 'nfap automation: INFO - Next track: ')
			continue;

		$trackname = str_replace("\r\n", "", substr($line, 52, strlen($line)-53));
		$getdbinfo = 0;
		break; //once we find a track, break out
	}

}
if (!$getdbinfo){
	//if for some reason it has no value 'cause some old tracks have no ID3 tags :-(
	if ($trackname == "")
		$trackname = $NOSONGNAME;

	//echo "The currently automated song is:<br />".$trackname;
	echo utf8_encode($trackname);
}

if ($getdbinfo){
	//otherwise we have to calculate who's supposed to be on
	//and if there's a current playlist or not

	$link = mysql_connect($mysqlhost, $mysqluser, $mysqlpass);
	if (!$link)
		die("mysql error: ".mysql_error());

	mysql_select_db('wrct', $link);

	$sqlquery = "SELECT `PlayListID`, `ProgramID`, `Comment`, (SELECT `Program` FROM `Programs` WHERE `Programs`.`ProgramID`=`PlayLists`.`ProgramID`) ProgName FROM `PlayLists` WHERE `StartTime` < 
NOW() AND `EndTime` > NOW() ORDER BY `PlayListID` DESC LIMIT 1";
	$sqlresult = mysql_query($sqlquery, $link);

	//echo "The current program is:<br />";

	//if a playlist exists at this time - show that playlist
	if (mysql_num_rows($sqlresult) > 0){
		$sqlrow = mysql_fetch_assoc($sqlresult);
		if ($sqlrow["ProgramID"] == $RNDID){
			if ($sqlrow["Comment"] != null) {
				//echo $sqlrow["Comment"]."<br />";
				echo "";
			}
		}
		else{
	 		echo "<div id='np_show'><a href=\"".$PGRMURL.$sqlrow["ProgramID"]."\" target='_blank'>";
			echo utf8_encodE($sqlrow["ProgName"]);
			echo "</a></div><div id='np_hspace'> </div>";
		}
		echo "<div id='np_playlist'><a href=\"".$PLSTURL.$sqlrow["PlayListID"]."\" target='_blank'>";
		echo "Playlist</a></div>";
	}
	else{
	//otherwise if a show is supposed to be on show the name of that show
	//this is the case for almost all PA shows

		//get all the current programs
		$sqlquery = "SELECT * FROM `Programs` WHERE (`EndTime`-`StartTime`) > 0";
		$sqlresult = mysql_query($sqlquery, $link);

		$nowt = getdate(time()-(60*60*0));
		$program = null;
		while($sqlrow2 = mysql_fetch_assoc($sqlresult)){
			$frmt = "Y-m-d H:i:s";
			$startt = getdate(strtotime($sqlrow2["StartTime"]));
			$endt = getdate(strtotime($sqlrow2["EndTime"]));

			//echo $sqlrow2["Program"].":".$startt["wday"]."|".$endt["wday"]."<br />";

			//if it doesn't cross days then it's an easy calculation
			if ($startt["wday"] == $endt["wday"]){
				if ($startt["wday"] != $nowt["wday"])
					continue;
				if ($startt["hours"] <= $nowt["hours"] && $endt["hours"] > $nowt["hours"])
					$program = $sqlrow2;
				else
					continue;
				break;
			}
			else{
				//if were in the first half
				if ($startt["wday"] == $nowt["wday"] && $startt["hours"] <= $nowt["hours"]){
					$program = $sqlrow2;
					break;
				}
				if ($endt["wday"] == $nowt["wday"] && $endt["hours"] > $nowt["hours"]){
					$program = $sqlrow2;
					break;
				}
				continue;
			}
		}
		
		//so if nothing was found then a DJ is on during dead air and didn't create a playlist
		if ($program == null)
			echo "A DJ filling dead air!";
		else{
			echo "<div id='np_show'><a href=\"".$PGRMURL.$program["ProgramID"]."\" target='_blank'>";
			echo utf8_encode($program["Program"]);
			echo "</a></div>";
		}

	}

	mysql_close($link);
}


?>