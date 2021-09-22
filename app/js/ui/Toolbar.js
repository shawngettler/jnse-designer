/**
 * Toolbar.js
 * @author @shawngettler
 *
 * Class to create an HTML toolbar.
 */



/**
 * Class to build an HTML toolbar and input elements. Toolbar is fixed to the
 * left side of the window and slides offscreen.
 */
export default class Toolbar {



    /**
     * Create an empty toolbar.
     *
     * @param title header text for the toolbar
     */
    constructor(title) {
        let toolbarElement = document.createElement("div");
        toolbarElement.id = "toolbar";
        document.getElementById("app-container").appendChild(toolbarElement);
        this.container = document.createElement("div");
        this.container.id = "toolbar-container";
        toolbarElement.appendChild(this.container);
        let toolbarTitle = document.createElement("div");
        toolbarTitle.classList.add("toolbar-title");
        toolbarTitle.appendChild(document.createTextNode(title));
        this.container.appendChild(toolbarTitle);

        let toolbarControls = document.createElement("div");
        toolbarControls.id = "toolbar-controls";
        toolbarElement.appendChild(toolbarControls);
        let toolbarArrow = document.createElement("span");
        toolbarArrow.classList.add("material-icons");
        toolbarArrow.innerHTML = "keyboard_arrow_left";
        toolbarControls.appendChild(toolbarArrow);

        let toolbarVisible = true;
        toolbarControls.addEventListener("click", (e) => {
            if(toolbarVisible) {
                toolbarElement.style.left = "-360px";
                toolbarArrow.innerHTML = "keyboard_arrow_right";
                toolbarVisible = false;
            } else {
                toolbarElement.style.left = "0px";
                toolbarArrow.innerHTML = "keyboard_arrow_left";
                toolbarVisible = true;
            }
        });
    }



    /**
     * Add a container to group input controls.
     *
     * @param title header for group
     *
     * @return DOM element for the group of controls
     */
    addControlGroup(title) {
        let groupElement = document.createElement("div");
        groupElement.classList.add("control-group");
        this.container.appendChild(groupElement);
        let groupTitle = document.createElement("div");
        groupTitle.classList.add("control-group-title");
        groupTitle.appendChild(document.createTextNode(title));
        groupElement.appendChild(groupTitle);

        return groupElement;
    }

    /**
     * Add a container to group buttons.
     *
     * @return DOM element for the group of buttons
     */
    addButtonGroup() {
        let groupElement = document.createElement("div");
        groupElement.classList.add("button-group");
        this.container.appendChild(groupElement);

        return groupElement;
    }



    /**
     * Add a text field input with a set maximum length.
     *
     * @param group DOM element for the group of controls
     * @param title label for input
     * @param maxLength max number of characters
     * @param callback callback when value changes
     *
     * @return input element with value
     */
    addTextField(group, title, maxLength, callback) {
        let fieldElement = document.createElement("div");
        fieldElement.classList.add("control-item");
        group.appendChild(fieldElement);
        let fieldTitle = document.createElement("div");
        fieldTitle.classList.add("control-item-title");
        fieldTitle.appendChild(document.createTextNode(title));
        fieldElement.appendChild(fieldTitle);
        let fieldValue = document.createElement("input");
        fieldValue.type = "text";
        fieldValue.classList.add("control-item-textfield");
        fieldValue.maxLength = maxLength;
        fieldValue.addEventListener("change", callback);
        fieldValue.addEventListener("keydown", (e) => { if(e.key === "Enter") fieldValue.blur(); });
        fieldElement.appendChild(fieldValue);
        return fieldValue;
    }

    /**
     * Add a text area input with a set maximum length.
     *
     * @param group DOM element for the group of controls
     * @param title label for input
     * @param maxLength max number of characters
     * @param callback callback when value changes
     *
     * @return input element with value
     */
    addTextArea(group, title, maxLength, callback) {
        let areaElement = document.createElement("div");
        areaElement.classList.add("control-item");
        group.appendChild(areaElement);
        let areaTitle = document.createElement("div");
        areaTitle.classList.add("control-item-title");
        areaTitle.appendChild(document.createTextNode(title));
        areaElement.appendChild(areaTitle);
        let areaValue = document.createElement("textarea");
        areaValue.classList.add("control-item-textarea");
        areaValue.cols = 18;
        areaValue.rows = 8;
        areaValue.maxLength = maxLength;
        areaValue.addEventListener("change", callback);
        areaElement.appendChild(areaValue);
        return areaValue;
    }

    /**
     * Add a drop down menu with defined options.
     *
     * @param group DOM element for the group of controls
     * @param title label for input
     * @param options array of strings to display
     * @param callback callback when value changes
     *
     * @return input element with value
     */
    addDropdown(group, title, options, callback) {
        let dropElement = document.createElement("div");
        dropElement.classList.add("control-item");
        group.appendChild(dropElement);
        let dropTitle = document.createElement("div");
        dropTitle.classList.add("control-item-title");
        dropTitle.appendChild(document.createTextNode(title));
        dropElement.appendChild(dropTitle);
        let dropValue = document.createElement("select");
        dropValue.classList.add("control-item-dropdown");
        for(let i = 0; i < options.length; i++) {
            let optionElement = document.createElement("option");
            optionElement.classList.add("control-item-dropdown-option");
            optionElement.value = i;
            optionElement.appendChild(document.createTextNode(options[i]));
            dropValue.appendChild(optionElement);
        }
        dropValue.addEventListener("change", callback);
        dropValue.addEventListener("change", (e) => { dropValue.blur(); });
        dropElement.appendChild(dropValue);
        return dropValue;
    }

    /**
     * Add a button.
     *
     * @param group DOM element for the group of buttons
     * @param title label for input
     * @param callback callback when button is clicked
     */
    addButton(group, title, callback) {
        let buttonElement = document.createElement("div");
        buttonElement.classList.add("button-item");
        buttonElement.appendChild(document.createTextNode(title));
        buttonElement.addEventListener("click", callback);
        group.appendChild(buttonElement);
    }



    /**
     * Add an image of a land plot with control buttons.
     *
     * @param group DOM element for the group of controls
     * @param width image width
     * @param height image height
     * @param showCallback callback when show/hide is clicked
     * @param zoomCallback callback when zoom is clicked
     *
     * @return image element with value to set
     */
    addPlot(group, width, height, showCallback, zoomCallback) {
        let plotElement = document.createElement("div");
        plotElement.classList.add("control-item");
        group.appendChild(plotElement);
        let plotCanvas = document.createElement("canvas");
        plotCanvas.classList.add("control-item-plot-canvas");
        plotCanvas.width = width;
        plotCanvas.height = height;
        plotElement.appendChild(plotCanvas);
        let plotButtonGroup = document.createElement("div");
        plotButtonGroup.classList.add("control-item-plot-button-group");
        plotElement.appendChild(plotButtonGroup);
        let showButton = document.createElement("div");
        showButton.classList.add("control-item-plot-button-item");
        showButton.appendChild(document.createTextNode("SHOW"));
        showButton.addEventListener("click", showCallback);
        plotButtonGroup.appendChild(showButton);
        let zoomButton = document.createElement("div");
        zoomButton.classList.add("control-item-plot-button-item");
        zoomButton.appendChild(document.createTextNode("ZOOM TO"));
        zoomButton.addEventListener("click", zoomCallback);
        plotButtonGroup.appendChild(zoomButton);
        return plotCanvas;
    }

}
