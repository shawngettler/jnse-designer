/**
 * Panorama.js
 * @author @shawngettler
 *
 * CLass containing background panorama image.
 */



/**
 * Class containing panorama.
 */
export default class Panorama {



    /**
     * Create a new, empty image.
     */
    constructor() {
        this.image = new Array(1200*47).fill(128);
    }



    /**
     * Load image from file.
     *
     * @param data expanded byte array from file
     */
    loadData(data) {
        this.image = data;
    }

}