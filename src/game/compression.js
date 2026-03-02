// ============================================================
// COMPRESSION.JS - RLE encoding/decoding utilities
// ============================================================
// Pure utility functions with no state dependencies.
// Used by the save/load system to compress world arrays.
// ============================================================

export function rleEncode(worldArr) {
    const flat = [];
    for (let x = 0; x < worldArr.length; x++) {
        for (let y = 0; y < worldArr[x].length; y++) {
            flat.push(worldArr[x][y]);
        }
    }
    const runs = [];
    let i = 0;
    while (i < flat.length) {
        const val = flat[i];
        let count = 1;
        while (i + count < flat.length && flat[i + count] === val) count++;
        runs.push(val + ":" + count);
        i += count;
    }
    return runs.join(",");
}

export function rleDecode(encoded, width, height) {
    const arr = [];
    for (let x = 0; x < width; x++) {
        arr[x] = new Array(height);
    }
    const runs = encoded.split(",");
    let idx = 0;
    for (const run of runs) {
        const parts = run.split(":");
        const val = parseInt(parts[0]);
        const count = parseInt(parts[1]);
        for (let i = 0; i < count; i++) {
            const x = Math.floor(idx / height);
            const y = idx % height;
            if (x < width && y < height) arr[x][y] = val;
            idx++;
        }
    }
    return arr;
}
