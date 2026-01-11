#!/usr/bin/env python3
"""
Image management utilities for the Christmas Tree app.

Commands:
    add <source_folder> <set_name> [--encrypt]
        Add images from source folder to a new image set.
        Use --encrypt to encrypt the images (will prompt for password).

    remove <set_name>
        Remove an image set.

    list
        List all image sets.

Examples:
    python images.py add ~/Photos/cats cats
    python images.py add ~/Photos/private yz --encrypt
    python images.py remove cats
    python images.py list
"""

import json
import os
import shutil
import sys
from base64 import b64encode
from getpass import getpass
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

PBKDF2_ITERATIONS = 100000
IV_LENGTH = 12
SALT_LENGTH = 16
IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'}


def get_images_dir() -> Path:
    script_dir = Path(__file__).parent
    return script_dir.parent / 'images'


def derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    return kdf.derive(password.encode())


def encrypt_data(data: bytes, key: bytes) -> bytes:
    aesgcm = AESGCM(key)
    iv = os.urandom(IV_LENGTH)
    ciphertext = aesgcm.encrypt(iv, data, None)
    return iv + ciphertext


def get_image_files(folder: Path) -> list[str]:
    images = []
    for f in sorted(folder.iterdir()):
        ext = f.suffix.lstrip('.').lower()
        if ext in IMAGE_EXTENSIONS:
            images.append(f.name)
    return images


def is_encrypted_set(set_path: Path) -> bool:
    manifest_path = set_path / 'manifest.json'
    if not manifest_path.exists():
        return False
    with open(manifest_path) as f:
        manifest = json.load(f)
    return manifest.get('encrypted', False)


def get_set_name(set_path: Path) -> str:
    manifest_path = set_path / 'manifest.json'
    if manifest_path.exists():
        with open(manifest_path) as f:
            manifest = json.load(f)
        return manifest.get('name', set_path.name)
    return set_path.name.capitalize()


def regenerate_master_manifest():
    """Regenerate the master manifest.json from all image sets."""
    images_dir = get_images_dir()

    if not images_dir.exists():
        return

    sets = []
    default_set = None

    for set_path in sorted(images_dir.iterdir()):
        if not set_path.is_dir():
            continue

        set_id = set_path.name
        encrypted = is_encrypted_set(set_path)
        set_name = get_set_name(set_path)

        sets.append({
            'id': set_id,
            'name': set_name,
            'path': f'{set_id}/',
            'encrypted': encrypted,
        })

        # Prefer non-encrypted set as default
        if default_set is None or (not encrypted and is_encrypted_set(images_dir / default_set)):
            default_set = set_id

    if not sets:
        # Remove manifest if no sets
        manifest_path = images_dir / 'manifest.json'
        if manifest_path.exists():
            manifest_path.unlink()
        return

    master_manifest = {
        'sets': sets,
        'defaultSet': default_set,
    }

    manifest_path = images_dir / 'manifest.json'
    with open(manifest_path, 'w') as f:
        json.dump(master_manifest, f, indent=2)


def cmd_add(source_folder: Path, set_name: str, encrypt: bool, password: str | None = None):
    """Add images from source folder to a new image set."""
    images_dir = get_images_dir()
    set_id = set_name.lower().replace(' ', '-')
    output_folder = images_dir / set_id

    if output_folder.exists():
        print(f'Set "{set_id}" already exists. Remove it first with: python images.py remove {set_id}')
        sys.exit(1)

    images = get_image_files(source_folder)
    if not images:
        print(f'No images found in {source_folder}')
        sys.exit(1)

    print(f'Found {len(images)} images')
    output_folder.mkdir(parents=True, exist_ok=True)

    if encrypt:
        if password is None:
            password = getpass('Enter encryption password: ')
            confirm = getpass('Confirm password: ')

            if password != confirm:
                print('Passwords do not match')
                shutil.rmtree(output_folder)
                sys.exit(1)

        if not password:
            print('Password cannot be empty')
            shutil.rmtree(output_folder)
            sys.exit(1)

        salt = os.urandom(SALT_LENGTH)
        key = derive_key(password, salt)

        # Encrypt each image
        for i, filename in enumerate(images):
            source_path = source_folder / filename
            with open(source_path, 'rb') as f:
                image_data = f.read()

            encrypted = encrypt_data(image_data, key)

            output_path = output_folder / f'{i}.enc'
            with open(output_path, 'wb') as f:
                f.write(encrypted)

            print(f'  Encrypted: {filename} -> {i}.enc')

        # Encrypt images list
        images_json = json.dumps(images).encode()
        encrypted_list = encrypt_data(images_json, key)

        manifest = {
            'encrypted': True,
            'name': set_name,
            'salt': b64encode(salt).decode(),
            'iv': b64encode(encrypted_list[:IV_LENGTH]).decode(),
            'images': b64encode(encrypted_list[IV_LENGTH:]).decode(),
        }

        manifest_path = output_folder / 'manifest.json'
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)

        print(f'\nAdded encrypted set: {set_id}')
    else:
        # Copy images directly
        for filename in images:
            source_path = source_folder / filename
            dest_path = output_folder / filename
            shutil.copy2(source_path, dest_path)
            print(f'  Copied: {filename}')

        # Generate images.json
        images_json_path = output_folder / 'images.json'
        with open(images_json_path, 'w') as f:
            json.dump(images, f, indent=2)

        print(f'\nAdded image set: {set_id}')

    regenerate_master_manifest()
    print('Updated manifest.json')


def cmd_remove(set_name: str):
    """Remove an image set."""
    images_dir = get_images_dir()
    set_path = images_dir / set_name

    if not set_path.exists():
        print(f'Set "{set_name}" not found')
        sys.exit(1)

    shutil.rmtree(set_path)
    print(f'Removed set: {set_name}')

    regenerate_master_manifest()
    print('Updated manifest.json')


def cmd_list():
    """List all image sets."""
    images_dir = get_images_dir()

    if not images_dir.exists():
        print('No images directory found')
        return

    found = False
    for set_path in sorted(images_dir.iterdir()):
        if not set_path.is_dir():
            continue

        set_id = set_path.name
        encrypted = is_encrypted_set(set_path)
        set_name = get_set_name(set_path)

        if encrypted:
            enc_files = list(set_path.glob('*.enc'))
            print(f'  {set_id}: {set_name} ({len(enc_files)} encrypted images)')
        else:
            images = get_image_files(set_path)
            print(f'  {set_id}: {set_name} ({len(images)} images)')

        found = True

    if not found:
        print('No image sets found')


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]

    if command == 'add':
        if len(sys.argv) < 4:
            print('Usage: python images.py add <source_folder> <set_name> [--encrypt]')
            sys.exit(1)

        source_folder = Path(sys.argv[2]).expanduser().resolve()
        set_name = sys.argv[3]
        encrypt = '--encrypt' in sys.argv

        # Check for --password argument
        password = None
        for i, arg in enumerate(sys.argv):
            if arg == '--password' and i + 1 < len(sys.argv):
                password = sys.argv[i + 1]
                break

        if not source_folder.is_dir():
            print(f'Source folder not found: {source_folder}')
            sys.exit(1)

        cmd_add(source_folder, set_name, encrypt, password)

    elif command == 'remove':
        if len(sys.argv) < 3:
            print('Usage: python images.py remove <set_name>')
            sys.exit(1)

        set_name = sys.argv[2]
        cmd_remove(set_name)

    elif command == 'list':
        cmd_list()

    else:
        print(f'Unknown command: {command}')
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
