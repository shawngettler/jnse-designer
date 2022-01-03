/**
 * JNSEBinaryData.js
 * @author @shawngettler
 *
 * Static utilities for reading JNSE binary data.
 */



/**
 * Utilities for reading binary data.
 */
export default class JNSEBinaryData {

    /**
     * Expand data files to full size.
     *
     * @param pack byte array from a packed data file
     *
     * @return unpacked data
     */
    static expandFile(pack) {

        // header
        let fileCode = String.fromCharCode.apply(null, pack.slice(0, 2));
        let fileSize = pack[2] | (pack[3] << 8);

        if(fileCode == "bs") {
            return JNSEBinaryData.expandRLE(pack.slice(4));

        } else if(fileCode == "pk") {
            // no idea how to read this yet
        }

    }

    /**
     * Compress data file.
     *
     * @param data unpacked data
     *
     * @return byte array for data file
     */
    static compressFile(data) {
        let rle = JNSEBinaryData.compressRLE(data);

        let pack = new Uint8Array(rle.length+4);
        pack.set(Array.from("bs").map(c => c.charCodeAt(0)), 0);
        pack.set([(pack.length >> 0) & 0xff, (pack.length >> 8) & 0xff], 2);
        pack.set(rle, 4);
        return pack;
    }



    /**
     * Expand run length encoded data to full size.
     *
     * I had a nice recursive function here, but long files exceeded the stack
     * size limit.
     *
     * @param pack byte array of packed data
     *
     * @return unpacked data
     */
    static expandRLE(pack) {
        const concat = (a, b) => {
            let c = new Uint8Array(a.length + b.length);
            c.set(a, 0);
            c.set(b, a.length);
            return c;
        };

        let i = 0;
        let data = new Uint8Array();
        while(i < pack.length) {
            if(pack[i] < 128) {
                data = concat(data, pack.slice(i+1, i+1 + pack[i]));
                i += pack[i] + 1;
            } else {
                data = concat(data, new Uint8Array(257 - pack[i]).fill(pack[i+1]));
                i += 2;
            }
        }
        return data;
    }

    /**
     * Compress data to be run length encoded.
     *
     * @param data unpacked data
     *
     * @return byte array of packed data
     */
    static compressRLE(data) {
        const concat = (a, b) => {
            let c = new Uint8Array(a.length + b.length);
            c.set(a, 0);
            c.set(b, a.length);
            return c;
        };

        let pack = new Uint8Array();
        let i = 0;
        while(i < data.length) {
            let rl = 1;
            let r = concat(Uint8Array.from([rl]), data.slice(i, i+rl));

            while(i+rl < data.length && rl < 129 && data[i+rl] == data[i]) {
                rl++;
                r = concat(Uint8Array.from([257-rl]), data.slice(i, i+1));
            }
            while(i+rl+1 < data.length && rl < 127 && data[i+1] != data[i] && data[i+rl+1] != data[i+rl]) {
                rl++;
                r = concat(Uint8Array.from([rl]), data.slice(i, i+rl));
            }
            pack = concat(pack, r);
            i += rl;
        }

        return pack;
    }

}
