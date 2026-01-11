#!/usr/bin/env python3
"""
Auto-generate image manifests for all image sets in the images/ folder.

For each subfolder in images/:
  - If it has a manifest.json with "encrypted": true, treat as encrypted set
  - Otherwise, generate images.json from image files

Also generates the master images/manifest.json listing all sets.

Usage:
    python update_manifests.py
"""

import json
from pathlib import Path

IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'}


def get_images_dir() -> Path:
    script_dir = Path(__file__).parent
    return script_dir.parent / 'images'


def is_encrypted_set(set_path: Path) -> bool:
    manifest_path = set_path / 'manifest.json'
    if not manifest_path.exists():
        return False

    with open(manifest_path) as f:
        manifest = json.load(f)

    return manifest.get('encrypted', False)


def get_encrypted_set_name(set_path: Path) -> str:
    manifest_path = set_path / 'manifest.json'
    with open(manifest_path) as f:
        manifest = json.load(f)
    return manifest.get('name', set_path.name)


def get_image_files(set_path: Path) -> list[str]:
    images = []
    for f in sorted(set_path.iterdir()):
        ext = f.suffix.lstrip('.').lower()
        if ext in IMAGE_EXTENSIONS:
            images.append(f.name)
    return images


def generate_images_json(set_path: Path) -> int:
    images = get_image_files(set_path)
    images_json_path = set_path / 'images.json'
    with open(images_json_path, 'w') as f:
        json.dump(images, f, indent=2)
    return len(images)


def main():
    images_dir = get_images_dir()

    if not images_dir.exists():
        print(f'Images directory not found: {images_dir}')
        return

    sets = []
    default_set = None

    for set_path in sorted(images_dir.iterdir()):
        if not set_path.is_dir():
            continue

        set_id = set_path.name

        if is_encrypted_set(set_path):
            set_name = get_encrypted_set_name(set_path)
            sets.append({
                'id': set_id,
                'name': set_name,
                'path': f'{set_id}/',
                'encrypted': True,
            })
            print(f'Found encrypted set: {set_id} ({set_name})')

            if default_set is None:
                default_set = set_id
        else:
            img_count = generate_images_json(set_path)
            set_name = set_id.capitalize()
            sets.append({
                'id': set_id,
                'name': set_name,
                'path': f'{set_id}/',
                'encrypted': False,
            })
            print(f'Found image set: {set_id} ({img_count} images)')

            if default_set is None:
                default_set = set_id

    if not sets:
        print('No image sets found')
        return

    # Prefer non-encrypted set as default
    for s in sets:
        if not s['encrypted']:
            default_set = s['id']
            break

    master_manifest = {
        'sets': sets,
        'defaultSet': default_set,
    }

    manifest_path = images_dir / 'manifest.json'
    with open(manifest_path, 'w') as f:
        json.dump(master_manifest, f, indent=2)

    print(f'Generated manifest.json (default: {default_set})')


if __name__ == '__main__':
    main()
