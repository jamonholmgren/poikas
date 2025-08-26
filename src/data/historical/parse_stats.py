import re
import json
import sys
from typing import Dict, List, Any

def clean_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text.replace('\t', ' ')).strip()

def extract_season_info(text: str) -> tuple[str, dict[str, str | int]]:
    patterns = [
        r"^(Spring|Summer|Fall|Fall/Winter)\s+(20\d{2})\s*(?:.*?League)?",
        r"(Spring|Summer|Fall|Fall/Winter)\s+(20\d{2})\s+(C League|CC/C League|CC League|Rec League)",
        r"(Spring|Summer|Fall|Fall/Winter).+?(20\d{2})(?:/\d{2})?.*(C League|CC/C League|CC League|Rec League)",
        r"(20\d{2}).+(Spring|Summer|Fall|Fall/Winter).*(C League|CC/C League|CC League|Rec League)"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            full_name = clean_text(match.group(0))
            
            year_match = re.search(r'20\d{2}', full_name)
            year = int(year_match.group(0)) if year_match else None
            
            season_match = re.search(r'(Spring|Summer|Fall|Fall/Winter)', full_name, re.IGNORECASE)
            season = season_match.group(1) if season_match else None
            
            league_match = re.search(r'(C League|CC/C League|CC League|Rec League)', text, re.IGNORECASE)
            league = 'C' if league_match and any(x in league_match.group(1) for x in ['C League', 'CC/C']) else 'Rec' if league_match and 'Rec' in league_match.group(1) else None
            
            return full_name, {
                'year': year,
                'season': season,
                'league': league
            }
    return "Unknown Season", {}

def extract_standings(text: str) -> List[Dict[str, Any]]:
    standings = []
    
    print("\n=== Debug Extract Standings ===")
    print("Full text:")
    print("---")
    print(text)
    print("---")
    
    print("\nTrying patterns:")
    
    # Try patterns
    patterns = [
        (r'Standings\n(.*?)(?:\n\n|\nSuomi|$)', "Basic Standings"),
        (r'Calendar Sync\n(.*?)(?:\n\n|\nSuomi|$)', "Calendar Sync"),
        (r'PTS\s+W\s+L\s+T\s+GP\s+OTL\s+PF\s+PA\s+PD.*?\n(.*?)(?:\n\n|\nSuomi|$)', "Stats Header"),
        # Last resort - try to find the tabular data directly
        (r'(?:\n|^)\s*([A-Za-z][\w\s]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(-?\d+)', "Direct Table Match")
    ]
    
    for pattern, name in patterns:
        print(f"\nTrying {name} pattern: {pattern}")
        section_match = re.search(pattern, text, re.DOTALL | re.MULTILINE)
        
        if section_match:
            print(f"Found match with {name} pattern!")
            print("Match content:")
            print("---")
            print(section_match.group(0))
            print("---")
            
            if name == "Direct Table Match":
                # Direct match gets processed differently
                team = {
                    'team_name': section_match.group(1).strip(),
                    'points': int(section_match.group(2)),
                    'wins': int(section_match.group(3)),
                    'losses': int(section_match.group(4)),
                    'ties': int(section_match.group(5)),
                    'games_played': int(section_match.group(6)),
                    'otl': int(section_match.group(7)),
                    'goals_for': int(section_match.group(8)),
                    'goals_against': int(section_match.group(9)),
                    'goal_differential': int(section_match.group(10))
                }
                standings.append(team)
                continue
            
            # Process regular section matches
            lines = section_match.group(1).split('\n')
            print(f"\nProcessing {len(lines)} lines")
            for line in lines:
                print(f"\nProcessing line: {repr(line)}")
                if not line.strip() or 'PTS' in line or 'Print' in line:
                    print("Skipping header/empty line")
                    continue
                    
                pattern = r'^([^0-9]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(-?\d+)'
                match = re.match(pattern, clean_text(line))
                
                if match:
                    print("Found team match!")
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
                else:
                    print("No team match found")
    
    print(f"\nFound {len(standings)} standings entries")
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
    # First, normalize line endings and remove extra whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    
    # Split on season headers for both C and Rec leagues
    seasons_raw = re.split(r'\n\n([A-Za-z]+\s+20\d{2}\s+(?:C|Rec) League Standings)\n', text)
    
    seasons_data = {}
    current_season = None
    current_text = ""
    
    # Process the split results
    for chunk in seasons_raw:
        if re.match(r'[A-Za-z]+\s+20\d{2}\s+(?:C|Rec) League Standings', chunk):
            # This is a season header
            if current_season and current_text:
                # Process previous season if exists
                season_name, metadata = extract_season_info(current_season + "\n" + current_text)
                if season_name != "Unknown Season":
                    standings = extract_standings(current_text)
                    players = extract_player_stats(current_text)
                    goalies = extract_goalie_stats(current_text)
                    
                    if standings or players or goalies:
                        seasons_data[season_name] = {
                            **metadata,
                            'standings': standings,
                            'players': players,
                            'goalies': goalies
                        }
            
            # Start new season
            current_season = chunk
            current_text = ""
        else:
            # This is content for the current season
            current_text += chunk
    
    # Process the last season
    if current_season and current_text:
        season_name, metadata = extract_season_info(current_season + "\n" + current_text)
        if season_name != "Unknown Season":
            standings = extract_standings(current_text)
            players = extract_player_stats(current_text)
            goalies = extract_goalie_stats(current_text)
            
            if standings or players or goalies:
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