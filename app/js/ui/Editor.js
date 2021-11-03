/**
 * Editor.js
 * @author @shawngettler
 *
 * Graphical editor interface.
 */

import Palette from "../golf/Palette.js";



/**
 * Class for editor interface.
 */
export default class Editor {

    // editor states
    static DEFAULT_VIEW = "view course";
    static LAYOUT_ADD = "add hole layout";
    static LAYOUT_EDIT = "edit hole layout";
    static PLOT_EDIT = "edit hole plot";
    static PLOT_MOVE = "move hole plot";



    /**
     * Create interface.
     *
     * @param course Course object
     */
    constructor(course) {

        // editor
        this.course = course;

        this.state = Editor.DEFAULT_VIEW;

        this.plotAlpha = [];
        this.plotVisible = [];
        this.plotImages = [];
        for(let i = 0; i < 19; i++) {
            this.plotAlpha[i] = 1;
            this.plotVisible[i] = false;

            this.plotImages[i] = document.createElement('canvas');
            this.plotImages[i].width = 240;
            this.plotImages[i].height = i == 18 ? 120 : 80;
            this.renderPlot(i);
        }

        let editorElement = document.createElement("div");
        editorElement.id = "editor";
        document.getElementById("app-container").appendChild(editorElement);
        this.canvas = document.createElement("canvas");
        this.canvas.id = "editor-canvas";
        editorElement.appendChild(this.canvas);


        // terrain palette
        this.paintTerr = 0;
        this.paintPixel = null;

        this.paintTools = document.createElement("div");
        this.paintTools.id = "editor-tools";
        editorElement.appendChild(this.paintTools);
        this.paintSwatches = [];
        let paintSwatchTitles = ["Out of Bounds", "Tee Box", "Sand", "Water", "Rough", "Fairway", "Green", "Cart Path"];
        for(let i = 0; i < 8; i++) {
            let paintItem = document.createElement("div");
            paintItem.classList.add("editor-tools-item");
            this.paintTools.appendChild(paintItem);
            this.paintSwatches[i] = document.createElement("div");
            this.paintSwatches[i].classList.add("editor-tools-swatch");
            this.paintSwatches[i].addEventListener("click", (e) => { this.setPaint(i); });
            paintItem.appendChild(this.paintSwatches[i]);
            let paintTitle = document.createElement("div");
            paintTitle.classList.add("editor-tools-swatch-title");
            paintTitle.appendChild(document.createTextNode(paintSwatchTitles[i]));
            paintItem.appendChild(paintTitle);
        }
        this.hidePaintTools();


        // user input
        this.canvas.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });

        this.holeEdit = -1;
        this.vertexMove = null;
        this.vertexRot = null;

        this.canvas.addEventListener("mousemove", (e) => {
            if(this.state === Editor.LAYOUT_ADD) {
                if(this.vertexMove) {
                    this.modifyRouting(e.offsetX, e.offsetY);
                }
            }
            if(this.state === Editor.LAYOUT_EDIT) {
                if(this.vertexMove) {
                    this.modifyRouting(e.offsetX, e.offsetY);
                } else if(this.queryRouting(e.offsetX, e.offsetY)) {
                    this.canvas.style.cursor = "move";
                } else {
                    this.canvas.style.cursor = "";
                }
            }
            if(this.state === Editor.PLOT_MOVE) {
                if(this.vertexMove) {
                    this.modifyPlot(e.offsetX, e.offsetY);
                } else if(this.vertexRot) {
                    this.rotatePlot(e.offsetX, e.offsetY);
                } else if(this.queryPlotMove(e.offsetX, e.offsetY)) {
                    this.canvas.style.cursor = "move";
                } else if(this.queryPlotRotate(e.offsetX, e.offsetY)) {
                    this.canvas.style.cursor = "grab";
                } else {
                    this.canvas.style.cursor = "";
                }
            }
            if(this.state === Editor.PLOT_EDIT) {
                this.paintPixel = this.queryPlot(e.offsetX, e.offsetY);
                if(this.paintPixel) {
                    this.canvas.style.cursor = "crosshair";
                    if(e.buttons == 1) {
                        this.paintPlot();
                    }
                } else {
                    this.canvas.style.cursor = "";
                }
            }
        });
        this.canvas.addEventListener("mousedown", (e) => {
            if(this.state === Editor.LAYOUT_EDIT) {
                if(this.queryRouting(e.offsetX, e.offsetY) && e.button == 0) {
                    this.vertexMove = this.queryRouting(e.offsetX, e.offsetY);
                    this.canvas.style.cursor = "none";
                }
            }
            if(this.state === Editor.PLOT_MOVE) {
                if(this.queryPlotMove(e.offsetX, e.offsetY) && e.button == 0) {
                    this.vertexMove = this.queryPlotMove(e.offsetX, e.offsetY);
                    this.canvas.style.cursor = "none";
                } else if(this.queryPlotRotate(e.offsetX, e.offsetY) && e.button == 0) {
                    this.vertexRot = this.queryPlotRotate(e.offsetX, e.offsetY);
                    this.canvas.style.cursor = "grabbing";
                }
            }
            if(this.state === Editor.PLOT_EDIT) {
                this.paintPixel = this.queryPlot(e.offsetX, e.offsetY);
                if(this.paintPixel && e.button == 0) {
                    this.paintPlot();
                }
            }
        });
        this.canvas.addEventListener("mouseup", (e) => {
            if(this.state === Editor.LAYOUT_ADD) {
                if(e.button == 0) {
                    this.addRouting();
                } else if(e.button == 2) {
                    this.endRouting();
                }
            }
            if(this.state === Editor.LAYOUT_EDIT) {
                if(this.vertexMove && e.button == 0) {
                    this.vertexMove = null;
                    this.canvas.style.cursor = "move";
                } else if(e.button == 2) {
                    this.holeEdit = -1;
                    this.state = Editor.DEFAULT_VIEW;
                    this.update();
                }
            }
            if(this.state === Editor.PLOT_MOVE) {
                if(this.vertexMove && e.button == 0) {
                    this.vertexMove = null;
                    this.canvas.style.cursor = "move";
                } else if(this.vertexRot && e.button == 0) {
                    this.vertexRot = null;
                    this.canvas.style.cursor = "grab";
                } else if(e.button == 2) {
                    this.holeEdit = -1;
                    this.state = Editor.DEFAULT_VIEW;
                    this.update();
                }
            }
            if(this.state === Editor.PLOT_EDIT) {
                if(e.button == 2) {
                    this.holeEdit = -1;
                    this.paintPixel = null;
                    this.state = Editor.DEFAULT_VIEW;
                    this.canvas.style.cursor = "";
                    this.hidePaintTools();
                    this.update();
                }
            }
        });


        // navigation
        this.editorX = 0;
        this.editorY = 0;
        this.editorR = 0;
        this.editorScale = 1;
        this.editorScaleMax = 100;
        this.editorScaleMin = 0.01;

        this.canvas.addEventListener("wheel", (e) => {
            let zoomX = (e.offsetX - this.editorX)/this.editorScale;
            let zoomY = (-e.offsetY + this.editorY)/this.editorScale;
            this.editorScale *= 1 - e.deltaY/1000;
            this.editorScale = Math.min(Math.max(this.editorScale, this.editorScaleMin), this.editorScaleMax);
            this.editorX = e.offsetX - zoomX*this.editorScale;
            this.editorY = e.offsetY + zoomY*this.editorScale;
            this.update();
        });
        this.canvas.addEventListener("mousemove", (e) => {
            if(e.buttons == 4) {
                this.editorX += e.movementX;
                this.editorY += e.movementY;
                this.update();
            }
        });


        // window
        window.addEventListener("resize", (e) => {
            this.updateCanvasSize();
        });
        this.updateCanvasSize();
    }



    /**
     * Redraw interface.
     */
    update() {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for(let i = 0; i < 19; i++) {
            if(this.plotVisible[i]) {
                this.drawPlot(ctx, i);
            }
            if(this.state === Editor.PLOT_MOVE && i == this.holeEdit) {
                ctx.strokeStyle = "rgba(252, 252, 0, 1.0)";
                ctx.fillStyle = "rgba(252, 252, 0, 1.0)";
                this.drawPlotBounds(ctx, i);
            }
        }

        for(let i = 0; i < 18; i++) {
            if(this.state === Editor.LAYOUT_EDIT && i == this.holeEdit) {
                ctx.strokeStyle = "rgba(252, 252, 0, 1.0)";
                ctx.fillStyle = "rgba(252, 252, 0, 1.0)";
                this.drawRouting(ctx, i);
                this.drawRoutingBounds(ctx, i);
            } else {
                ctx.strokeStyle = "rgba(252, 252, 252, 1.0)";
                ctx.fillStyle = "rgba(252, 252, 252, 1.0)";
                this.drawRouting(ctx, i);
            }
        }

    }



    /**
     * Reset canvas to window size.
     */
    updateCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.update();
    }



    /**
     * Set the paint terrain.
     *
     * @param terr terrain code
     */
    setPaint(terr) {
        this.paintTerr = terr;
        this.updatePaintTools();
    }

    /**
     * Redraw paint controls.
     */
    updatePaintTools() {
        for(let i = 0; i < 8; i++) {
            let rgba = this.course.palette.getRGBA(Palette.getTerrainIndex(i));
            this.paintSwatches[i].style.backgroundColor = "rgba("+rgba[0]+","+rgba[1]+","+rgba[2]+",1.0)";

            if(i == this.paintTerr) {
                this.paintSwatches[i].classList.add("editor-tools-swatch-active");
            } else {
                this.paintSwatches[i].classList.remove("editor-tools-swatch-active");
            }
        }
    }

    /**
     * Show the paint controls popup.
     */
    showPaintTools() {
        this.updatePaintTools();
        this.paintTools.style.visibility = "visible";
    }

    /**
     * Hide the paint controls popup.
     */
    hidePaintTools() {
        this.paintTools.style.visibility = "hidden";
    }



    /**
     * Transform a point from a local coordinate system defined in terms of the
     * global coordinate system to the global coordinate system.
     *
     * @param p point object in local coordinates
     * @param dr local coordinate rotation in JNSE 1/600 fraction
     * @param ds local coordinate scale
     * @param dx local coordinate origin x
     * @param dy local coordinate origin y
     *
     * @return point object in global coordinates
     */
    xfPointFromCoords(p, dr, ds, dx, dy) {
        const sin = (r) => { return Math.sin(2*Math.PI * r/600); };
        const cos = (r) => { return Math.cos(2*Math.PI * r/600); };
        const trans = (p) => { return { x: p.x + dx, y: p.y + dy }; };
        const scale = (p) => { return { x: p.x/ds, y: p.y/ds }; };
        const rota = (p) => { return { x: p.x*cos(dr) - p.y*sin(dr), y: p.x*sin(dr) + p.y*cos(dr) }; };

        return trans(scale(rota(p)));
    }

    /**
     * Transform a point from the global coordinate system to a local coordinate
     * system defined in terms of the global coordinate system.
     *
     * @param p point object in global coordinates
     * @param dr local coordinate rotation in JNSE 1/600 fraction
     * @param ds local coordinate scale
     * @param dx local coordinate origin x
     * @param dy local coordinate origin y
     *
     * @return point object in local coordinates
     */
    xfPointToCoords(p, dr, ds, dx, dy) {
        const sin = (r) => { return Math.sin(2*Math.PI * r/600); };
        const cos = (r) => { return Math.cos(2*Math.PI * r/600); };
        const trans = (p) => { return { x: p.x - dx, y: p.y - dy }; };
        const scale = (p) => { return { x: p.x*ds, y: p.y*ds }; };
        const rota = (p) => { return { x: p.x*cos(-dr) - p.y*sin(-dr), y: p.x*sin(-dr) + p.y*cos(-dr) }; };

        return rota(scale(trans(p)));
    }

    /**
     * Transform a point from the reference coordinate system to the screen.
     *
     * @param p point object in reference coordinates
     *
     * @return point object in screen coordinates
     */
    xfRefToScreen(p) {
        return this.xfPointFromCoords(p, -this.editorR, 1/this.editorScale, this.editorX, this.editorY);
    }

    /**
     * Transform a point from the screen to the reference coordinate system.
     *
     * @param p point object in screen coordinates
     *
     * @return point object in reference coordinates
     */
    xfScreenToRef(p) {
        return this.xfPointToCoords(p, -this.editorR, 1/this.editorScale, this.editorX, this.editorY);
    }

    /**
     * Transform a point from course plot (pixel) coordinates to the reference
     * coordinate system.
     *
     * @param p point object in course plot coordinates
     *
     * @return point object in reference coordinates
     */
    xfPlotToRef(p) {
        return this.xfPointFromCoords(p, -this.course.r, 1/32, this.course.x, this.course.y);
    }

    /**
     * Transform a point from the reference coordinate system to course plot
     * (pixel) coordinates.
     *
     * @param p point object in reference coordinates
     *
     * @return point object in course plot coordinates
     */
    xfRefToPlot(p) {
        return this.xfPointToCoords(p, -this.course.r, 1/32, this.course.x, this.course.y);
    }

    /**
     * Transform a point from hole (pixel) coordinates to course plot (pixel)
     * coordinates.
     *
     * @param p point object in hole coordinates
     * @param i hole number
     *
     * @return point object in course plot coordinates
     */
    xfHoleToPlot(p, i) {
        return this.xfPointFromCoords(p, -this.course.holeData[i].r, 32/8, this.course.holeData[i].x, this.course.holeData[i].y);
    }

    /**
     * Transform a point from course plot (pixel) coordinates to hole (pixel)
     * coordinates.
     *
     * @param p point object in course plot coordinates
     * @param i hole number
     *
     * @return point object in hole coordinates
     */
    xfPlotToHole(p, i) {
        return this.xfPointToCoords(p, -this.course.holeData[i].r, 32/8, this.course.holeData[i].x, this.course.holeData[i].y);
    }

    /*
     * Shortcuts.
     */
    xfPlotToScreen(p) { return this.xfRefToScreen(this.xfPlotToRef(p)); }
    xfScreenToPlot(p) { return this.xfRefToPlot(this.xfScreenToRef(p)); }
    xfHoleToScreen(p, i) { return this.xfRefToScreen(this.xfPlotToRef(this.xfHoleToPlot(p, i))); }
    xfScreenToHole(p, i) { return this.xfPlotToHole(this.xfRefToPlot(this.xfScreenToRef(p)), i); }



    /**
     * Create a new hole routing.
     *
     * @param hole hole number
     */
    createRouting(hole) {
        if(this.state == Editor.LAYOUT_ADD) {
            this.endRouting();
        }

        this.holeEdit = hole;
        this.addRouting();

        this.state = Editor.LAYOUT_ADD;
        this.canvas.style.cursor = "none";
        this.canvas.dispatchEvent(new CustomEvent("courseupdate"));
    }

    /**
     * Edit hole routing.
     *
     * @param hole hole number
     */
    editRouting(hole) {
        if(this.state == Editor.LAYOUT_ADD) {
            this.endRouting();
        }

        this.holeEdit = hole;

        this.state = Editor.LAYOUT_EDIT;
        this.update();
    }

    /**
     * Delete hole routing.
     *
     * @param hole hole number
     */
    deleteRouting(hole) {
        if(this.state == Editor.LAYOUT_ADD) {
            this.endRouting();
        }

        this.course.holeData[hole].par = 0;
        this.course.holeData[hole].v = [];
        this.holeEdit = -1;

        this.state = Editor.DEFAULT_VIEW;
        this.canvas.style.cursor = "";
        this.update();
        this.canvas.dispatchEvent(new CustomEvent("courseupdate"));
    }

    /**
     * Add a vertex to the hole routing.
     */
    addRouting() {
        let p = { x: 0, y: 0 };
        this.course.holeData[this.holeEdit].v.push(p);
        this.vertexMove = p;
    }

    /**
     * Stop creating the hole routing and recenter hole coordinates. If there
     * are fewer than two vertices, reset the routing.
     */
    endRouting() {
        this.course.holeData[this.holeEdit].v.pop();

        if(this.course.holeData[this.holeEdit].v.length < 2) {
            this.course.holeData[this.holeEdit].v = [];
        } else {
            let vc = this.course.holeData[this.holeEdit].v.map((p) => this.xfHoleToPlot(p, this.holeEdit));

            let d = Math.hypot(vc[vc.length-1].x-vc[0].x, vc[vc.length-1].y-vc[0].y);
            let u = { x: (vc[vc.length-1].x-vc[0].x) / d, y: (vc[vc.length-1].y-vc[0].y) / d };
            let vmin = 0;
            let vmax = 0;
            for(let p of vc) {
                vmin = Math.min(vmin, (p.x-vc[0].x)*u.y - (p.y-vc[0].y)*u.x);
                vmax = Math.max(vmax, (p.x-vc[0].x)*u.y - (p.y-vc[0].y)*u.x);
            }
            this.course.holeData[this.holeEdit].x = Math.floor(vc[0].x + (d/2-30)*u.x + ((vmin+vmax)/2+10)*u.y);
            this.course.holeData[this.holeEdit].y = Math.floor(vc[0].y + (d/2-30)*u.y - ((vmin+vmax)/2+10)*u.x);
            this.course.holeData[this.holeEdit].r = Math.floor(-Math.atan2(u.y, u.x)/(2*Math.PI) * 600);
            this.course.holeData[this.holeEdit].v = vc.map((p) => this.xfPlotToHole(p, this.holeEdit));
            this.course.holeData[this.holeEdit].v = this.course.holeData[this.holeEdit].v.map((p) => { return { x: Math.floor(p.x), y: Math.floor(p.y) }; });

            let yds = this.course.getHoleLength(this.holeEdit);
            this.course.holeData[this.holeEdit].par = yds < 450 ? yds < 240 ? 3 : 4 : 5;
        }

        this.vertexMove = null;
        this.holeEdit = -1;

        this.state = Editor.DEFAULT_VIEW;
        this.canvas.style.cursor = "";
        this.update();
        this.canvas.dispatchEvent(new CustomEvent("courseupdate"));
    }

    /**
     * Move a hole routing vertex.
     *
     * @param cx x position in screen coordinates
     * @param cy y position in screen coordinates
     */
    modifyRouting(cx, cy) {
        let q = this.xfScreenToHole({ x: cx, y: cy }, this.holeEdit);
        this.vertexMove.x = Math.floor(q.x);
        this.vertexMove.y = Math.floor(q.y);

        this.update();
        this.canvas.dispatchEvent(new CustomEvent("courseupdate"));
    }

    /**
     * Draw hole routing.
     *
     * @param ctx drawing context
     * @param hole hole number
     */
    drawRouting(ctx, hole) {
        let v = this.course.holeData[hole].v.map((p) => this.xfHoleToScreen({ x: p.x+0.5, y: p.y+0.5 }, hole))

        ctx.lineWidth = 1.5;
        ctx.beginPath()
        for(let p of v) {
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        for(let p of v) {
            ctx.fillRect(p.x-3, p.y-3, 6, 6);
        }
    }

    /**
     * Draw bounding box for hole routing and plot.
     *
     * @param ctx drawing context
     * @param hole hole number
     */
    drawRoutingBounds(ctx, hole) {
        let box = this.getPlotBounds(hole);

        ctx.lineWidth = 1.0;
        ctx.beginPath()
        for(let p of box) {
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    /**
     * Check for a hole routing vertex at the canvas position. Checks a 6x6
     * pixel box around the vertex.
     *
     * @param cx x position in screen coordinates
     * @param cy y position in screen coordinates
     *
     * @return point object for the vertex or null if none
     */
    queryRouting(cx, cy) {
        for(let p of this.course.holeData[this.holeEdit].v) {
            let q = this.xfHoleToScreen({ x: p.x+0.5, y: p.y+0.5 }, this.holeEdit);
            if(q.x-cx <= 3 && cx-q.x <= 3 && q.y-cy <= 3 && cy-q.y <= 3) {
                return p;
            }
        }
        return null;
    }



    /**
     * Create image representing the land plot using the course palette.
     *
     * @param hole hole number or 18 for course plot
     */
    renderPlot(hole) {
        let terr = hole == 18 ? this.course.plot.terr : this.course.holes[hole].terr;

        let imgData = new Uint8ClampedArray(terr.length*4);
        for(let i = 0; i < terr.length; i++) {
            let rgba = this.course.palette.getRGBA(Palette.getTerrainIndex(terr[i]));
            for(let j = 0; j < 4; j++) {
                imgData[i*4+j] = rgba[j];
            }
        }
        this.plotImages[hole].getContext("2d").putImageData(new ImageData(imgData, 240), 0, 0);
    }

    /**
     * Show/hide the land plot.
     *
     * @param hole hole number or 18 for course plot
     */
    showPlot(hole) {
        this.plotVisible[hole] = !this.plotVisible[hole];
        this.update();
    }


    /**
     * Edit the plot.
     *
     * @param hole hole number or 18 for course plot
     */
    editPlot(hole) {
        this.holeEdit = hole;
        this.plotVisible[hole] = true;

        this.state = Editor.PLOT_EDIT;
        this.showPaintTools();
        this.update();
    }

    /**
     * Move the plot (and routing).
     *
     * @param hole hole number or 18 for course plot
     */
    movePlot(hole) {
        this.holeEdit = hole;
        this.plotVisible[hole] = true;

        this.state = Editor.PLOT_MOVE;
        this.update();
    }

    /**
     * Paint the plot and re-render.
     */
    paintPlot(q) {
        let idx = Math.floor(this.paintPixel.x)+Math.floor(this.paintPixel.y)*240;
        this.course.plot.terr[idx] = this.paintTerr;

        this.renderPlot(this.holeEdit);
        this.update();
    }

    /**
     * Modify plot (and routing) location.
     *
     * @param cx x position in screen coordinates
     * @param cy y position in screen coordinates
     */
    modifyPlot(cx, cy) {
        if(this.holeEdit == 18) {
            let q = this.xfScreenToRef({ x: cx, y: cy });
            this.course.x = q.x;
            this.course.y = q.y;
        } else {
            let q = this.xfScreenToPlot({ x: cx, y: cy });
            this.course.holeData[this.holeEdit].x = Math.floor(q.x);
            this.course.holeData[this.holeEdit].y = Math.floor(q.y);
        }

        this.update();
    }

    /**
     * Rotate plot (and routing). New angle based on new location of the
     * opposite corner of the bounds.
     *
     * @param cx x position in screen coordinates
     * @param cy y position in screen coordinates
     */
    rotatePlot(cx, cy) {
        if(this.holeEdit == 18) {
            let q = this.xfScreenToRef({ x: cx, y: cy });
            let cr = -Math.atan2(q.y-this.course.y, q.x-this.course.x);
            this.course.r = (cr + Math.atan2(120, 240))/(2*Math.PI) * 600;
        } else {
            let q = this.xfScreenToPlot({ x: cx, y: cy });
            let cr = -Math.atan2(q.y-this.course.holeData[this.holeEdit].y, q.x-this.course.holeData[this.holeEdit].x);
            this.course.holeData[this.holeEdit].r = Math.floor((cr + Math.atan2(80, 240))/(2*Math.PI) * 600);
        }

        this.update();
    }

    /**
     * Draw the rendered plot to the editor.
     *
     * @param ctx drawing context
     * @param hole hole number or 18 for course plot
     */
    drawPlot(ctx, hole) {
        let box = this.getPlotBounds(hole);
        let dr = Math.atan2(box[3].y-box[0].y, box[3].x-box[0].x);
        let ds = Math.sqrt((box[3].x-box[0].x)*(box[3].x-box[0].x)+(box[3].y-box[0].y)*(box[3].y-box[0].y)) / 240;

        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = this.plotAlpha[hole];
        ctx.transform(ds, 0, 0, ds, box[0].x, box[0].y);
        ctx.rotate(dr);
        ctx.drawImage(this.plotImages[hole], 0, 0);

        ctx.resetTransform();
        ctx.globalAlpha = 1;
    }

    /**
     * Draw the plot bounds with controls.
     *
     * @param ctx drawing context
     * @param hole hole number or 18 for course plot
     */
    drawPlotBounds(ctx, hole) {
        let box = this.getPlotBounds(hole);

        ctx.lineWidth = 1.0;
        ctx.beginPath()
        for(let p of box) {
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.fillRect(box[0].x-3, box[0].y-3, 6, 6);

        ctx.beginPath();
        ctx.arc(box[2].x, box[2].y, 4, 0, 2*Math.PI);
        ctx.stroke();
    }

    /**
     * Check for the plot coordinate at the canvas position. Returns null if
     * the cursor is off the plot.
     *
     * @param cx x position in screen coordinates
     * @param cy y position in screen coordinates
     *
     * @return point object for the control point
     */
    queryPlot(cx, cy) {
        if(this.holeEdit == 18) {
            let q = this.xfScreenToPlot({ x: cx, y: cy });
            if(q.x > 0 && q.x < 240 && q.y > 0 && q.y < 120) {
                return { x: Math.floor(q.x), y: Math.floor(q.y) };
            }
        } else {
            let q = this.xfScreenToHole({ x: cx, y: cy }, this.holeEdit);
            if(q.x > 0 && q.x < 240 && q.y > 0 && q.y < 80) {
                return { x: Math.floor(q.x), y: Math.floor(q.y) };            }
        }
        return null;
    }

    /**
     * Check for the plot location control at the canvas position. Checks a 6x6
     * pixel box around the control.
     *
     * @param cx x position in screen coordinates
     * @param cy y position in screen coordinates
     *
     * @return point object for the control point
     */
    queryPlotMove(cx, cy) {
        let box = this.getPlotBounds(this.holeEdit);
        if(box[0].x-cx <= 3 && cx-box[0].x <= 3 && box[0].y-cy <= 3 && cy-box[0].y <= 3) {
            return box[0];
        }
        return null;
    }

    /**
     * Check for the plot rotation control at the canvas position. Checks a 6x6
     * pixel box around the control.
     *
     * @param cx x position in screen coordinates
     * @param cy y position in screen coordinates
     *
     * @return point object for the control point
     */
    queryPlotRotate(cx, cy) {
        let box = this.getPlotBounds(this.holeEdit);
        if(box[2].x-cx <= 3 && cx-box[2].x <= 3 && box[2].y-cy <= 3 && cy-box[2].y <= 3) {
            return box[2];
        }
        return null;
    }

    /**
     * Get plot bounding box in screen coordinates.
     *
     * @param hole hole number or 18 for course plot
     *
     * @return array of point objects in screen coordinates
     */
    getPlotBounds(hole) {
        const box = (w, h) => { return [{ x: 0, y: 0 }, { x: 0, y: h }, { x: w, y: h }, { x: w, y: 0 }]; };

        if(hole == 18) {
            return box(240, 120).map((p) => this.xfPlotToScreen(p));
        }
        return box(240, 80).map((p) => this.xfHoleToScreen(p, hole));
    }


}
