/**
 * Course.js
 * @author @shawngettler
 *
 * CLass containing all JNSE course data.
 */

import JNSEBinaryData from "../io/JNSEBinaryData.js";

import Palette from "./Palette.js";

import Panorama from "./Panorama.js";
import Plot from "./Plot.js";
import Hole from "./Hole.js";



/**
 * Class containing course data.
 */
export default class Course {



    /**
     * Create a new, empty course.
     */
    constructor() {

        // metadata
        this.name = "Unnamed Course";
        this.holedata = [];
        for(let i = 0; i < 18; i++) {
            this.holedata[i] = { par: 0 };
        }

        this.holeoverlay = [ false, false, false, false, false, false, false, false ];
        this.heavyrough = false;

        this.palette = new Palette();

        // plot and holes
        this.plot = new Plot();
        this.holes = [];
        for(let i = 0; i < 18; i++) {
            this.holes[i] = new Hole();
        }

        // images
        this.panorama = new Panorama();
        this.objectlib;
    }



    /**
     * Load course metadata from file. Data is always raw binary.
     *
     * @param data byte array from file
     */
    loadData(data) {
        const int16 = (b) => { return b[1] & 0x80 ? 0xffff0000 | b[0] | (b[1] << 8) : b[0] | (b[1] << 8); };

        // course name
        this.name = String.fromCharCode.apply(null, data.slice(0, 22));
        this.name = this.name.slice(0, this.name.indexOf("\0"));

        // hole routing
        for(let i = 0; i < 18; i++) {
            this.holedata[i] = {
                par: data[22+i],
                x: int16([data[41+i*2], data[41+i*2+1]]),
                y: int16([data[77+i*2], data[77+i*2+1]]),
                r: int16([data[113+i*2], data[113+i*2+1]]), // out of 600
                v: []
            };
            for(let j = 0; j < data[149+i]; j++) {
                this.holedata[i].v[j] = {
                    x: int16([data[167+i*10+j*2], data[167+i*10+j*2+1]]),
                    y: int16([data[347+i*10+j*2], data[347+i*10+j*2+1]])
                };
            }
        }

        // mystery data data[40]

        // flags
        this.heavyrough = data[527] == 0x01;
        for(let i = 0; i < 8; i++) {
            this.holeoverlay[i] = data[528+i] == 0x01;
        }

        // palette
        this.palette.values = data.slice(536, 1304);
    }

}
