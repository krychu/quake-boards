package PG;

use strict;
use warnings;
use Configuration qw($cfg);
use DBD::Pg;
use DBI qw(:sql_types);
use DBD::Pg qw(:pg_types);
use File::Slurp;
use Array::Split qw(split_by);
use Data::Dumper;

my %queries;

# singleton dbh connection
{
    my $dbh = DBI->connect("dbi:Pg:host=$cfg->{postgresql_host};port=$cfg->{postgresql_port};dbname=$cfg->{postgresql_dbname}", $cfg->{postgresql_user}, '', {AutoCommit => 1, RaiseError => 1, PrintError => 1});

    $queries{select_1vs1_top} = $dbh->prepare(scalar(read_file('../sql/app/top_level.sql')));
    $queries{select_1vs1_games} = $dbh->prepare(scalar(read_file('../sql/app/games.sql')));
    $queries{select_1vs1_opponents} = $dbh->prepare(scalar(read_file('../sql/app/opponents.sql')));
    $queries{select_1vs1_maps} = $dbh->prepare(scalar(read_file('../sql/app/maps.sql')));

    $queries{select_1vs1_activity} = $dbh->prepare(scalar(read_file('../sql/app/activity.sql')));
    $queries{select_1vs1_players} = $dbh->prepare(scalar(read_file('../sql/app/players.sql')));

    sub get_dbh {
        return $dbh;
    }
};

sub get_activity {
    my $query = $queries{select_1vs1_activity};
    $query->execute();
    return $query->fetchall_arrayref({});
}

sub get_players {
    my ($interval_str, $field, $sort_direction) = @_;

    my $query = $queries{select_1vs1_players};
    $query->bind_param('$1', $interval_str);
    $query->bind_param('$2', $field, { pg_type => PG_NAME });
    $query->bind_param('$3', $sort_direction);
    $query->execute();
    return $query->fetchall_arrayref({});
}

sub get_top {
    my ($player, $interval_str) = @_;

    my $query = $queries{select_1vs1_top};
    $query->execute($player, $interval_str);
    return $query->fetchall_arrayref({})->[0];
}

sub get_games {
    my ($player, $game_cnt, $interval_str) = @_;
    my $query = $queries{select_1vs1_games};

    $query->execute($player, $game_cnt, $interval_str);
    return $query->fetchall_arrayref({});
    #my @games = split_by(2, @{ $query->fetchall_arrayref({}) });
    #return \@games;
}

sub get_opponents {
    my ($player, $interval_str) = @_;
    my $query = $queries{select_1vs1_opponents};

    $query->execute($player, $interval_str);
    return $query->fetchall_arrayref({});
}

sub get_maps {
    my ($player, $interval_str) = @_;
    my $query = $queries{select_1vs1_maps};

    $query->execute($player, $interval_str);
    return $query->fetchall_arrayref({});
}

1;
