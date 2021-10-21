/**
 * Editor.js
 * @author @shawngettler
 *
 * Graphical editor interface.
 */



/**
 * Class for editor interface.
 */
export default class Editor {

    // editor states
    static LAYOUT_EDIT = "edit hole layout";



    /**
     * Create interface.
     *
     * @param course Course object
     */
    constructor(course) {
        this.course = course;

        this.editorX = 0;
        this.editorY = 0;
        this.editorR = 0;
        this.editorScale = 1;
        this.editorScaleMax = 100;
        this.editorScaleMin = 0.01;

        this.state = Editor.LAYOUT_EDIT;

        let editorElement = document.createElement("div");
        editorElement.id = "editor";
        document.getElementById("app-container").appendChild(editorElement);
        this.canvas = document.createElement("canvas");
        this.canvas.id = "editor-canvas";
        editorElement.appendChild(this.canvas);

        this.updateCanvasSize();


        // user input
        this.canvas.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });

        this.vertexOver = null;
        this.vertexDragging = null;

        this.canvas.addEventListener("mousemove", (e) => {
            if(this.state === Editor.LAYOUT_EDIT) {
                this.vertexOver = this.queryHoleRoute(e.offsetX, e.offsetY);
                if(this.vertexDragging) {
                    let q = this.xfScreenToHole({ x: e.offsetX, y: e.offsetY }, this.vertexDragging.hole);
                    this.vertexDragging.p.x = Math.floor(q.x);
                    this.vertexDragging.p.y = Math.floor(q.y);
                    this.update();
                } else if(this.vertexOver) {
                    this.canvas.style.cursor = "move";
                } else {
                    this.canvas.style.cursor = "";
                }
            }
        });
        this.canvas.addEventListener("mousedown", (e) => {
            if(this.state === Editor.LAYOUT_EDIT) {
                if(this.vertexOver) {
                    this.vertexDragging = this.vertexOver;
                    this.canvas.style.cursor = "none";
                }
            }
        });
        this.canvas.addEventListener("mouseup", (e) => {
            if(this.state === Editor.LAYOUT_EDIT) {
                if(this.vertexDragging) {
                    this.vertexDragging = null;
                    this.canvas.style.cursor = "move";
                }
            }
        });


        // navigation
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
            if(e.buttons == 3) {
                this.editorX += e.movementX;
                this.editorY += e.movementY;
                this.update();
            }
        });


        // window
        window.addEventListener("resize", (e) => {
            this.updateCanvasSize();
        });
    }



    /**
     * Redraw interface.
     */
    update() {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if(this.state === Editor.LAYOUT_EDIT) {
            for(let i = 0; i < 18; i++) {
                if(this.course.holeData[i].par != 0) {
                    this.drawHoleRoute(ctx, this.course.holeData[i].v.map((p) => { return this.xfHoleToScreen(p, i); }));
                }
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
     * Check for a hole routing vertex at the canvas position. Checks a 6x6
     * pixel box around the vertex.
     *
     * @param cx x position in screen coordinates
     * @param cy y position in screen coordinates
     *
     * @return object containing the vertex and hole number or null if none
     */
    queryHoleRoute(cx, cy) {
        for(let i = 0; i < 18; i++) {
            if(this.course.holeData[i].par != 0) {
                for(let p of this.course.holeData[i].v) {
                    let q = this.xfHoleToScreen(p, i);
                    if(q.x-cx <= 3 && cx-q.x <= 3 && q.y-cy <= 3 && cy-q.y <= 3) {
                        return { p: p, hole: i };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Draw hole routing.
     *
     * @param ctx drawing context
     * @param route array of hole routing vertices in screen coordinates
     */
    drawHoleRoute(ctx, route) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(252, 252, 252, 1.0)";
        ctx.beginPath()
        for(let p of route) {
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        ctx.strokeStyle = "rgba(252, 252, 252, 1.0)";
        ctx.fillStyle = "rgba(252, 252, 252, 1.0)";
        for(let p of route) {
            ctx.fillRect(p.x-3, p.y-3, 6, 6);
        }
    }


}
