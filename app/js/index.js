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
    editor.canvas.addEventListener("courseupdate", (e) => { updateToolbar(); });

    // side bar
    let toolbar = new Toolbar("JNSE Course Designer");

    let projectGroup = toolbar.addControlGroup("PROJECT");
    let projectButtons = toolbar.addButtonGroup(projectGroup);
    let projectOpen = toolbar.addButton(projectButtons, "Open Project", null);
    let projectSave = toolbar.addButton(projectButtons, "Save Project", null);
    let projectImport = toolbar.addButton(projectButtons, "Import Game Data", importGameData);
    let projectExport = toolbar.addButton(projectButtons, "Export Game Data", null);
    let projectFilenameInput = toolbar.addTextField(projectGroup, "Game Data Name", 8, (e) => { project.name = e.target.value; });

    let courseGroup = toolbar.addControlGroup("COURSE");
    let courseNameInput = toolbar.addTextField(courseGroup, "Course Name", 21, (e) => { project.course.name = e.target.value; });
    let courseQuoteInput = toolbar.addTextArea(courseGroup, "Course Quote", 120, (e) => { project.course.plot.quote = e.target.value; });
    let courseBoundsInput = toolbar.addDropdown(courseGroup, "Out of Bounds", ["Out of Bounds", "Heavy Rough"], (e) => { project.course.outOfBounds = parseInt(e.target.value); });
    let courseWindSpeedInput = toolbar.addDropdown(courseGroup, "Wind Speed", ["None", "Gentle", "Medium", "Strong"], (e) => { project.course.plot.windSpeed = parseInt(e.target.value); });
    let courseWindDirInput = toolbar.addDropdown(courseGroup, "Wind Direction", ["n/a", "North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"], (e) => { project.course.plot.windDir = parseInt(e.target.value); });
    let coursePlot = toolbar.addPlot(courseGroup, editor.plotImages[18], (e) => { editor.plotAlpha[18] = e.target.value/100; editor.update(); });
    let coursePlotButtons = toolbar.addButtonGroup(courseGroup);
    let courseShowPlot = toolbar.addButton(coursePlotButtons, "Show Plot", (e) => { editor.showPlot(18); });
    let courseEditPlot = toolbar.addButton(coursePlotButtons, "Edit Plot", null);
    let courseMovePlot = toolbar.addButton(coursePlotButtons, "Move Plot", null);

    let holeGroup = [];
    let holeParInput = [];
    let holeLengthInput = [];
    let holeRoutingButtons = [];
    let holeCreateRouting = [];
    let holeEditRouting = [];
    let holeDeleteRouting = [];
    let holeQuoteInput = [];
    let holeWallInput = [];
    let holePlot = [];
    let holePlotButtons = [];
    let holeShowPlot = [];
    let holeEditPlot = [];
    let holeMovePlot = [];
    for(let i = 0; i < 18; i++) {
        holeGroup[i] = toolbar.addControlGroup("HOLE "+(i+1));
        holeParInput[i] = toolbar.addDropdown(holeGroup[i], "Par", ["3", "4", "5"], (e) => { project.course.holeData[i].par = e.target.value + 3; });
        holeLengthInput[i] = toolbar.addTextField(holeGroup[i], "Length");
        holeRoutingButtons[i] = toolbar.addButtonGroup(holeGroup[i]);
        holeCreateRouting[i] = toolbar.addButton(holeRoutingButtons[i], "Create Routing", (e) => { editor.createRouting(i); });
        holeEditRouting[i] = toolbar.addButton(holeRoutingButtons[i], "Edit Routing", (e) => { editor.editRouting(i); });
        holeDeleteRouting[i] = toolbar.addButton(holeRoutingButtons[i], "Delete Routing", (e) => { editor.deleteRouting(i); });
        holeQuoteInput[i] = toolbar.addTextArea(holeGroup[i], "Hole Quote", 120, (e) => { project.course.holes[i].quote = e.target.value; });
        holeWallInput[i] = toolbar.addDropdown(holeGroup[i], "Wall Style", ["No Walls", "Railroad Ties", "Stone Walls"], (e) => { project.course.outofbounds = parseInt(e.target.value); });
        holePlot[i] = toolbar.addPlot(holeGroup[i], editor.plotImages[i], (e) => { editor.plotAlpha[i] = e.target.value/100; editor.update(); });
        holePlotButtons[i] = toolbar.addButtonGroup(holeGroup[i]);
        holeShowPlot[i] = toolbar.addButton(holePlotButtons[i], "Show Plot", (e) => { editor.showPlot(i); });
        holeEditPlot[i] = toolbar.addButton(holePlotButtons[i], "Edit Plot", null);
        holeMovePlot[i] = toolbar.addButton(holePlotButtons[i], "Move Plot", null);
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

        for(let i = 0; i < 18; i++) {
            holeParInput[i].value = project.course.holeData[i].par - 3;
            holeLengthInput[i].value = Math.round(project.course.getHoleLength(i));
            if(project.course.holeData[i].v.length) {
                holeCreateRouting[i].disabled = true;
                holeEditRouting[i].disabled = false;
                holeDeleteRouting[i].disabled = false;
                holeShowPlot[i].disabled = false;
                holeEditPlot[i].disabled = false;
                holeMovePlot[i].disabled = false;
            } else {
                holeCreateRouting[i].disabled = false;
                holeEditRouting[i].disabled = true;
                holeDeleteRouting[i].disabled = true;
                holeShowPlot[i].disabled = true;
                holeEditPlot[i].disabled = true;
                holeMovePlot[i].disabled = true;
            }
            holeQuoteInput[i].value = project.course.holes[i].quote;
            holeWallInput[i].value = project.course.holes[i].wallStyle;
        }
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
                        editor.update();
                    }
                    if(ext === "LDM") {
                        project.course.plot.loadData(JNSEBinaryData.expandFile(bytes));
                        editor.renderPlot(18);
                        editor.update();
                    }
                    for(let i = 0; i < 18; i++) {
                        if(ext === "H" + (i+1)) {
                            project.course.holes[i].loadData(JNSEBinaryData.expandFile(bytes));
                            editor.renderPlot(i);
                            editor.update();
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
