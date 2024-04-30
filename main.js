'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let lightSphere;
let lightLine;
let moveU = 0.9;
let moveV = 0.2;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

// constant variables for equations (can be chnged from html)
let A = 0.3;
let B = 0.3;
let C = 0.15;

function addListeners() {
    let constants = ['a', 'b', 'c'];
    window.addEventListener('DOMContentLoaded', () => {
        constants.forEach((item) => {
            document.getElementById(item).addEventListener("change", () => {
                updateConstants();

                surface.BufferData(CreateSurfaceData().vertexList);
                draw();
            });
        });
    })

    window.addEventListener('keydown', (e) => {
        switch(e.code) {
            case "KeyA": 
                moveV = Math.max(moveV - 0.01, 0);
                break;

            case "KeyD": 
                moveV = Math.min(moveV + 0.01, 1);
                break;

            case "KeyW":
                moveU = Math.min(moveU + 0.01, 1);
                break;

            case "KeyS":
                moveU = Math.max(moveU - 0.01, 0);
                break;

            default:
                break;
        }
    })
}
addListeners();

function updateConstants() {
    A = document.getElementById('a').value;
    B = document.getElementById('b').value;
    C = document.getElementById('c').value;
}

function processSurfaceEquations(u, v) {
    const x = A * deg2rad(u) * Math.sin(deg2rad(u)) * Math.cos(deg2rad(v));
    const y = B * deg2rad(u) * Math.cos(deg2rad(u)) * Math.cos(deg2rad(v));
    const z = -C * deg2rad(u) * Math.sin(deg2rad(v));
    return { x, y, z };
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length/3;
    }

    this.SetNormalBuffer = function(vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    }

    this.SetTextureBuffer = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    }

    this.Draw = function() {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }

}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() { 
    gl.clearColor(0,0,0,0.1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI/8, 1, 8, 12); 
    
    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,-10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView );
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0 );
        
    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1 );

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection );

    gl.uniform4fv(shProgram.iColor, [Math.abs(Math.sin(Date.now() * 0.001)), 1, 0, 1]);

    
    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1,1,1,1] );

    let A = document.getElementById('a').value
    let B = document.getElementById('b').value
    let C = document.getElementById('c').value

    let z = document.getElementById('z').value
    gl.uniform3fv(shProgram.iLightPosition, [Math.cos(Date.now() * 0.001), Math.sin(Date.now() * 0.001), z]);

    gl.uniform3fv(shProgram.iLightDirection, [-Math.cos(Date.now() * 0.001), -Math.sin(Date.now() * 0.001), -z]);
    let f = document.getElementById('f').value
    let r = document.getElementById('r').value
    let s = document.getElementById('s').value
    gl.uniform1f(shProgram.iRange, r);
    gl.uniform1f(shProgram.iFocus, f);
    gl.uniform1f(shProgram.iScale, s);
    gl.uniform2fv(shProgram.iTranslateTo, [moveU, moveV])

    surface.Draw();
    gl.uniform1f(shProgram.iFocus, 100);

    let translate = processSurfaceEquations(moveU * 360, (moveV - 0.5) * 360)
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(modelViewProjection,
        m4.translation(translate.x, translate.y, translate.z)));
    lightSphere.Draw();
}

function drawUsingAnimFrame() {
    draw();
    window.requestAnimationFrame(drawUsingAnimFrame);
}

function CreateSphereData() {
    let vertexList = [];

    let u = 0,
        v = 0;
    while (u < Math.PI * 2) {
        while (v < Math.PI) {
            let v1 = getSphereVertex(u, v);
            let v2 = getSphereVertex(u + 0.1, v);
            let v3 = getSphereVertex(u, v + 0.1);
            let v4 = getSphereVertex(u + 0.1, v + 0.1);
            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            v += 0.1;
        }
        v = 0;
        u += 0.1;
    }
    return vertexList
}

const radius = 0.1;
function getSphereVertex(long, lat) {
    return {
        x: radius * Math.cos(long) * Math.sin(lat),
        y: radius * Math.sin(long) * Math.sin(lat),
        z: radius * Math.cos(lat)
    }
}

