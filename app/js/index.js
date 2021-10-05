/**
 * index.js
 * @author @shawngettler
 *
 * Main.
 */

import Project from "./Project.js";

import JNSEBinaryData from "./io/JNSEBinaryData.js";

import Editor from "./ui/Editor.js";
import Toolbar from "./ui/Toolbar.js";



/*
 * Run app.
 */
(function() {
    let project = new Project();

    // editor interface
    let editor = new Editor(project.course);

    // side bar
    let toolbar = new Toolbar("JNSE Course Designer");

    let fileButtons = toolbar.addButtonGroup();
    let fileOpen = toolbar.addButton(fileButtons, "Open Project", null);
    let fileSave = toolbar.addButton(fileButtons, "Save Project", null);
    let fileImport = toolbar.addButton(fileButtons, "Import Game Data", importGameData);
    let fileExport = toolbar.addButton(fileButtons, "Export Game Data", null);

    let projectGroup = toolbar.addControlGroup("PROJECT");
    let projectFilenameInput = toolbar.addTextField(projectGroup, "Game Data Name", 8, (e) => { project.name = e.target.value; });

    let courseGroup = toolbar.addControlGroup("COURSE");
    let courseNameInput = toolbar.addTextField(courseGroup, "Course Name", 21, (e) => { project.course.name = e.target.value; });
    let courseQuoteInput = toolbar.addTextArea(courseGroup, "Course Quote", 120, (e) => { project.course.plot.quote = e.target.value; });
    let courseBoundsInput = toolbar.addDropdown(courseGroup, "Out of Bounds", ["Out of Bounds", "Heavy Rough"], (e) => { project.course.outOfBounds = parseInt(e.target.value); });
    let courseWindSpeedInput = toolbar.addDropdown(courseGroup, "Wind Speed", ["None", "Gentle", "Medium", "Strong"], (e) => { project.course.plot.windSpeed = parseInt(e.target.value); });
    let courseWindDirInput = toolbar.addDropdown(courseGroup, "Wind Direction", ["n/a", "North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"], (e) => { project.course.plot.windDir = parseInt(e.target.value); });
    let coursePlot = toolbar.addPlot(courseGroup, 240, 120, null, null);

    let holeGroup = [];
    let holeParInput = [];
    let holeQuoteInput = [];
    let holeWallInput = [];
    let holePlot = [];
    for(let i = 0; i < 18; i++) {
        holeGroup[i] = toolbar.addControlGroup("HOLE "+(i+1));
        holeParInput[i] = toolbar.addDropdown(holeGroup[i], "Par", ["3", "4", "5"], (e) => { project.course.holeData[i].par = e.target.value + 3; });
        holeQuoteInput[i] = toolbar.addTextArea(holeGroup[i], "Hole Quote", 120, (e) => { project.course.holes[i].quote = e.target.value; });
        holeWallInput[i] = toolbar.addDropdown(holeGroup[i], "Wall Style", ["No Walls", "Railroad Ties", "Stone Walls"], (e) => { project.course.outofbounds = parseInt(e.target.value); });
        holePlot[i] = toolbar.addPlot(holeGroup[i], 240, 80, null, null);
    }

    updateToolbar();



    // update fields
    function updateToolbar() {
        projectFilenameInput.value = project.name;

        courseNameInput.value = project.course.name;
        courseQuoteInput.value = project.course.plot.quote;
        courseBoundsInput.value = project.course.outOfBounds;
        courseWindSpeedInput.value = project.course.plot.windSpeed;
        courseWindDirInput.value = project.course.plot.windDir;
        coursePlot.getContext("2d").putImageData(new ImageData(project.course.renderPlot(project.course.plot.map), 240), 0, 0);

        for(let i = 0; i < 18; i++) {
            holeParInput[i].value = project.course.holeData[i].par - 3;
            holeQuoteInput[i].value = project.course.holes[i].quote;
            holeWallInput[i].value = project.course.holes[i].wallStyle;
            holePlot[i].getContext("2d").putImageData(new ImageData(project.course.renderPlot(project.course.holes[i].map), 240), 0, 0);
        }

        editor.update();
    };



    // file operations
    function importGameData() {
        let inputElement = document.createElement("input");
        inputElement.type = "file";
        inputElement.multiple = "true";
        inputElement.click();
        inputElement.addEventListener("change", (e) => {
            for(let f of inputElement.files) {
                let name = f.name.slice(0, f.name.lastIndexOf(".")).toUpperCase();
                let ext = f.name.slice(f.name.lastIndexOf(".") + 1).toUpperCase();

                const reader = new FileReader();
                reader.addEventListener("load", (e) => {
                    project.name = name;

                    let bytes = new Uint8Array(e.target.result);
                    if(ext === "PRC") {
                        project.course.loadData(bytes);
                    }
                    if(ext === "LDM") {
                        project.course.plot.loadData(JNSEBinaryData.expandFile(bytes));
                    }
                    for(let i = 0; i < 18; i++) {
                        if(ext === "H" + (i+1)) {
                            project.course.holes[i].loadData(JNSEBinaryData.expandFile(bytes));
                        }
                    }
                    if(ext === "DZV") {
                        project.course.panorama.loadData(JNSEBinaryData.expandFile(bytes));
                    }
                    if(ext === "OMM") {
                    }
                    if(ext === "MIN") {
                    }
                    updateToolbar();
                });
                reader.readAsArrayBuffer(f);
            }
        });
    }



})();
