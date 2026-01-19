"""Setup audio assets for the game.

Organizes background music files and generates a manifest.
"""

from pathlib import Path
import json
import os
import shutil

def main():
    """Process audio files and generate configuration."""
    root = Path.cwd()
    source_dir = root / 'background_music'
    target_dir = root / 'assets' / 'background_audio_clean'
    manifest_path = root / 'assets' / 'config' / 'audio_manifest.json'

    if not source_dir.exists():
        print(f"Source directory not found: {source_dir}")
        return

    # Create target directory
    if target_dir.exists():
        shutil.rmtree(target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    tracks = []

    print(f"Processing audio files from {source_dir}...")

    for file in source_dir.glob('*.mp3'):
        # Sanitize filename
        clean_name = file.name.lower().replace(' ', '_').replace('-', '_')
        # Remove multiple underscores
        while '__' in clean_name:
            clean_name = clean_name.replace('__', '_')

        target_file = target_dir / clean_name

        # Copy file
        shutil.copy2(file, target_file)
        print(f"Copied: {file.name} -> {clean_name}")

        # Add to track list (relative path for web usage)
        # Web path: assets/background_audio_clean/filename
        tracks.append({
            "title": file.stem.replace('-', ' ').replace('_', ' ').title(),
            "src": f"assets/background_audio_clean/{clean_name}"
        })

    # Write manifest
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump({"tracks": tracks}, f, indent=4)

    print(f"Audio setup complete. {len(tracks)} tracks processed.")
    print(f"Manifest written to {manifest_path}")

if __name__ == "__main__":
    main()
