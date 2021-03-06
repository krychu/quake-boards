import { state } from "./State";
import * as cmd from "./Cmd";
import * as log from "./Log";
import { create_form_data } from "./Utils";
import { MainGameData } from "./1vs1/MainGames";

export interface TopLevelData {
    game_cnt: number;
    opponent_cnt: number;
    win_percent: number;
    avg_frag_percent: number;
    avg_fpm: number;
    avg_kd: number;
    avg_lg_acc_percent: number;
    most_frequent_map: string;
};

export interface DuelPlayerPageData {
    game_cnt: number;
    games: GameData[];
    opponents: OpponentData[];
    maps: MapData[];
    game_cnts: [string, number][];
    win_probabilities: any[];
    top_level: any;
};

export interface DuelPlayersPageData {
    players: PlayerData[];
    activity: DayActivityData[];
    games: MainGameData[];
}

export interface DayActivityData {
    day_name: string;
    game_cnt: number;
    day_bucket: string;
}

export interface GameData {
    // this order should stay sync with the UI design
    game_id: number;
    raw_date: number;
    //date: string;
    minutes_ago: number;
    map: string;

    a_name: string;
    a_frags: number;
    a_frag_percent: number;
    a_dmg_percent: number;
    a_rl_dmg_minute: number;
    a_lg_dmg_minute: number;
    a_lg_acc_percent: number;
    a_ra: number;
    a_ya: number;
    a_mh: number;
    a_speed_avg: number;

    b_name: string;
    b_frags: number;
    b_frag_percent: number;
    b_dmg_percent: number;
    b_rl_dmg_minute: number;
    b_lg_dmg_minute: number;
    b_lg_acc_percent: number;
    b_ra: number;
    b_ya: number;
    b_mh: number;
    b_speed_avg: number;
}

export interface OpponentData {
    name: string;
    game_cnt: number;

    a_win_percent: number;
    a_avg_frag_percent: number;
    a_avg_dmg_percent: number;
    a_avg_lg_acc_percent: number;

    b_win_percent: number;
    b_avg_frag_percent: number;
    b_avg_dmg_percent: number;
    b_avg_lg_acc_percent: number;

    most_frequent_map: string;
}

export interface MapData {
    map: string;
    game_cnt: number;
    opponent_cnt: number;

    a_win_percent: number;
    a_avg_frag_percent: number;
    a_avg_dmg_percent: number;
    a_avg_dmg_minute: number;

    b_win_percent: number;
    b_avg_frag_percent: number;
    b_avg_dmg_percent: number;
    b_avg_dmg_minute: number;
}

export interface PlayerData {
    name: string;
    game_cnt: number;
    opponent_cnt: number;
    a_win_percent: number;
    b_win_percent: number;
    //last_game_date: string;
    last_game_minutes_ago: number;
    avg_lg_acc_percent: number;
    avg_frag_percent: number;
}

const commands: [string, cmd.Cmd][] = [
    // duel players
    [ "data_fetch_activity",              cmd_data_fetch_activity ],
    [ "data_fetch_duel_players",          cmd_data_fetch_duel_players ],

    // duel player
  [ "data_fetch_game_cnts",             cmd_data_fetch_game_cnts ],
  [ "data_fetch_games",                 cmd_data_fetch_games ],
  [ "data_fetch_opponents",             cmd_data_fetch_opponents ],
  [ "data_fetch_maps",                  cmd_data_fetch_maps ],
    [ "data_fetch_toplevel",            cmd_data_fetch_toplevel ]
];

export function init() {
  cmd.add_cmds(commands);
    log.log("Data module initialized");

    const duel_player_data: DuelPlayerPageData = {
        game_cnt: 40,
        games: [],
        opponents: [],
        maps: [],
        game_cnts: [],
        win_probabilities: [],
        top_level: null
    };
    state.duel_player.data = duel_player_data;

    const duel_players_data: DuelPlayersPageData = {
        players: [],
        activity: [],
        games: []
    }
    state.duel_players.data = duel_players_data;
}

export function shutdown() {
}

//------------------------------------------------------------------------------
// Commands
//------------------------------------------------------------------------------
/**
 * Duel Player
 */
async function cmd_data_fetch_game_cnts(): Promise<any> {
  if (state.duel_player.player == null) {
    log.log("Data.ts - cmd_data_fetch_game_cnt - wrong state");
    return Promise.reject();
  }

  return fetch(_api_url_game_cnts(state.duel_player.player))
    .then((response) => response.json())
        .then((json) => {
            const data = state.duel_player.data as DuelPlayerPageData;
            data.game_cnts = json;
    });
}

