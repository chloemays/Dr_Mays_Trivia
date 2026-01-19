import json
import os
from pathlib import Path
import sys

def main():
    root = Path.cwd()
    config_path = root / 'gameConfig.json'
    
    if not config_path.exists():
        print(f"Error: {config_path} not found")
        sys.exit(1)
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        sys.exit(1)
        
    # Create structure
    config_dir = root / 'assets' / 'config'
    categories_dir = config_dir / 'categories'
    os.makedirs(categories_dir, exist_ok=True)
    
    # Metadata (everything except characters and categories)
    metadata = {k: v for k, v in data.items() if k not in ['characters', 'categories']}
    with open(config_dir / 'metadata.json', 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=4)
        
    # Characters
    with open(config_dir / 'characters.json', 'w', encoding='utf-8') as f:
        json.dump(data['characters'], f, indent=4)
        
    # Categories
    category_paths = []
    for cat in data['categories']:
        cat_filename = f"{cat['id']}.json"
        cat_path = categories_dir / cat_filename
        with open(cat_path, 'w', encoding='utf-8') as f:
            json.dump(cat, f, indent=4)
        category_paths.append(f"assets/config/categories/{cat_filename}")
        
    # Manifest
    manifest = {
        "metadata": "assets/config/metadata.json",
        "characters": "assets/config/characters.json",
        "categories": category_paths
    }
    with open(config_dir / 'manifest.json', 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=4)
        
    print("Config split successfully!")
    print(f"Created {len(category_paths)} category files.")

if __name__ == "__main__":
    main()
