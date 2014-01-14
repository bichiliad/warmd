#!/usr/bin/perl

# Scheduling page -- displays a week calendar schedule of programs
# --
# changes made in a fork by ams1@wrct.org in april 2009 have been
# backported by WRCT ghost widdowson@gmail.com in september 2012.
# also, widdowson added dead air compression. #wrctforever
# --

use lib "$ENV{WWW_SITE}/perl-lib";
use lib "$ENV{WWW_SITE}/perl-lib/tables";
require "sql.pl";
require "interface.pl";
require "record.pl";
require 'login.pl';
require 'search.pl';
require 'misc.pl';
require 'task.pl';
require 'calendar.pl';

require 'program.pl';
$tbl = &TblInit;
push @{$$tbl{order}};

use CGI;
my($cgi) = new CGI;
my $params = $cgi->Vars;
my $sortby = ($$params{sortby} or 'GenreID,Artists.ShortName');

$user = &loginSession($$params{session});
&printHead({name=>'Schedule'}, $cgi, $user) unless $$params{wordpress};

#&printTaskSelect($cgi, $user, 'bin');

# can the user edit the schedule?
$edit = &AuthGTE($$user{AuthLevel}, 'Exec');

my $schedule = &calendarGen($tbl, $$params{debug});

# simple version, just displays info in each cell

if ($$params{wordpress}) {
print <<DONE;

<table id="schedule"> 
  <tr>
    <th></th>
    <th>Sunday</th>
    <th>Monday</th>
    <th>Tuesday</th>
    <th>Wednesday</th>
    <th>Thursday</th>
    <th>Friday</th>
    <th>Saturday</th>
    <th></th>
  </tr>
DONE
} else {
print <<DONE;

<table border="1" cellspacing="0">
  <tr>
    <th>&nbsp;</th>
    <th>Sunday</th>
    <th>Monday</th>
    <th>Tuesday</th>
    <th>Wednesday</th>
    <th>Thursday</th>
    <th>Friday</th>
    <th>Saturday</th>
    <th>&nbsp;</th>
  </tr>
DONE
}

