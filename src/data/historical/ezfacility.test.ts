import { describe, expect, test } from "bun:test"
import { parseScheduleHtml, parseTeamHtml } from "./ezfacility"

describe("EZFacility historical parser", () => {
  test("parses Suomi team links from a schedule page", () => {
    const html = `
      <table id="ctl00_C_Schedule1_GridView1">
        <tr>
          <td><a href="leagues/434089/Fall-2023---Rec-League.aspx">Fall 2023 - Rec League</a></td>
          <td><a rel="nofollow" href="teams/2902712/Suomi-Poikas-Rec.aspx">Suomi Poikas Rec</a></td>
          <td><a rel="nofollow" href="teams/2902711/Slavic-Peeps.aspx">Slavic Peeps</a></td>
        </tr>
      </table>
    `

    expect(parseScheduleHtml(html)).toEqual([{ teamName: "Suomi Poikas Rec", href: "teams/2902712/Suomi-Poikas-Rec.aspx" }])
  })

  test("parses team standings, player stats, and goalie stats", () => {
    const html = `
      <span>Fall 2023 - Rec League Standings</span>
      <table id="gvStandings">
        <tr><th>Team</th><th>PTS</th><th>W</th><th>L</th><th>T</th><th>GP</th><th>OTL</th><th>PF</th><th>PA</th><th>PD</th></tr>
        <tr><td>Suomi Poikas Rec</td><td>24</td><td>12</td><td>3</td><td>0</td><td>15</td><td>0</td><td>58</td><td>29</td><td>29</td></tr>
      </table>
      <table id="ctl00_C_gvStats0">
        <tr><th></th><th>Player</th><th>#</th><th>Games Played</th><th>Goals</th><th>Assists</th><th>Points</th><th>Penalty Minutes</th></tr>
        <tr><td>1</td><td>Brenden Mattila</td><td>6</td><td>13</td><td>8</td><td>3</td><td>11</td><td>9</td></tr>
      </table>
      <table id="ctl00_C_gvStats1">
        <tr><th></th><th>Player</th><th>#</th><th>Games Played</th><th>Wins</th><th>Losses</th><th>OT Losses</th><th>Saves</th><th>Goals Against</th><th>GAA</th><th>Save %</th><th>Shutouts</th></tr>
        <tr><td>1</td><td>Jamon Holmgren</td><td>G</td><td>15</td><td>12</td><td>3</td><td>0</td><td>256</td><td>29</td><td>2</td><td>0.898</td><td>1</td></tr>
      </table>
    `

    const season = parseTeamHtml(html, "https://example.test/team")

    expect(season.year).toBe(2023)
    expect(season.season).toBe("Fall")
    expect(season.league).toBe("Rec")
    expect(season.standings[0].team_name).toBe("Suomi Poikas Rec")
    expect(season.players[0].name).toBe("Brenden Mattila")
    expect(season.goalies[0]).toEqual({
      name: "Jamon",
      number: "Holmgren G",
      games_played: 15,
      wins: 12,
      losses: 3,
      ot_losses: 0,
      saves: 256,
      goals_against: 29,
      gaa: 2,
      save_percentage: 0.898,
      shutouts: 1,
    })
  })
})
