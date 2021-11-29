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
    }

}
