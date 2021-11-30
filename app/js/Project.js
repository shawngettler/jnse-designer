/**
 * Project.js
 * @author @shawngettler
 *
 * Class containing project data.
 */

import Course from "./golf/Course.js";



/**
 * Class for project data.
 */
export default class Project {

    /**
     * Create empty project.
     */
    constructor() {
        this.name = "UNNAMED";
        this.course = new Course();

        this.refData = {
            images: []
        };
    }



    /**
     * Convert the project to JSON.
     *
     * @return JSON string of project data
     */
    saveJSON() {
        let json = JSON.stringify(this, (k, v) => {
            if(v instanceof Uint8Array) {
                return Array.from(v);
            }
            if(v instanceof Image) {
                let c = document.createElement("canvas");
                c.width = v.width;
                c.height = v.height;
                c.getContext("2d").drawImage(v, 0, 0);
                return c.toDataURL();
            }
            return v;
        });
        return "data:text/json;charset=utf-8," + json;
    }

    /**
     * Restore the project data from a JSON string.
     *
     * @param json JSON string of project data
     */
    restoreJSON(json) {
        this.restoreData(JSON.parse(json));
    }

    /**
     * Restore data from object.
     *
     * @param o object containing project data
     */
    restoreData(o) {
        this.name = o.name;
        this.course.restoreData(o.course);

        this.refData.images = o.refData.images;
        for(let r of this.refData.images) {
            let data = r.image;
            r.image = new Image();
            r.image.src = data;
        }
    }

    /**
     * Add a reference image, e.g. satellite photo, to the project.
     *
     * @param img HTML image element
     * @param title label for reference
     */
    addImageReference(img, title) {
        let ref = {
            x: 0,
            y: 0,
            r: 0,
            s: 1,
            title: title,
            image: img
        };
        this.refData.images.push(ref);
    }

}
