#!/usr/bin/env python3
"""
Encrypt images for the Christmas Tree app.

Usage:
    python encrypt_images.py <source_folder> <output_folder> <set_name>

Example:
    python encrypt_images.py ~/Photos/cats ./images/cats "Cats"

This will:
1. Prompt for a password
2. Encrypt all images from source_folder
3. Create ./images/cats/0.enc, ./images/cats/1.enc, etc.
4. Create ./images/cats/manifest.json with encryption metadata
"""

import json
import os
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
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'}


def derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,  # 256 bits
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    return kdf.derive(password.encode())


def encrypt_data(data: bytes, key: bytes) -> bytes:
    aesgcm = AESGCM(key)
    iv = os.urandom(IV_LENGTH)
    ciphertext = aesgcm.encrypt(iv, data, None)
    return iv + ciphertext  # Prepend IV


def encrypt_images(source_folder: Path, output_folder: Path, set_name: str):
    password = getpass('Enter encryption password: ')
    confirm = getpass('Confirm password: ')

    if password != confirm:
        print('Passwords do not match')
        sys.exit(1)

    if not password:
        print('Password cannot be empty')
        sys.exit(1)

    # Generate salt
    salt = os.urandom(SALT_LENGTH)
    key = derive_key(password, salt)

    # Find all images
    images = []
    for f in sorted(source_folder.iterdir()):
        if f.suffix.lower() in IMAGE_EXTENSIONS:
            images.append(f.name)

    if not images:
        print(f'No images found in {source_folder}')
        sys.exit(1)

    print(f'Found {len(images)} images to encrypt')

    # Create output folder
    output_folder.mkdir(parents=True, exist_ok=True)

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

    # Create manifest with IV and ciphertext separated
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

    print('\nEncryption complete!')
    print(f'  Output folder: {output_folder}')
    print(f'  Manifest: {manifest_path}')


def main():
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)

    source_folder = Path(sys.argv[1]).expanduser().resolve()
    output_folder = Path(sys.argv[2]).resolve()
    set_name = sys.argv[3]

    if not source_folder.is_dir():
        print(f'Source folder not found: {source_folder}')
        sys.exit(1)

    encrypt_images(source_folder, output_folder, set_name)


if __name__ == '__main__':
    main()
