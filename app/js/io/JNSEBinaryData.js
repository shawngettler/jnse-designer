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
        let out = new Uint8Array();
        while(i < pack.length) {
            if(pack[i] < 128) {
                out = concat(out, pack.slice(i+1, i+1 + pack[i]));
                i += pack[i] + 1;
            } else {
                out = concat(out, new Uint8Array(257 - pack[i]).fill(pack[i+1]));
                i += 2;
            }
        }
        return out;
    }

}
