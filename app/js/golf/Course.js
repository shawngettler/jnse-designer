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
        this.x = 0;
        this.y = 0;
        this.r = 0;

        this.holeData = [];
        for(let i = 0; i < 18; i++) {
            this.holeData[i] = {
                par: 0,
                x: 0,
                y: 0,
                r: 0,
                v: []
            };
        }

        this.holeOverlay = [ 0, 0, 0, 0, 0, 0, 0, 0 ];
        this.outOfBounds = 0;

        this.palette = new Palette();

        // plot and holes
        this.plot = new Plot();
        this.holes = [];
        for(let i = 0; i < 18; i++) {
            this.holes[i] = new Hole();
        }

        // images
        this.panorama = new Panorama();
        this.objectData;
    }



    /**
     * Calculate length along hole routing.
     *
     * @param hole hole number
     *
     * @return length in yards
     */
    getHoleLength(hole) {
        let yds = 0;
        for(let i = 1; i < this.holeData[hole].v.length; i++) {
            yds += Math.hypot(this.holeData[hole].v[i].x-this.holeData[hole].v[i-1].x, this.holeData[hole].v[i].y-this.holeData[hole].v[i-1].y) * 8/3;
        }
        return yds;
    }



    /**
     * Load course metadata from game file.
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
            this.holeData[i].par = data[22+i];
            this.holeData[i].x = int16([data[41+i*2], data[41+i*2+1]]);
            this.holeData[i].y = int16([data[77+i*2], data[77+i*2+1]]);
            this.holeData[i].r = int16([data[113+i*2], data[113+i*2+1]]);

            this.holeData[i].v = [];
            for(let j = 0; j < data[149+i]; j++) {
                this.holeData[i].v[j] = {
                    x: int16([data[167+i*10+j*2], data[167+i*10+j*2+1]]),
                    y: int16([data[347+i*10+j*2], data[347+i*10+j*2+1]])
                };
            }
        }

        // mystery data data[40]

        // flags
        this.outOfBounds = data[527];
        this.holeOverlay = data.slice(528, 536);

        // palette
        this.palette.values = data.slice(536, 1304);
    }

    /**
     * Save course metadata to game file.
     *
     * @return byte array for file
     */
    saveData() {
        const uint8x2 = (i) => { return [(i >> 0) & 0xff, (i >> 8) & 0xff]; };

        let data = new Uint8Array(1304).fill(0);

        data.set(Array.from(this.name).map(c => c.charCodeAt(0)), 0);
        for(let i = 0; i < 18; i++) {
            data.set([this.holeData[i].par], 22+i);
            data.set(uint8x2(this.holeData[i].x), 41+i*2);
            data.set(uint8x2(this.holeData[i].y), 77+i*2);
            data.set(uint8x2(this.holeData[i].r), 113+i*2);
            data.set([this.holeData[i].v.length], 149+i);
            for(let j = 0; j < this.holeData[i].v.length; j++) {
                data.set(uint8x2(this.holeData[i].v[j].x), 167+i*10+j*2);
                data.set(uint8x2(this.holeData[i].v[j].y), 347+i*10+j*2);
            }
        }
        data.set([this.outOfBounds], 527);
        data.set(this.holeOverlay, 528);
        data.set(this.palette.values, 536);
        
        return data;
    }



    /**
     * Restore data from object.
     *
     * @param o object containing course data
     */
    restoreData(o) {
        this.name = o.name;
        this.x = o.x;
        this.y = o.y;
        this.r = o.r;

        this.holeData = o.holeData;

        this.holeOverlay = o.holeOverlay;
        this.outOfBounds = o.outOfBounds;

        this.palette.restoreData(o.palette);

        this.plot.restoreData(o.plot);
        for(let i = 0; i < 18; i++) {
            this.holes[i].restoreData(o.holes[i]);
        }

        this.panorama.restoreData(o.panorama);
    }

}
