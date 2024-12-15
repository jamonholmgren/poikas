import re
import json
from typing import Dict, List, Any

def clean_text(text: str) -> str:
    """Remove extra whitespace and normalize line endings"""
    return re.sub(r'\s+', ' ', text.replace('\t', ' ')).strip()

def extract_season_name(text: str) -> str:
    """Extract season name with better pattern matching"""
    patterns = [
        r"(Spring|Summer|Fall|Fall/Winter).+?(20\d{2})(?:/\d{2})?.*(C League|CC/C League|C/CC League|Rec League)",
        r"(20\d{2}).+(Spring|Summer|Fall|Fall/Winter).*(C League|CC/C League|C/CC League|Rec League)"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return clean_text(match.group(0))
    return "Unknown Season"

def extract_standings(text: str) -> List[Dict[str, Any]]:
    standings = []
    
    # Look for the standings section - even more flexible pattern
    standings_section = re.search(r'(?:Calendar Sync|Standings).*?\n(.*?)(?:\n\n|\nSuomi|$)', text, re.DOTALL)
    if not standings_section:
        # Fallback pattern - look for content between header and next section
        standings_section = re.search(r'PTS\s+W\s+L\s+T\s+GP\s+OTL\s+PF\s+PA\s+PD.*?\n(.*?)(?:\n\n|\nSuomi|$)', text, re.DOTALL)
    if not standings_section:
        return []
        
    # Process each line of standings
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
    
    # Find the Player Stats section
    player_section = re.search(r'Player Stats\n(.*?)(?:\n\n|Goalie Stats)', text, re.DOTALL)
    if not player_section:
        return []
        
    lines = player_section.group(1).split('\n')
    for line in lines:
        # Skip header rows and empty lines
        if not line.strip() or 'Games Played' in line or 'Player' in line:
            continue
            
        # Match player stats pattern
        pattern = r'^\d+\s+([^0-9]+?)\s+(\d+|G)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$'
        match = re.match(pattern, clean_text(line))
        
        if match:
            player = {
                'name': match.group(1).strip(),
                'number': match.group(2).strip(),  # Keep as string since some are 'G'
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
    
    # Find the Goalie Stats section
    goalie_section = re.search(r'Goalie Stats\n(.*?)(?:\n\n|$)', text, re.DOTALL)
    if not goalie_section:
        return []
        
    lines = goalie_section.group(1).split('\n')
    for line in lines:
        # Skip header rows and empty lines
        if not line.strip() or 'Games Played' in line or 'Player' in line:
            continue
            
        # Match goalie stats pattern
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

def extract_season_info(text: str) -> tuple[str, dict[str, str | int]]:
    """Extract season name and metadata"""
    print("\n--- Starting season extraction ---")
    print("First 100 chars of text:", text[:100].replace('\n', '\\n'))
    
    patterns = [
        # Even simpler pattern first
        r"^(Spring|Summer|Fall|Fall/Winter)\s+(20\d{2})\s*(?:.*?League)?",
        # Then more specific patterns
        r"(Spring|Summer|Fall|Fall/Winter)\s+(20\d{2})\s+(C League|CC/C League|C/CC League|Rec League)",
        r"(Spring|Summer|Fall|Fall/Winter).+?(20\d{2})(?:/\d{2})?.*(C League|CC/C League|C/CC League|Rec League)",
        r"(20\d{2}).+(Spring|Summer|Fall|Fall/Winter).*(C League|CC/C League|C/CC League|Rec League)"
    ]
    
    for i, pattern in enumerate(patterns):
        print(f"\nTrying pattern {i + 1}:", pattern)
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            print("Match found!", match.group(0))
            full_name = clean_text(match.group(0))
            print("Cleaned name:", full_name)
            
            # Extract year
            year_match = re.search(r'20\d{2}', full_name)
            year = int(year_match.group(0)) if year_match else None
            print("Year:", year)
            
            # Extract season
            season_match = re.search(r'(Spring|Summer|Fall|Fall/Winter)', full_name, re.IGNORECASE)
            season = season_match.group(1) if season_match else None
            print("Season:", season)
            
            # Look for level in the full text if not in the title
            level_match = re.search(r'(C League|CC/C League|C/CC League|Rec League)', text, re.IGNORECASE)
            level = 'C' if level_match and any(x in level_match.group(1) for x in ['C League', 'CC/C']) else 'Rec' if level_match and 'Rec' in level_match.group(1) else None
            print("Level:", level)
            print("Level match:", level_match.group(1) if level_match else None)
            
            return full_name, {
                'year': year,
                'season': season,
                'level': level
            }
        else:
            print("No match")
    
    print("\nNo matches found with any pattern")
    return "Unknown Season", {}

def parse_seasons(text: str) -> Dict[str, Dict[str, Any]]:
    # Split into seasons at URLs
    print("\n=== Starting new parse ===")
    seasons_raw = re.split(r'https://.*?\n', text)
    print(f"Found {len(seasons_raw)} potential seasons")
    
    seasons_data = {}
    
    for i, season_text in enumerate(seasons_raw):
        if not season_text.strip():
            print(f"\nSkipping empty season {i}")
            continue
            
        print(f"\nProcessing season chunk {i + 1}")
        print("First 100 chars:", season_text[:100].replace('\n', '\\n'))
        
        season_name, metadata = extract_season_info(season_text)
        if season_name == "Unknown Season":
            print("Skipping unknown season")
            continue
            
        standings = extract_standings(season_text)
        players = extract_player_stats(season_text)
        goalies = extract_goalie_stats(season_text)
        
        print(f"Found: {len(standings)} standings, {len(players)} players, {len(goalies)} goalies")
        
        # Only include seasons with valid data
        if standings or players or goalies:
            seasons_data[season_name] = {
                **metadata,  # Add the metadata fields
                'standings': standings,
                'players': players,
                'goalies': goalies
            }
            print(f"Added season {season_name} with metadata", metadata)
    
    return seasons_data

def main():
    # Read the input file
    with open('historical-stats-c.txt', 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Parse the data
    seasons_data = parse_seasons(text)
    
    # Write to JSON file
    with open('hockey_stats_c.json', 'w', encoding='utf-8') as f:
        json.dump(seasons_data, f, indent=2)
    
    print(f"Processed {len(seasons_data)} seasons")
    print("Data saved to hockey_stats_c.json")

    # Read the input file
    with open('historical-stats-rec.txt', 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Parse the data
    seasons_data = parse_seasons(text)
    
    # Write to JSON file
    with open('hockey_stats_rec.json', 'w', encoding='utf-8') as f:
        json.dump(seasons_data, f, indent=2)
    
    print(f"Processed {len(seasons_data)} seasons")
    print("Data saved to hockey_stats_rec.json")

if __name__ == "__main__":
    main()
