#!/usr/bin/perl

# Prints a link to the current playlist.
# Use the debug param if you want to see this as a standalone script.

use lib "$ENV{WWW_SITE}/perl-lib";
use lib "$ENV{WWW_SITE}/perl-lib/tables";
require "sql.pl";
require "interface.pl";
require "record.pl";
require 'login.pl';
require 'search.pl';
require 'misc.pl';
require 'task.pl';

require 'playlist.pl';
$tbl = &TblInit;

use CGI;
my($cgi) = new CGI;
my $params = $cgi->Vars;

$user = loginSession($$params{session});

printHead($tbl, $cgi, $user) if $$params{debug};

# Get the current time, put it into a form for the DB to use
my ($min, $hour, $day, $mon, $year) = ((localtime time)[1..5]);
my $time = 1900+$year.'-'
  . sprintf('%2.2d', $mon+1).'-'
  . sprintf('%2.2d', $day).' '
  . sprintf('%2.2d', $hour).':'
  . sprintf('%2.2d', $min). ':00';

# We just want a playlist that's happening now.
my $row = sqlSelectRow($tbl, ['PlayListID'],
		       {string=>'StartTime <= ? AND EndTime > ?',
			values=>[$time, $time]},
		       undef, $$params{debug});

print "Content-Type: text/html\n\n";
print "<a href=\"playlist.cgi?id=$$row{PlayListID}\" target=\"_top\">View the current playlist!</a><br/>\n";

printFoot($tbl, $cgi, $user) if $$params{debug};