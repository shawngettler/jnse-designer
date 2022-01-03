/**
 * ZipArchive.js
 * @author @shawngettler
 *
 * Static utilities for creating ZIP file archives for downloading.
 */



/**
 * Utilities for creating ZIP files.
 */
export default class ZipArchive {

    /**
     * Create an archive containing the supplied files.
     *
     * @param files array of objects containing filenames and data
     *
     * @return byte array of archive
     */
    static createArchive(files) {
        const concat = (a, b) => {
            let c = new Uint8Array(a.length + b.length);
            c.set(a, 0);
            c.set(b, a.length);
            return c;
        };

        const tablesig = Uint8Array.from([0x50, 0x4b, 0x01, 0x02]);
        const filesig = Uint8Array.from([0x50, 0x4b, 0x03, 0x04]);
        const endsig = Uint8Array.from([0x50, 0x4b, 0x05, 0x06]);

        const uint8x2 = (i) => { return [(i >> 0) & 0xff, (i >> 8) & 0xff]; };
        const uint8x4 = (i) => { return [(i >> 0) & 0xff, (i >> 8) & 0xff, (i >> 16) & 0xff, (i >> 24) & 0xff]; };

        const datenum = (d) => { return ((d.getFullYear()-1980) << 9) | ((d.getMonth()+1) << 5) | (d.getDate() << 0); };
        const timenum = (d) => { return (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds()/2) << 0); };

        let data = new Uint8Array();
        let table = new Uint8Array();
        for(let f of files) {
            let crc = ZipArchive.Crc32(f.data);

            let head = new Uint8Array(30+f.name.length);
            head.set(filesig, 0);
            head.set(uint8x2(20), 4); // version always 20
            head.set(uint8x2(timenum(f.date)), 10);
            head.set(uint8x2(datenum(f.date)), 12);
            head.set(uint8x4(crc), 14);
            head.set(uint8x4(f.data.length), 18); // compressed size n/a
            head.set(uint8x4(f.data.length), 22);
            head.set(uint8x2(f.name.length), 26);
            head.set(Array.from(f.name).map(c => c.charCodeAt(0)), 30);

            let thead = new Uint8Array(46+f.name.length);
            thead.set(tablesig, 0);
            thead.set(uint8x2(20), 4); // version always 20
            thead.set(uint8x2(20), 6); // version always 20
            thead.set(uint8x2(timenum(f.date)), 12);
            thead.set(uint8x2(datenum(f.date)), 14);
            thead.set(uint8x4(crc), 16);
            thead.set(uint8x4(f.data.length), 20); // compressed size n/a
            thead.set(uint8x4(f.data.length), 24);
            thead.set(uint8x4(f.name.length), 28);
            thead.set(uint8x4(32), 38); // external attributes always 32?
            thead.set(uint8x4(data.length), 42); // file offset
            thead.set(Array.from(f.name).map(c => c.charCodeAt(0)), 46);

            data = concat(data, concat(head, f.data));
            table = concat(table, thead);
        }

        let end = new Uint8Array(22);
        end.set(endsig, 0);
        end.set(uint8x2(files.length), 8);
        end.set(uint8x2(files.length), 10);
        end.set(uint8x4(table.length), 12);
        end.set(uint8x4(data.length), 16); // table offset

        return concat(data, concat(table, end));
    }



    /**
     * Calculate CRC for a byte array.
     *
     * @param data byte array
     *
     * @return CRC value
     */
    static Crc32(data) {
        const crctbl = (() => {
            const p = 0xedb88320;
            let t = [];
            for(let n = 0; n < 256; n++) {
                t[n] = n;
                for(let k = 0; k < 8; k++) {
                    t[n] = t[n] & 1 ? (t[n] >>> 1) ^ p : (t[n] >>> 1);
                }
            }
            return t;
        })();

        let r = -1;
        for(let i = 0; i < data.length; i++) {
            r = crctbl[(r ^ data[i]) & 0xff] ^ (r >>> 8);
        }
        return r ^ -1;
    }

}
