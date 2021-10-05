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

}
