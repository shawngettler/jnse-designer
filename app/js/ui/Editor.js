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
    static LAYOUT_VIEW = "view hole layout";
    static LAYOUT_ADD = "add hole layout";
    static LAYOUT_EDIT = "edit hole layout";



    /**
     * Create interface.
     *
     * @param course Course object
     */
    constructor(course) {
        this.course = course;

        this.state = Editor.LAYOUT_VIEW;


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

        this.holeEdit = -1;
        this.vertexOver = null;
        this.vertexMove = null;

        this.canvas.addEventListener("mousemove", (e) => {
            if(this.state === Editor.LAYOUT_ADD) {
                if(this.vertexMove) {
                    this.modifyRouting(e.offsetX, e.offsetY);
                }
            }
            if(this.state === Editor.LAYOUT_EDIT) {
                this.vertexOver = this.queryRouting(e.offsetX, e.offsetY);
                if(this.vertexMove) {
                    this.modifyRouting(e.offsetX, e.offsetY);
                } else if(this.vertexOver) {
                    this.canvas.style.cursor = "move";
                } else {
                    this.canvas.style.cursor = "";
                }
            }
        });
        this.canvas.addEventListener("mousedown", (e) => {
            if(this.state === Editor.LAYOUT_EDIT) {
                if(this.vertexOver && e.button == 0) {
                    this.vertexMove = this.vertexOver;
                    this.canvas.style.cursor = "none";
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
                    this.state = Editor.LAYOUT_VIEW;
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
    }



    /**
     * Redraw interface.
     */
    update() {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for(let i = 0; i < 18; i++) {
            this.drawRouting(ctx, i);
            if(this.state === Editor.LAYOUT_EDIT && i == this.holeEdit) {
                this.drawRoutingBounds(ctx, i);
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

        this.state = Editor.LAYOUT_VIEW;
        this.canvas.style.cursor = "";
        this.update();
        this.canvas.dispatchEvent(new Event("courseupdate"));
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
            let vc = this.course.holeData[this.holeEdit].v.map((p) => { return this.xfHoleToPlot(p, this.holeEdit); });

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
            this.course.holeData[this.holeEdit].v = vc.map((p) => { return this.xfPlotToHole(p, this.holeEdit); });
            this.course.holeData[this.holeEdit].v = this.course.holeData[this.holeEdit].v.map((p) => { return { x: Math.floor(p.x), y: Math.floor(p.y) }; });

            let yds = this.course.getHoleLength(this.holeEdit);
            this.course.holeData[this.holeEdit].par = yds < 450 ? yds < 240 ? 3 : 4 : 5;
        }

        this.vertexMove = null;
        this.holeEdit = -1;

        this.state = Editor.LAYOUT_VIEW;
        this.canvas.style.cursor = "";
        this.update();
        this.canvas.dispatchEvent(new Event("courseupdate"));
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
        this.canvas.dispatchEvent(new Event("courseupdate"));
    }

    /**
     * Draw hole routing.
     *
     * @param ctx drawing context
     * @param hole hole number
     */
    drawRouting(ctx, hole) {
        let v = this.course.holeData[hole].v.map((p) => { return this.xfHoleToScreen(p, hole); })

        ctx.strokeStyle = "rgba(252, 252, 252, 1.0)";
        ctx.fillStyle = "rgba(252, 252, 252, 1.0)";
        if(hole == this.holeEdit) {
            ctx.strokeStyle = "rgba(252, 252, 0, 1.0)";
            ctx.fillStyle = "rgba(252, 252, 0, 1.0)";
        }

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
        const bbox = (w, h) => { return [{ x: 0, y: 0 }, { x: 0, y: h }, { x: w, y: h }, { x: w, y: 0 }, { x: 0, y: 0 }]; };

        ctx.lineWidth = 1.0;
        ctx.strokeStyle = "rgba(252, 252, 0, 1.0)";
        ctx.beginPath()
        for(let p of bbox(240, 80).map((p) => { return this.xfHoleToScreen(p, hole); })) {
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    /**
     * Check for a hole routing vertex at the canvas position. Checks a 6x6
     * pixel box around the vertex.
     *
     * @param cx x position in screen coordinates
     * @param cy y position in screen coordinates
     *
     * @return object containing the vertex and hole number or null if none
     */
    queryRouting(cx, cy) {
        for(let p of this.course.holeData[this.holeEdit].v) {
            let q = this.xfHoleToScreen(p, this.holeEdit);
            if(q.x-cx <= 3 && cx-q.x <= 3 && q.y-cy <= 3 && cy-q.y <= 3) {
                return p;
            }
        }
        return null;
    }


}