for ($hour=0; $hour <= 23.5; $hour += 0.5) {

  # check if this timeslot is dead air across all days. If so, check subsequent
  # timeslots and collapse. move $hour forward until it is no longer in dead air
  $allDead = 1;
  $rowSkips = 0;
  $newhr = $hour;
  do {
    for $day (0..6) {
      my $slot = $schedule->[$day]->{$newhr};
      if ($$slot{Type} ne 'dead') {
        $allDead = 0;
        break;
      }
    }
    if ($allDead) {
      $newhr += 0.5;
      $rowSkips += 1;
    }
  } while ($allDead);
  
  if ($rowSkips > 0) {
    print "  <tr align=\"center\">\n    <th rowspan=$rowSkips>...</th>\n";
  } else {
  
    # make a pretty-print hour
    $dispHour = ($hour%12 ? $hour%12 : 12) .
        (int($hour) == $hour ? ":00" : ":30") . ($hour < 12 ? 'AM' : 'PM');
    if ($$params{wordpress}) {
      print "  <tr>\n    <th class=\"hour\">$dispHour</th>\n";
    } else {
      print "  <tr align=\"center\">\n    <th>$dispHour</th>\n";
    }
  }
  
  foreach $day (0..6) {
    my $slot = $schedule->[$day]->{$hour};

    # in order to use rowspans, we can't print 2nd, 3rd, etc. instances of a slot
    if ($hour == 0 or #$$slot{Type} eq 'dead' or
	$$slot{ProgramID} ne $schedule->[$day]->{$hour-0.5}->{ProgramID}) {

      my $duration, $dow, $icon, $title;
      if ($$slot{StartTime}) { # slot comes from database (show or pa)

	$$slot{StartTime} =~ /^(\d{4})-(\d\d)-(\d\d) (\d\d)/;
	$dow = &DOW($1, $2, $3); # get the day of week that the show starts
	$duration = $$slot{Duration} # the total duration
	    # account for day wrapovers by subtracting the start hour from the current hour:
	    - ($day*24+$hour - ($dow*24+$4))
	    # and account for week wrapovers by using the modulo:
	    % (7*24);
	# this is the duration of the first half of a show that spans days
	$duration = 24-$hour if $duration > 24-$hour;

	$icon = "<a href=\"delete.cgi?session=$$params{session}&amp;tbl=Program&amp;ProgramID=$$slot{ProgramID}\">". &img('trash'). '</a>' if $edit;
	if ($$params{wordpress}) {
	$title = "<a class=\"showname\" href=\"http://www.wrct.org/show/$$slot{ProgramID}\">$$slot{Program}</a>";
	} else {
	$title = "<a href=\"display.cgi?session=$$params{session}&amp;tbl=Program&amp;ProgramID=$$slot{ProgramID}\">$$slot{Program}</a>";
	}
      # we need to insert genre lists here once they get entered into the db
	my ($genres, $gcount) = &sqlSelectMany({table=>'ProgramGenres'}, ['SubGenreID', 'ProgramGenre'],
				    {string=>'ProgramID = ?', values=>[$$slot{ProgramID}]},
				    'ProgramGenreID', {debug=>$$params{debug}, count=>1});
	$genrelist = join(', ', map{$$_{SubGenre} or $$_{ProgramGenre}} @$genres);
      } else { # dead air

	$duration = $$slot{Duration};

	# fill in a bunch of defaults for dead slots
	$$slot{StartTime} = $$slot{EndTime} = &DOW2date($day);
	$$slot{StartTime} .= '+'.sprintf('%2.2d', $hour).':00:00';
	$$slot{EndTime} .= '+'.sprintf('%2.2d', $hour+1).':00:00';

	$icon = "<a href=\"entry.cgi?session=$$params{session}&amp;tbl=Program&amp;StartTime=$$slot{StartTime}&amp;EndTime=$$slot{EndTime}\">". &img('pencil') . '</a>' if $edit;
	$title = $$slot{Program}; # dead air is not a show (despite the joke), so no link
	$genrelist = 'Noise, Experimental' unless $$params{wordpress}; # Le sigh.
      }

      my $rowspan = $duration * 2;
      print "    <td rowspan=\"$rowspan\" class=\"$$slot{Type}\">\n";
      print "$duration $day $hour\n" if $$params{debug};

      if ($$params{wordpress}) {
      print "      $title<br />\n";
      print "      <span class=\"showhost\">$$slot{DJName}</span><br />\n" if $$slot{DJName};
      } else {
      print "      $title $icon<br />\n      <i>$$slot{DJName}</i><br />\n";
      print "<font color=\"#C0C0C0\" size=\"1\">[$genrelist]</font>\n" if $genrelist;
      }

      print "    </td>\n";



      # for some reason my() isn't scoping the way I want, so just undefine them:
      ($duration, $dow, $icon, $title, $genrelist) = (undef, undef, undef);
    }
  }

  if ($rowSkips > 0) {
    print "    <th rowspan=$rowSkips>...</th>\n" unless $$params{wordpress};
  } else {
    print "    <th>$dispHour</th>\n" unless $$params{wordpress};
  }
  print "  </tr>\n";
  if ($rowSkips > 0) {
    for $i (0..$rowSkips-2) {
      print "  <tr align=\"center\">\n  </tr>\n";
      $hour += 0.5;
    }
  }
}
print <<DONE;
  <tr>
    <th>&nbsp;</th>
    <th>Sunday</th>
    <th>Monday</th>
    <th>Tuesday</th>
    <th>Wednesday</th>
    <th>Thursday</th>
    <th>Friday</th>
    <th>Saturday</th>
    <th>&nbsp;</th>
  </tr>
</table>

DONE

&printFoot({name=>'Schedule'}, $cgi, $user) unless $$params{wordpress};