function CreateSurfaceData()
{
    let vertexList = [];
    let normalsList = [];
    let texturesList = [];

    // 0 <= u <= 2PI, -PI <= v <= PI
    const innerStep = 5;
    
    for (let i = -180; i <= 180; i += innerStep) {
        for (let j = 0; j <= 360; j += innerStep) {
            const { x, y, z } = processSurfaceEquations(j, i);
            const { x: x1, y: y1, z: z1 } = processSurfaceEquations(j + innerStep, i);
            const { x: x2, y: y2, z: z2 } = processSurfaceEquations(j, i + innerStep);
            const { x: x3, y: y3, z: z3 } = processSurfaceEquations(j + innerStep, i + innerStep);
            const n = getNormal(j, i);
            const n1 = getNormal(j + innerStep, i);
            const n2 = getNormal(j, i + innerStep);
            const n3 = getNormal(j + innerStep, i + innerStep);
            vertexList.push(x, y, z);
            vertexList.push(x1, y1, z1);
            vertexList.push(x2, y2, z2);
            vertexList.push(x2, y2, z2);
            vertexList.push(x1, y1, z1);
            vertexList.push(x3, y3, z3);
            normalsList.push(...n, ...n1, ...n2, ...n2, ...n1, ...n3);
            texturesList.push(j / 360, i / 360 + 0.5);
            texturesList.push((j + innerStep) / 360, i / 360 + 0.5);
            texturesList.push(j / 360, (i + innerStep) / 360 + 0.5);
            texturesList.push(j / 360, (i + innerStep) / 360 + 0.5);
            texturesList.push((j + innerStep) / 360, i / 360 + 0.5);
            texturesList.push((j + innerStep) / 360, (i + innerStep) / 360 + 0.5);
        }
    }


    return { vertexList, normalsList, texturesList };
}

function getNormal(j, i) {
    const innerStep = 0.0001;
    const { x, y, z } = processSurfaceEquations(j, i);
    const { x: x1, y: y1, z: z1 } = processSurfaceEquations(j + innerStep, i);
    const { x: x2, y: y2, z: z2 } = processSurfaceEquations(j, i + innerStep);
    const deltaU = [x - x1 / innerStep, y - y1 / innerStep, z - z1 / innerStep];
    const deltaV = [x - x2 / innerStep, y - y2 / innerStep, z - z2 / innerStep];
    const normal = m4.normalize(m4.cross(deltaU, deltaV));
    return normal;
}

function loadAndBindTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.setAttribute('Access-Control-Allow-Origin', '*')
    image.crossOrigin = 'crossorigin'
    image.src = "https://raw.githubusercontent.com/zhura0well/geometric_visualisation/CGW/assets/test.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        draw();
    }
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex              = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal              = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTexture             = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor                     = gl.getUniformLocation(prog, "color");
    
    shProgram.iScale                     = gl.getUniformLocation(prog, "scale");
    shProgram.iTranslateTo               = gl.getUniformLocation(prog, "translationVar");
    shProgram.iLightPosition             = gl.getUniformLocation(prog, "lightPosition");
    shProgram.iLightDirection            = gl.getUniformLocation(prog, "lightDirection");
    shProgram.iRange                     = gl.getUniformLocation(prog, "range");
    shProgram.iFocus                     = gl.getUniformLocation(prog, "focus");

    surface = new Model('Surface');
    const { vertexList, normalsList, texturesList } = CreateSurfaceData()
    surface.BufferData(vertexList);
    surface.SetNormalBuffer(normalsList);
    surface.SetTextureBuffer(texturesList);

    lightSphere = new Model('Surface');
    lightSphere.BufferData(CreateSphereData());
    lightSphere.SetNormalBuffer(CreateSphereData());
    lightSphere.SetNormalBuffer(CreateSphereData());
    lightSphere.SetTextureBuffer(CreateSphereData());

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
     }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        loadAndBindTexture();
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    drawUsingAnimFrame();
}
