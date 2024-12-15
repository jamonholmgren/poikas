import re
import json
import sys
from typing import Dict, List, Any

def clean_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text.replace('\t', ' ')).strip()

def extract_season_info(text: str) -> tuple[str, dict[str, str | int]]:
    patterns = [
        r"^(Spring|Summer|Fall|Fall/Winter)\s+(20\d{2})\s*(?:.*?League)?",
        r"(Spring|Summer|Fall|Fall/Winter)\s+(20\d{2})\s+(C League|CC/C League|C/CC League|Rec League)",
        r"(Spring|Summer|Fall|Fall/Winter).+?(20\d{2})(?:/\d{2})?.*(C League|CC/C League|C/CC League|Rec League)",
        r"(20\d{2}).+(Spring|Summer|Fall|Fall/Winter).*(C League|CC/C League|C/CC League|Rec League)"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            full_name = clean_text(match.group(0))
            
            year_match = re.search(r'20\d{2}', full_name)
            year = int(year_match.group(0)) if year_match else None
            
            season_match = re.search(r'(Spring|Summer|Fall|Fall/Winter)', full_name, re.IGNORECASE)
            season = season_match.group(1) if season_match else None
            
            level_match = re.search(r'(C League|CC/C League|C/CC League|Rec League)', text, re.IGNORECASE)
            level = 'C' if level_match and any(x in level_match.group(1) for x in ['C League', 'CC/C']) else 'Rec' if level_match and 'Rec' in level_match.group(1) else None
            
            return full_name, {
                'year': year,
                'season': season,
                'level': level
            }
    return "Unknown Season", {}

def extract_standings(text: str) -> List[Dict[str, Any]]:
    standings = []
    
    # Look for a section that starts with the word "Standings"
    standings_section = re.search(r'Standings\n(.*?)(?:\n\n|\nSuomi|$)', text, re.DOTALL)
    if not standings_section:
        # First fallback - look for Calendar Sync
        standings_section = re.search(r'Calendar Sync\n(.*?)(?:\n\n|\nSuomi|$)', text, re.DOTALL)
    if not standings_section:
        # Second fallback - look for stats header
        standings_section = re.search(r'PTS\s+W\s+L\s+T\s+GP\s+OTL\s+PF\s+PA\s+PD.*?\n(.*?)(?:\n\n|\nSuomi|$)', text, re.DOTALL)
    
    if not standings_section:
        # Print debug info
        print("\nFailed to find standings section in text:")
        print(text[:200].replace('\n', '\\n'))
        return []
    
    lines = standings_section.group(1).split('\n')
    for line in lines:
        # Skip empty lines and header rows
        if not line.strip() or 'PTS' in line or 'Print' in line:
            continue
            
        # Match team stats pattern
        pattern = r'^([^0-9]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(-?\d+)'
        match = re.match(pattern, clean_text(line))
        
        if match:
            team = {
                'team_name': match.group(1).strip(),
                'points': int(match.group(2)),
                'wins': int(match.group(3)),
                'losses': int(match.group(4)),
                'ties': int(match.group(5)),
                'games_played': int(match.group(6)),
                'otl': int(match.group(7)),
                'goals_for': int(match.group(8)),
                'goals_against': int(match.group(9)),
                'goal_differential': int(match.group(10))
            }
            standings.append(team)
    
    return standings

def extract_player_stats(text: str) -> List[Dict[str, Any]]:
    players = []
    
    player_section = re.search(r'Player Stats\n(.*?)(?:\n\n|Goalie Stats)', text, re.DOTALL)
    if not player_section:
        return []
        
    lines = player_section.group(1).split('\n')
    for line in lines:
        if not line.strip() or 'Games Played' in line or 'Player' in line:
            continue
        
        pattern = r'^\d+\s+([^0-9]+?)\s+(\d+|G)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$'
        match = re.match(pattern, clean_text(line))
        
        if match:
            player = {
                'name': match.group(1).strip(),
                'number': match.group(2).strip(),
                'games_played': int(match.group(3)),
                'goals': int(match.group(4)),
                'assists': int(match.group(5)),
                'points': int(match.group(6)),
                'penalty_minutes': int(match.group(7))
            }
            players.append(player)
    
    return players

def extract_goalie_stats(text: str) -> List[Dict[str, Any]]:
    goalies = []
    
    goalie_section = re.search(r'Goalie Stats\n(.*?)(?:\n\n|$)', text, re.DOTALL)
    if not goalie_section:
        return []
        
    lines = goalie_section.group(1).split('\n')
    for line in lines:
        if not line.strip() or 'Games Played' in line or 'Player' in line:
            continue
        
        pattern = r'^\d+\s+([^0-9]+?)\s+([^\t]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([0-9.]+)\s+([0-9.]+)\s+(\d+)$'
        match = re.match(pattern, clean_text(line))
        
        if match:
            goalie = {
                'name': match.group(1).strip(),
                'number': match.group(2).strip(),
                'games_played': int(match.group(3)),
                'wins': int(match.group(4)),
                'losses': int(match.group(5)),
                'ot_losses': int(match.group(6)),
                'saves': int(match.group(7)),
                'goals_against': int(match.group(8)),
                'gaa': float(match.group(9)),
                'save_percentage': float(match.group(10)),
                'shutouts': int(match.group(11))
            }
            goalies.append(goalie)
    
    return goalies

def parse_seasons(text: str) -> Dict[str, Dict[str, Any]]:
    seasons_raw = re.split(r'https://.*?\n', text)
    
    seasons_data = {}
    
    for season_text in seasons_raw:
        if not season_text.strip():
            continue
        
        season_name, metadata = extract_season_info(season_text)
        if season_name == "Unknown Season":
            continue
        
        standings = extract_standings(season_text)
        players = extract_player_stats(season_text)
        goalies = extract_goalie_stats(season_text)
        
        if not (standings or players or goalies):
            print("\n=== Empty Season Detected ===")
            print(f"Season Name: {season_name}")
            print(f"Metadata: {metadata}")
            print("\nFirst 500 chars of text:")
            print(season_text[:500].replace('\n', '\\n'))
            print("\nStandings section search result:")
            standings_section = re.search(r'(?:Calendar Sync|Standings).*?\n(.*?)(?:\n\n|\nSuomi|$)', season_text, re.DOTALL)
            if standings_section:
                print("Found standings section:")
                print(standings_section.group(0)[:200])
            else:
                print("No standings section found with primary pattern")
                standings_section = re.search(r'PTS\s+W\s+L\s+T\s+GP\s+OTL\s+PF\s+PA\s+PD.*?\n(.*?)(?:\n\n|\nSuomi|$)', season_text, re.DOTALL)
                if standings_section:
                    print("Found standings section with fallback pattern:")
                    print(standings_section.group(0)[:200])
                else:
                    print("No standings section found with fallback pattern")
            sys.exit(1)
        
        seasons_data[season_name] = {
            **metadata,
            'standings': standings,
            'players': players,
            'goalies': goalies
        }
    
    return seasons_data

def main():
    with open('historical-stats-c.txt', 'r', encoding='utf-8') as f:
        text = f.read()
    
    seasons_data = parse_seasons(text)
    
    with open('hockey_stats_c.json', 'w', encoding='utf-8') as f:
        json.dump(seasons_data, f, indent=2)
    
    print(f"Processed {len(seasons_data)} seasons")
    print("Data saved to hockey_stats_c.json")

    with open('historical-stats-rec.txt', 'r', encoding='utf-8') as f:
        text = f.read()
    
    seasons_data = parse_seasons(text)
    
    with open('hockey_stats_rec.json', 'w', encoding='utf-8') as f:
        json.dump(seasons_data, f, indent=2)
    
    print(f"Processed {len(seasons_data)} seasons")
    print("Data saved to hockey_stats_rec.json")

if __name__ == "__main__":
    main()