async function cmd_data_fetch_games(): Promise<any> {
  if (!state.header || !state.header.time_period || !state.duel_player.data || !state.duel_player.player || !state.duel_player.games) {
    log.log("Data.ts - cmd_data_fetch_games - wrong state");
    return Promise.reject();
  }

    return fetch(_api_url_games(state.duel_player.player, state.duel_player.data.game_cnt), {
        method: "POST",
        body: create_form_data({
            time_period: state.header.time_period,
            sort_column_name: state.duel_player.games.sort_column_name,
            sort_direction: state.duel_player.games.sort_direction
        })
    })
    .then((response) => response.json())
    .then((json) => {
        const data = state.duel_player.data as DuelPlayerPageData;
        data.games = json;
    });
}

async function cmd_data_fetch_opponents(): Promise<any> {
  if (!state.header || !state.header.time_period || !state.duel_player.player || !state.duel_player.opponents) {
    log.log("Data.ts - cmd_data_fetch_opponents - wrong state");
    return Promise.reject();
  }

    return fetch(_api_url_opponents(state.duel_player.player), {
        method: "POST",
        body: create_form_data({
            time_period: state.header.time_period,
            sort_column_name: state.duel_player.opponents.sort_column_name,
            sort_direction: state.duel_player.opponents.sort_direction
        })
    })
    .then((response) => response.json())
        .then((json) => {
            const data = state.duel_player.data as DuelPlayerPageData;
            data.opponents = json;
    });
}

async function cmd_data_fetch_maps(): Promise<any> {
  if (!state.header || !state.header.time_period || !state.duel_player.player || !state.duel_player.maps) {
    log.log("Data.ts - cmd_data_fetch_maps - wrong state");
    return Promise.reject();
  }

    return fetch(_api_url_maps(state.duel_player.player), {
        method: "POST",
        body: create_form_data({
            time_period: state.header.time_period,
            sort_column_name: state.duel_player.maps.sort_column_name,
            sort_direction: state.duel_player.maps.sort_direction
        })
    })
    .then((response) => response.json())
        .then((json) => {
            const data = state.duel_player.data as DuelPlayerPageData;
            data.maps = json;
    });
}

async function cmd_data_fetch_toplevel(): Promise<void> {
    if (!state.header || !state.header.time_period || !state.duel_player.player) {
        log.log("Data::cmd_data_fetch_toplevel - player is null");
        return Promise.reject();
    }

    return fetch(_api_url_toplevel(state.duel_player.player), {
        method: "POST",
        body: create_form_data({time_period: state.header.time_period})
    })
        .then((response) => response.json())
        .then((json) => {
            const data = state.duel_player.data as DuelPlayerPageData;
            data.top_level = json;
        });
}

/**
 * Duel Players
 */
async function cmd_data_fetch_activity(): Promise<any> {
  return fetch(_api_url_activity())
    .then((response) => response.json())
        .then((json) => {
            const data = state.duel_players.data as DuelPlayersPageData;
            data.activity = json;
    });
}

async function cmd_data_fetch_duel_players(): Promise<any> {
    if (!state.header || !state.header.time_period || !state.duel_players.players) {
        return;
    }

    return fetch(_api_url_duel_players(), {
        method: "POST",
        body: create_form_data({
            time_period: state.header.time_period,
            sort_column_name: state.duel_players.players.sort_column_name,
            sort_direction: state.duel_players.players.sort_direction
        })
    })
        .then((response) => response.json())
        .then((json) => {
            const data = state.duel_players.data as DuelPlayersPageData;
            data.players = json;
        });
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------
function _api_url_game_cnts(player: string): string {
  return `/api/1vs1/${player}/game_cnts`;
}

function _api_url_games(player: string, game_cnt: number): string {
  return `/api/1vs1/${player}/games/${game_cnt}`;
}

function _api_url_opponents(player: string): string {
  return `/api/1vs1/${player}/opponents`;
}

function _api_url_maps(player: string): string {
  return `/api/1vs1/${player}/maps`;
}

function _api_url_activity(): string {
  return `/api/1vs1/activity`;
}

function _api_url_duel_players(): string {
  return `/api/1vs1/players`;
}

function _api_url_toplevel(player: string): string {
    return `/api/1vs1/${player}/top`;
}
