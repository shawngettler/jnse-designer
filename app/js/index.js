/**
 * index.js
 * @author @shawngettler
 *
 * Main.
 */

import Project from "./Project.js";

import JNSEBinaryData from "./io/JNSEBinaryData.js";
import ZipArchive from "./io/ZipArchive.js";

import Editor from "./ui/Editor.js";
import Toolbar from "./ui/Toolbar.js";



/*
 * Run app.
 */
(function() {
    let project = new Project();

    // editor interface
    let editor = new Editor(project.course, project.refData);
    editor.canvas.addEventListener("courseupdate", (e) => { updateToolbar(); });

    // side bar
    let toolbar = new Toolbar("JNSE Course Designer");

    let projectGroup = toolbar.addControlGroup("PROJECT");
    let projectButtons = toolbar.addButtonGroup(projectGroup);
    let projectOpen = toolbar.addButton(projectButtons, "Open Project", (e) => { openProject(); });
    let projectSave = toolbar.addButton(projectButtons, "Save Project", (e) => { saveProject(); });
    let projectButtonBreak = toolbar.addButtonBreak(projectButtons);
    let projectImport = toolbar.addButton(projectButtons, "Import Game Data", importGameData);
    let projectExport = toolbar.addButton(projectButtons, "Export Game Data", exportGameData);
    let projectImage = toolbar.addButton(projectButtons, "Add Image Reference", (e) => { openRef(); });
    let projectDEM = toolbar.addButton(projectButtons, "Add Height Reference", null);
    projectDEM.disabled = true;
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
    let courseEditPlot = toolbar.addButton(coursePlotButtons, "Edit Plot", (e) => { editor.editPlot(18); });
    let courseMovePlot = toolbar.addButton(coursePlotButtons, "Move Plot", (e) => { editor.movePlot(18); });

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
        holeLengthInput[i] = toolbar.addText(holeGroup[i], "Length");
        holeRoutingButtons[i] = toolbar.addButtonGroup(holeGroup[i]);
        holeCreateRouting[i] = toolbar.addButton(holeRoutingButtons[i], "Create Routing", (e) => { editor.createRouting(i); });
        holeEditRouting[i] = toolbar.addButton(holeRoutingButtons[i], "Edit Routing", (e) => { editor.editRouting(i); });
        holeDeleteRouting[i] = toolbar.addButton(holeRoutingButtons[i], "Delete Routing", (e) => { editor.deleteRouting(i); });
        holeQuoteInput[i] = toolbar.addTextArea(holeGroup[i], "Hole Quote", 120, (e) => { project.course.holes[i].quote = e.target.value; });
        holeWallInput[i] = toolbar.addDropdown(holeGroup[i], "Wall Style", ["No Walls", "Railroad Ties", "Stone Walls"], (e) => { project.course.outofbounds = parseInt(e.target.value); });
        holePlot[i] = toolbar.addPlot(holeGroup[i], editor.plotImages[i], (e) => { editor.plotAlpha[i] = e.target.value/100; editor.update(); });
        holePlotButtons[i] = toolbar.addButtonGroup(holeGroup[i]);
        holeShowPlot[i] = toolbar.addButton(holePlotButtons[i], "Show Plot", (e) => { editor.showPlot(i); });
        holeEditPlot[i] = toolbar.addButton(holePlotButtons[i], "Edit Plot", (e) => { editor.editPlot(i); });
        holeMovePlot[i] = toolbar.addButton(holePlotButtons[i], "Move Plot", (e) => { editor.movePlot(i); });
    }

    let refGroup = [];
    let refScaleInput = [];
    let refImageButtons = [];
    let refShowImage = [];
    let refMoveImage = [];

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
            holeQuoteInput[i].value = project.course.holes[i].quote;
            holeWallInput[i].value = project.course.holes[i].wallStyle;
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
        }
    }

    function updateReferences() {
        for(let g of refGroup) {
            toolbar.removeControlGroup(g);
        }
        refGroup = [];
        for(let i = 0; i < project.refData.images.length; i++) {
            let r = project.refData.images[i];
            refGroup[i] = toolbar.addControlGroup("IMAGE "+r.title);
            refScaleInput[i] = toolbar.addTextField(refGroup[i], "Image Scale (ft/px)", 21, (e) => { r.s = e.target.value; editor.update(); });
            refScaleInput[i].value = r.s;
            refImageButtons[i] = toolbar.addButtonGroup(refGroup[i]);
            refShowImage[i] = toolbar.addButton(refImageButtons[i], "Show Ref Image", (e) => { editor.showRef(r); });
            refMoveImage[i] = toolbar.addButton(refImageButtons[i], "Move Ref Image", (e) => { editor.moveRef(r); });
        }
    }


    // file operations
    function openProject() {
        let inputElement = document.createElement("input");
        inputElement.type = "file";
        inputElement.addEventListener("change", (e) => {
            const reader = new FileReader();
            reader.addEventListener("load", (e) => {
                project.restoreJSON(e.target.result);
                for(let i = 0; i < 19; i++) {
                    editor.renderPlot(i);
                }
                editor.update();
                updateToolbar();
                updateReferences();
            });
            reader.readAsText(inputElement.files[0]);
        });
        inputElement.click();
    }

    function saveProject() {
        let anchorElement = document.createElement("a");
        anchorElement.href = project.saveJSON();
        anchorElement.download = project.name+".json";
        anchorElement.click();
    }

    function importGameData() {
        let inputElement = document.createElement("input");
        inputElement.type = "file";
        inputElement.multiple = "true";
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
                        for(let i = 0; i < 19; i++) {
                            editor.renderPlot(i);
                        }
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
                    // if(ext === "OMM") {
                    // }
                    // if(ext === "MIN") {
                    // }
                    updateToolbar();
                });
                reader.readAsArrayBuffer(f);
            }
        });
        inputElement.click();
    }

    function exportGameData() {
        let files = [];
        files.push({ name: project.name+".PRC", data: project.course.saveData(), date: new Date() });
        files.push({ name: project.name+".LDM", data: JNSEBinaryData.compressFile(project.course.plot.saveData()), date: new Date() });
        for(let i = 0; i < 18; i++) {
            files.push({ name: project.name+".H"+(i+1), data: JNSEBinaryData.compressFile(project.course.holes[i].saveData()), date: new Date() });
        }
        files.push({ name: project.name+".DZV", data: JNSEBinaryData.compressFile(project.course.panorama.saveData()), date: new Date() });
        // files.push({ name: project.name+".OMM", data: null, date: new Date() });
        // files.push({ name: project.name+".MIN", data: null, date: new Date() });
        let zip = new Blob([ZipArchive.createArchive(files)], { type: "application/octet-stream" });

        let anchorElement = document.createElement("a");
        anchorElement.href = window.URL.createObjectURL(zip);
        anchorElement.download = project.name+".zip";
        anchorElement.click();
    }

    function openRef() {
        let inputElement = document.createElement("input");
        inputElement.type = "file";
        inputElement.addEventListener("change", (e) => {
            const reader = new FileReader();
            reader.addEventListener("load", (e) => {
                let img = new Image();
                img.src = e.target.result;
                project.addImageReference(img, inputElement.files[0].name);

                editor.update();
                updateToolbar();
                updateReferences();
            });
            reader.readAsDataURL(inputElement.files[0]);
        });
        inputElement.click();
    }



})();
