#!/usr/bin/env python3
"""Unpack a .fig file and decompress its canvas chunks.
Usage: python scripts/decode_fig.py path/to/File.fig outdir/
Produces: outdir/schema.bin, outdir/data.bin, outdir/images/*, outdir/meta.json
Then run: node scripts/decode_kiwi.js outdir/  (writes outdir/doc.json)
Requires: pip install zstandard
"""
import sys, os, struct, zlib, zipfile
import zstandard as zstd

def main(fig_path, outdir):
    os.makedirs(outdir, exist_ok=True)
    with zipfile.ZipFile(fig_path) as z:
        z.extractall(outdir)
    canvas = os.path.join(outdir, "canvas.fig")
    data = open(canvas, "rb").read()
    assert data[:8] == b"fig-kiwi", "not a fig-kiwi canvas"
    print("version:", struct.unpack("<I", data[8:12])[0])
    pos = 12
    # chunk 1: schema (raw DEFLATE)
    clen = struct.unpack("<I", data[pos:pos+4])[0]; pos += 4
    schema = zlib.decompress(data[pos:pos+clen], -15); pos += clen
    open(os.path.join(outdir, "schema.bin"), "wb").write(schema)
    # chunk 2: document (zstd)
    dlen = struct.unpack("<I", data[pos:pos+4])[0]; pos += 4
    blob = data[pos:pos+dlen]
    doc = zstd.ZstdDecompressor().stream_reader(blob).read()
    open(os.path.join(outdir, "data.bin"), "wb").write(doc)
    print("schema.bin:", len(schema), "data.bin:", len(doc))
    print("images:", len(os.listdir(os.path.join(outdir, "images"))) if os.path.isdir(os.path.join(outdir,"images")) else 0)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
