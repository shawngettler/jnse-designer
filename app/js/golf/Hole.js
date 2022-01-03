/**
 * Hole.js
 * @author @shawngettler
 *
 * CLass containing all JNSE data for one hole.
 */



/**
 * Class containing hole.
 */
export default class Hole {



    /**
     * Create a new, empty hole.
     */
    constructor() {

        // metadata
        this.quote = "";
        this.wallStyle = 0;

        // terrain
        this.terr = new Array(240*80).fill(0);
        this.elev = new Array(240*80).fill(128);

        // objects
        this.objects = [];
        this.tees = [];
        this.pins = [];
    }



    /**
     * Load hole plot from game file.
     *
     * @param data expanded byte array from data file
     */
    loadData(data) {

        // flags
        this.wallStyle = data[9];

        // mystery data data.slice(1,9);
        // mystery data data.slice(10,20);

        // hole quote
        this.quote = String.fromCharCode.apply(null, data.slice(20, 141));
        this.quote = this.quote.slice(0, this.quote.indexOf("\0"));

        // objects
        for(let i = 0; i < data[0]; i++) {
            this.objects[i] = {
                type: data[141+i],
                x: data[391+i],
                y: data[641+i]
            };
        }
        for(let i = 0; i < 4; i++) {
            this.tees[i] = {
                type: data[382+i], // 1-4, inconsistently set
                x: data[632+i],
                y: data[882+i]
            }
        }
        for(let i = 0; i < 5; i++) {
            this.pins[i] = {
                type: data[386+i], // 1-5, inconsistently set
                x: data[636+i],
                y: data[886+i]
            }
        }

        // mystery data data.slice(891,1011);

        // terrain
        this.terr = data.slice(1011, 20211);
        this.elev = data.slice(20211, 39411);
    }

    /**
     * Save hole plot to game file.
     *
     * @return byte array for file
     */
    saveData() {
        let data = new Uint8Array(39411).fill(0);

        data.set([this.objects.length], 0);
        data.set([this.wallStyle], 9);
        data.set(Array.from(this.quote).map(c => c.charCodeAt(0)), 20);
        for(let i = 0; i < this.objects.length; i++) {
            data.set([this.objects[i].type], 141+i);
            data.set([this.objects[i].x], 391+i);
            data.set([this.objects[i].y], 641+i);
        }
        for(let i = 0; i < this.tees.length; i++) {
            data.set([this.objects[i].type], 382+i);
            data.set([this.objects[i].x], 632+i);
            data.set([this.objects[i].y], 882+i);
        }
        for(let i = 0; i < this.pins.length; i++) {
            data.set([this.objects[i].type], 386+i);
            data.set([this.objects[i].x], 636+i);
            data.set([this.objects[i].y], 886+i);
        }
        data.set(this.terr, 1011);
        data.set(this.elev, 20211);

        return data;
    }



    /**
     * Restore data from object.
     *
     * @param o object containing hole data
     */
    restoreData(o) {
        this.quote = o.quote;
        this.wallStyle = o.wallStyle;

        this.terr = o.terr;
        this.elev = o.elev;

        // objects
        this.objects = o.objects;
        this.tees = o.tees;
        this.pins = o.pins;
    }

}
