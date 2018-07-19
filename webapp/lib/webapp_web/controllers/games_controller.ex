defmodule WebappWeb.GamesController do
  use WebappWeb, :controller

  def games(conn, %{"player" => player, "cnt" => cnt} = _params ) do
    {:ok, pg_pid} = PG.get_pg()

    r = get_recent_games(pg_pid, player, String.to_integer(cnt))
    json(conn, r)
  end

  # SQL
  def get_recent_games(pg_pid, player, cnt) do
    query = """
    WITH recent_games AS (
    SELECT games.id
    FROM games
    INNER JOIN game_players ON games.id = game_players.game_id
    WHERE name = $1
      AND map != 'end'
    ORDER BY date DESC
    LIMIT $2
    )
    --SELECT *gs
    SELECT game_id,
           date,
           map,
           tl,
           ping,
           name,
           frags,
           kills::FLOAT / greatest(deaths, 1) as kd,
           ra,
           ya,
           ga,
           health_100,
           rl_effective_hits::FLOAT/greatest(rl_attacks,1) as rl_acc,
           rl_damage::FLOAT/greatest(rl_attacks,1) as rl_avg_dmg,
           lg_direct_hits::FLOAT/greatest(lg_attacks,1) AS lg_acc,
           lg_damage::FLOAT/greatest(lg_attacks,1) AS lg_avg_dmg,
           damage_given,
           damage_taken,
           damage_given::FLOAT/greatest(damage_taken, 1) as dmg_gt,
           damage_given::FLOAT/tl AS dmg_per_minute
    FROM games INNER JOIN game_players ON games.id = game_players.game_id
    WHERE games.id IN ( SELECT id FROM recent_games )
    ORDER BY date DESC;
    """

    Postgrex.query!(pg_pid, query, [player, cnt])
    |> Map.get(:rows)
    |> Enum.map(fn(row) -> Enum.zip([:game_id, :date, :map, :tl, :ping, :name, :frags, :kd, :ra, :ya, :ga, :health_100, :rl_acc, :rl_avg_dmg, :lg_acc, :lg_avg_dmg, :damage_given, :damage_taken, :dmg_gt, :dmg_per_minute], row) end)
    |> Enum.map(fn(kw) -> Enum.into(kw, %{}) end)
    |> Enum.group_by(&(&1.game_id))
    |> Enum.map(fn({_game_id, games}) -> games |> Enum.sort( fn(a,b) -> a.name == player end ) end)
    |> Enum.sort( fn( a, b ) -> hd(a).date > hd(b).date end)
  end
end
