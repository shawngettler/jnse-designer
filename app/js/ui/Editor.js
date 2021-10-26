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
    static LAYOUT_ADD = "add hole layout";
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
        this.vertexMove = null;

        this.canvas.addEventListener("mousemove", (e) => {
            if(this.state === Editor.LAYOUT_ADD) {
                if(this.vertexMove) {
                    let q = this.xfScreenToHole({ x: e.offsetX, y: e.offsetY }, this.vertexMove.hole);
                    this.vertexMove.p.x = q.x;
                    this.vertexMove.p.y = q.y;
                    this.update();
                }
            }
            if(this.state === Editor.LAYOUT_EDIT) {
                this.vertexOver = this.queryRoutingVertex(e.offsetX, e.offsetY);
                if(this.vertexMove) {
                    let q = this.xfScreenToHole({ x: e.offsetX, y: e.offsetY }, this.vertexMove.hole);
                    this.vertexMove.p.x = Math.floor(q.x);
                    this.vertexMove.p.y = Math.floor(q.y);
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
                if(this.vertexOver && e.button == 0) {
                    this.vertexMove = this.vertexOver;
                    this.canvas.style.cursor = "none";
                }
            }
        });
        this.canvas.addEventListener("mouseup", (e) => {
            if(this.state === Editor.LAYOUT_ADD) {
                if(e.button == 0) {
                    this.addRouting(this.vertexMove.hole);
                } else if(e.button == 2) {
                    this.endRouting(this.vertexMove.hole);
                    this.update();
                }
            }
            if(this.state === Editor.LAYOUT_EDIT) {
                if(this.vertexMove && e.button == 0) {
                    this.vertexMove = null;
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

        if(this.state === Editor.LAYOUT_ADD || this.state === Editor.LAYOUT_EDIT) {
            for(let i = 0; i < 18; i++) {
                this.drawRouting(ctx, i);
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
     * Add a vertex to the hole routing.
     *
     * @param hole hole number (optional)
     */
    addRouting(hole) {
        let p = { x: 0, y: 0 };
        this.course.holeData[hole].v.push(p);
        this.vertexMove = { p: p, hole: hole };

        this.state = Editor.LAYOUT_ADD;
        this.canvas.style.cursor = "none";
    }

    /**
     * Stop editing the hole routing and recenter hole coordinates. If there are
     * fewer than two vertices, reset the routing.
     *
     * @param hole hole number
     */
    endRouting(hole) {
        this.course.holeData[hole].v.pop();
        this.vertexMove = null;

        this.state = Editor.LAYOUT_EDIT;
        this.canvas.style.cursor = "";

        let data = this.course.holeData[hole];
        if(data.v.length < 2) {
            data.v = [];
        } else {
            let vc = data.v.map((p) => { return this.xfHoleToPlot(p, hole); });

            let d = Math.hypot(vc[vc.length-1].x-vc[0].x, vc[vc.length-1].y-vc[0].y);
            let u = { x: (vc[vc.length-1].x-vc[0].x) / d, y: (vc[vc.length-1].y-vc[0].y) / d };
            let vmin = 0;
            let vmax = 0;
            for(let p of vc) {
                vmin = Math.min(vmin, (p.x-vc[0].x)*u.y - (p.y-vc[0].y)*u.x);
                vmax = Math.max(vmax, (p.x-vc[0].x)*u.y - (p.y-vc[0].y)*u.x);
            }
            data.x = Math.floor(vc[0].x + (d/2-30)*u.x + ((vmin+vmax)/2+10)*u.y);
            data.y = Math.floor(vc[0].y + (d/2-30)*u.y - ((vmin+vmax)/2+10)*u.x);
            data.r = Math.floor(-Math.atan2(u.y, u.x)/(2*Math.PI) * 600);
            data.v = vc.map((p) => { return this.xfPlotToHole(p, hole); });
            data.v = data.v.map((p) => { return { x: Math.floor(p.x), y: Math.floor(p.y) }; });

            let yds = 0;
            for(let i = 1; i < data.v.length; i++) {
                yds += Math.hypot(data.v[i].x-data.v[i-1].x, data.v[i].y-data.v[i-1].y) * 8/3;
            }
            data.par = yds < 450 ? yds < 240 ? 3 : 4 : 5;
        }
    }

    /**
     * Draw hole routing.
     *
     * @param ctx drawing context
     * @param hole hole number
     */
    drawRouting(ctx, hole) {
        let v = this.course.holeData[hole].v.map((p) => { return this.xfHoleToScreen(p, hole); })

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(252, 252, 252, 1.0)";
        ctx.beginPath()
        for(let p of v) {
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        ctx.strokeStyle = "rgba(252, 252, 252, 1.0)";
        ctx.fillStyle = "rgba(252, 252, 252, 1.0)";
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
        let b = [ { x: 0, y: 0 }, { x: 0, y: 80 }, { x: 240, y: 80 }, { x: 240, y: 0 }, { x: 0, y: 0 } ];
        let bs = b.map((p) => { return this.xfHoleToScreen(p, hole); });

        ctx.lineWidth = 0.5;
        ctx.strokeStyle = "rgba(252, 84, 84, 1.0)";
        ctx.beginPath()
        for(let p of bs) {
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
    queryRoutingVertex(cx, cy) {
        for(let i = 0; i < 18; i++) {
            for(let p of this.course.holeData[i].v) {
                let q = this.xfHoleToScreen(p, i);
                if(q.x-cx <= 3 && cx-q.x <= 3 && q.y-cy <= 3 && cy-q.y <= 3) {
                    return { p: p, hole: i };
                }
            }
        }
        return null;
    }


}
