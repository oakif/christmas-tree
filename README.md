# Christmas Tree

An interactive 3D Christmas tree with exploding particles and image showcase.

## Usage

Open `index.html` in a browser or serve with a local server.

### Controls

- **Click/tap** anywhere to explode the tree and show an image
- **Space** to toggle explosion
- **Escape** to dismiss settings modal
- **Settings gear** (top right) to change image set and options

## Image Management

Use the `utils/images.py` script to manage image sets.

### Requirements

```bash
pip install cryptography
```

### Commands

**Add an image set:**
```bash
python utils/images.py add ~/Photos/vacation "Vacation Photos"
```

**Add an encrypted image set:**
```bash
python utils/images.py add ~/Photos/private "Private" --encrypt
```
You'll be prompted to enter and confirm a password.

**List all image sets:**
```bash
python utils/images.py list
```

**Remove an image set:**
```bash
python utils/images.py remove vacation-photos
```

### Supported Image Formats

jpg, jpeg, png, gif, webp, heic
