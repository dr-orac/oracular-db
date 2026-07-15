#!/usr/bin/env python3
"""Build the bounded, self-hosted terrain tiles used by the atlas.

The source is the USGS National Map 3DEP ImageServer's public-domain
``Hillshade Gray`` rendering.  The script requests only the documented map
bounds and zoom levels, removes the service's black no-data pixels, applies
the project's subdued paper palette, and writes 256 px WebP slippy-map tiles.

Run from the repository root:

    python3 tools/build-map-terrain.py
    python3 tools/build-map-terrain.py --force

Existing tiles are reused unless ``--force`` is supplied.  Network access is
needed only while rebuilding; the application serves the generated files
locally and never calls the USGS service at runtime.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Optional

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "media" / "map-terrain"
LAND_PATH = ROOT / "data" / "geography" / "natural-earth-110m-land.geojson"
SERVICE = (
    "https://elevation.nationalmap.gov/arcgis/rest/services/"
    "3DEPElevation/ImageServer/exportImage"
)
RETRIEVED = "2026-07-15"
SOURCE_SNAPSHOT = "USGS 3DEP service data published 2026-06-23"
WEB_MERCATOR_LIMIT = 20037508.342789244


@dataclass(frozen=True)
class Scope:
    name: str
    bounds: tuple[float, float, float, float]
    zooms: tuple[int, ...]


SCOPES = (
    Scope("us", (-125.0, 24.0, -66.0, 50.0), (2, 3, 4, 5)),
    Scope("region", (-114.9, 39.4, -112.4, 41.6), (6, 7, 8, 9)),
)


def lonlat_to_tile(lon: float, lat: float, zoom: int) -> tuple[int, int]:
    lat = max(-85.05112878, min(85.05112878, lat))
    count = 2**zoom
    x = int((lon + 180.0) / 360.0 * count)
    y = int(
        (1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi)
        / 2.0
        * count
    )
    return max(0, min(count - 1, x)), max(0, min(count - 1, y))


def tile_bbox_3857(x: int, y: int, zoom: int) -> tuple[float, float, float, float]:
    count = 2**zoom
    tile_span = WEB_MERCATOR_LIMIT * 2.0 / count
    xmin = -WEB_MERCATOR_LIMIT + x * tile_span
    xmax = xmin + tile_span
    ymax = WEB_MERCATOR_LIMIT - y * tile_span
    ymin = ymax - tile_span
    return xmin, ymin, xmax, ymax


def tile_coordinates(scope: Scope):
    west, south, east, north = scope.bounds
    for zoom in scope.zooms:
        x_min, y_max = lonlat_to_tile(west, south, zoom)
        x_max, y_min = lonlat_to_tile(east, north, zoom)
        for x in range(x_min, x_max + 1):
            for y in range(y_min, y_max + 1):
                yield zoom, x, y


def service_url(zoom: int, x: int, y: int) -> str:
    bbox = ",".join(f"{value:.6f}" for value in tile_bbox_3857(x, y, zoom))
    query = urllib.parse.urlencode(
        {
            "bbox": bbox,
            "bboxSR": "3857",
            "imageSR": "3857",
            "size": "512,512",
            "format": "png32",
            "renderingRule": json.dumps(
                {"rasterFunction": "Hillshade Gray"}, separators=(",", ":")
            ),
            "f": "image",
        }
    )
    return f"{SERVICE}?{query}"


def download(url: str, attempts: int = 3) -> bytes:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "oracular-db-terrain-builder/1.0"},
    )
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError):
            if attempt == attempts:
                raise
            time.sleep(attempt)
    raise RuntimeError("unreachable")


@lru_cache(maxsize=1)
def land_features() -> tuple[dict[str, object], ...]:
    if not LAND_PATH.exists():
        raise FileNotFoundError(f"missing coastline source: {LAND_PATH}")
    land = json.loads(LAND_PATH.read_text(encoding="utf-8"))
    return tuple(land.get("features", []))


def land_mask(zoom: int, tile_x: int, tile_y: int, size: int = 256) -> Image.Image:
    scale = 2
    canvas_size = size * scale
    world_size = canvas_size * (2**zoom)

    def pixel(point):
        lon, lat = point[:2]
        lat = max(-85.05112878, min(85.05112878, lat))
        px = (lon + 180.0) / 360.0 * world_size - tile_x * canvas_size
        py = (
            1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi
        ) / 2.0 * world_size - tile_y * canvas_size
        return px, py

    mask = Image.new("L", (canvas_size, canvas_size), 0)
    draw = ImageDraw.Draw(mask)
    for feature in land_features():
        geometry = feature.get("geometry") or {}
        coordinates = geometry.get("coordinates") or []
        if geometry.get("type") == "Polygon":
            polygons = [coordinates]
        elif geometry.get("type") == "MultiPolygon":
            polygons = coordinates
        else:
            continue
        for polygon in polygons:
            if not polygon:
                continue
            draw.polygon([pixel(point) for point in polygon[0]], fill=255)
            for hole in polygon[1:]:
                draw.polygon([pixel(point) for point in hole], fill=0)
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def style_tile(source: bytes, zoom: int, x: int, y: int) -> Image.Image:
    image = Image.open(io.BytesIO(source)).convert("RGBA")
    image = image.resize((256, 256), Image.Resampling.LANCZOS)
    grayscale = ImageOps.grayscale(image)
    grayscale = ImageEnhance.Contrast(grayscale).enhance(0.82)
    terrain = ImageOps.colorize(grayscale, black="#4b4335", white="#b9ae91")

    # The service returns black for no-data.  Keep that area transparent so the
    # renderer's explicit water/background layer remains semantically distinct.
    source_rgb = image.convert("RGB")
    no_data = source_rgb.point(
        lambda channel: 255 if channel <= 8 else 0
    ).split()
    no_data_all = Image.merge("RGB", no_data).convert("L")
    alpha = ImageOps.invert(no_data_all).point(lambda value: min(232, value))
    alpha = ImageChops.multiply(alpha, land_mask(zoom, x, y))
    terrain.putalpha(alpha)
    return terrain


def write_tile(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=74, method=6, exact=True)


def digest_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def build(force: bool, force_scope: Optional[str] = None) -> None:
    manifest_scopes: dict[str, dict[str, object]] = {}
    total_bytes = 0
    total_tiles = 0
    expected_paths: set[Path] = set()

    for scope in SCOPES:
        entries = list(tile_coordinates(scope))
        total_tiles += len(entries)
        print(f"{scope.name}: {len(entries)} tiles")
        hashes: list[str] = []
        for index, (zoom, x, y) in enumerate(entries, start=1):
            target = OUTPUT / scope.name / str(zoom) / str(x) / f"{y}.webp"
            expected_paths.add(target)
            rebuild = force and (force_scope is None or force_scope == scope.name)
            if rebuild or not target.exists():
                print(f"  [{index:02d}/{len(entries):02d}] z{zoom}/{x}/{y}")
                write_tile(target, style_tile(download(service_url(zoom, x, y)), zoom, x, y))
            hashes.append(digest_file(target))
            total_bytes += target.stat().st_size

        combined = hashlib.sha256("".join(hashes).encode("ascii")).hexdigest()
        manifest_scopes[scope.name] = {
            "bounds": list(scope.bounds),
            "minzoom": min(scope.zooms),
            "maxzoom": max(scope.zooms),
            "tile_count": len(entries),
            "tile_template": f"media/map-terrain/{scope.name}/{{z}}/{{x}}/{{y}}.webp",
            "combined_tile_sha256": combined,
        }

    removed = 0
    for existing in OUTPUT.glob("*/*/*/*.webp"):
        if existing not in expected_paths:
            existing.unlink()
            removed += 1

    manifest = {
        "version": 1,
        "generated_by": "tools/build-map-terrain.py",
        "source": {
            "name": "USGS National Map 3D Elevation Program (3DEP)",
            "service": SERVICE.rsplit("/exportImage", 1)[0],
            "rendering": "Hillshade Gray",
            "snapshot": SOURCE_SNAPSHOT,
            "retrieved": RETRIEVED,
            "usage": "Public domain; 3DEP products are free and have no use restrictions.",
        },
        "coast_mask": {
            "name": "Natural Earth 1:110m land",
            "path": str(LAND_PATH.relative_to(ROOT)),
            "sha256": digest_file(LAND_PATH),
            "usage": "Public domain.",
        },
        "presentation": {
            "format": "WebP",
            "tile_size": 256,
            "palette": {"shadow": "#4b4335", "highlight": "#b9ae91"},
            "quality": 74,
        },
        "scopes": manifest_scopes,
        "total_tile_bytes": total_bytes,
    }
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    suffix = f"; removed {removed} stale tile(s)" if removed else ""
    print(f"wrote {total_tiles} tiles ({total_bytes:,} bytes){suffix}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--force", action="store_true", help="download and rebuild existing tiles"
    )
    parser.add_argument(
        "--scope", choices=[scope.name for scope in SCOPES],
        help="with --force, rebuild only this scope while still validating the full manifest",
    )
    arguments = parser.parse_args()
    build(arguments.force, arguments.scope)
