var asy_gl =  document.createElement("script");
asy_gl.type = 'text/javascript';
asy_gl.src = "https://vectorgraphics.github.io/asymptote/base/webgl/asygl-1.01.js";

asy_gl.onload = function(){
    console.log("Loaded");
    console.log(vertex);
}
document.head.appendChild(asy_gl);

