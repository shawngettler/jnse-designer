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
    static LAYOUT_VIEW = "hole layout";



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

        const drawPolyline = (coords) => {
            ctx.beginPath();
            for(let c of coords) {
                let cc = this.xfRefScreen(c);
                ctx.lineTo(cc.x, cc.y);
            }
            ctx.stroke();
        };


        if(this.state === Editor.LAYOUT_VIEW) {
            let plotBox = [
                this.xfPlotRef({ x: 0, y: 0 }),
                this.xfPlotRef({ x: 0, y: 120 }),
                this.xfPlotRef({ x: 240, y:120 }),
                this.xfPlotRef({ x: 240, y: 0 })
            ];
            ctx.strokeStyle = "red";
            drawPolyline(plotBox.slice(-1).concat(plotBox));

            let holeBox = [];
            let holeRoute = [];
            for(let i = 0; i < 18; i++) {
                if(this.course.holeData[i].par != 0) {
                    holeBox[i] = [
                        this.xfPlotRef(this.xfHolePlot({ x: 0, y: 0 }, i)),
                        this.xfPlotRef(this.xfHolePlot({ x: 0, y: 80 }, i)),
                        this.xfPlotRef(this.xfHolePlot({ x: 240, y: 80 }, i)),
                        this.xfPlotRef(this.xfHolePlot({ x: 240, y: 0 }, i))
                    ];
                    ctx.strokeStyle = "red";
                    drawPolyline(holeBox[i].slice(-1).concat(holeBox[i]));

                    holeRoute[i] = [];
                    for(let v of this.course.holeData[i].v) {
                        holeRoute[i].push(this.xfPlotRef(this.xfHolePlot(v, i)));
                    }
                    ctx.strokeStyle = "white";
                    drawPolyline(holeRoute[i]);
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
     * Transform point into new coordinate system.
     *
     * @param p point object
     * @param dr rotation change in JNSE 1/600 fraction
     * @param ds scale change
     * @param dx position change in x
     * @param dy position change in y
     *
     * @return point object in new coordinates
     */
    xfPoint(p, dr, ds, dx, dy) {
        const sin = (r) => { return Math.sin(2*Math.PI * r/600); };
        const cos = (r) => { return Math.cos(2*Math.PI * r/600); };
        const trans = (p) => { return { x: p.x + dx, y: p.y + dy }; };
        const scale = (p) => { return { x: p.x*ds, y: p.y*ds }; };
        const rota = (p) => { return { x: p.x*cos(dr) - p.y*sin(dr), y: p.x*sin(dr) + p.y*cos(dr) }; };

        return trans(scale(rota(p)));
    }

    /**
     * Transform a point from the global reference coordinate system to the
     * screen.
     *
     * @param p point object in global coordinates
     *
     * @return point object in screen coordinates
     */
    xfRefScreen(p) {
        return this.xfPoint(p, -this.editorR, this.editorScale, this.editorX, this.editorY);
    }

    /**
     * Transform a point from course plot coordinates to global reference
     * coordinate system.
     *
     * @param p point object in course plot coordinates
     *
     * @return point object in global coordinates
     */
    xfPlotRef(p) {
        return this.xfPoint(p, -this.course.r, 32, this.course.x, this.course.y);
    }

     /**
      * Transform a point from hole coordinates to course plot coordinates.
      *
      * @param p point object in hole coordinates
      * @param i hole number
      *
      * @return point object in course plot coordinates
      */
    xfHolePlot(p, i) {
        return this.xfPoint(p, -this.course.holeData[i].r, 8/32, this.course.holeData[i].x, this.course.holeData[i].y);
    }

}
