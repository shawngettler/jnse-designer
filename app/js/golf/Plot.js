/**
 * Plot.js
 * @author @shawngettler
 *
 * CLass containing JNSE data for land plot.
 */



/**
 * Class containing land plot.
 */
export default class Plot {



    /**
     * Create a new, empty plot.
     */
    constructor() {

        // metadata
        this.quote = "";
        this.windDir = 0;
        this.windSpeed = 0;

        // terrain
        this.terr = new Array(240*120).fill(0);
        this.elev = new Array(240*120).fill(128);

        // objects
        this.objects = [];
    }



    /**
     * Load course plot from game file.
     *
     * @param data expanded byte array from data file
     */
    loadData(data) {

        // wind
        this.windDir = data[1];
        this.windSpeed = data[2];

        // mystery data data.slice(3,20);

        // course quote
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

        // mystery data data.slice(891,1011);

        // terrain
        this.terr = data.slice(1011, 29811);
        this.elev = data.slice(29811, 58611);
    }

    /**
     * Save course plot to game file.
     *
     * @return byte array for file
     */
    saveData() {
        let data = new Uint8Array(58611).fill(0);

        data.set([this.objects.length], 0);
        data.set([this.windDir], 1);
        data.set([this.windSpeed], 2);
        data.set(Array.from(this.quote).map(c => c.charCodeAt(0)), 20);
        for(let i = 0; i < this.objects.length; i++) {
            data.set([this.objects[i].type], 141+i);
            data.set([this.objects[i].x], 391+i);
            data.set([this.objects[i].y], 641+i);
        }
        data.set(this.terr, 1011);
        data.set(this.elev, 29811);

        return data;
    }



    /**
     * Restore data from object.
     *
     * @param o object containing plot data
     */
    restoreData(o) {
        this.quote = o.quote;
        this.windDir = o.windDir;
        this.windSpeed = o.windSpeed;

        this.terr = o.terr;
        this.elev = o.elev;

        this.objects = o.objects;
    }

}
