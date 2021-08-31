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
        this.map = new Array(240*80).fill(0);
        this.elev = new Array(240*80).fill(128);

        // objects
        this.objects = [];
        this.tees = [];
        this.pins = [];
    }



    /**
     * Load hole plot from file.
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
        this.map = data.slice(1011, 20211);
        this.elev = data.slice(20211, 39411);
    }

}
