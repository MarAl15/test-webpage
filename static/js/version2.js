// Open file system
document.getElementById("add-style-v2").onclick = function() {
    document.getElementById("add-new-style-v2").click();
};

// Preview image before uploading
document.getElementById("add-new-style-v2").onchange = function() {
    var file = this.files[0];

    if (['image/jpeg', 'image/png'].indexOf(file.type) != -1)
        document.getElementById('span-style-v2').outerHTML =
                '<img id="span-style" class="style-tmp" src="' + URL.createObjectURL(file) + '">'
    else
        alert('File not supported. Allowed image types are: png, jpg, jpeg.')

};

/*
 * PAINT
 */
let canvas = document.getElementById('paint-segmap'), // capturar canvas
    ctx = canvas.getContext('2d'), // contexto - nos permite dibujar sobre este objeto, manipularlo
    x=0, y=0,
    drawing = false;

ctx.canvas.width  = canvas.offsetWidth;
ctx.canvas.height = canvas.offsetHeight;

ctx.strokeStyle = 'black';
ctx.fillStyle = 'black';
ctx.lineWidth = 1; // Grosor de la línea

window.onresize = function() {
    // Make our in-memory canvas
    let inMemCanvas = document.createElement('canvas'),
        inMemCtx = inMemCanvas.getContext('2d');
    // Save image
    inMemCanvas.width = canvas.width;
    inMemCanvas.height = canvas.height;
    inMemCtx.drawImage(canvas, 0, 0);
    // Redraw the image back on canvas
    ctx.canvas.width  = canvas.offsetWidth;
    ctx.canvas.height = canvas.offsetHeight;
    ctx.drawImage(inMemCanvas, 0, 0, inMemCanvas.width, inMemCanvas.height, 0, 0, canvas.width, canvas.height);
}

// Movemos el ratón
// Dispara realmente la función que va a dibujar
function pencil() {
    // Capturamos el primer evento que sucede - cuando el usuario hace click sobre el canvas
    // e -> datos de donde el usuario dio click en la pantalla
    canvas.onmousedown = function(e) {
        // conseguimos la coordenadas correspondientes en el canvas
        x = e.pageX - canvas.offsetLeft; // posición en x donde el usuario dio click en la pantalla - la posicion del canvas
        y = e.pageY - canvas.offsetTop; // posición en y donde el usuario dio click en la pantalla - la posicion del canvas

        drawing = true;
    };

    canvas.onmousemove = function(e) {
        if (drawing) {
            // x,y -> punto inicial
            // -> puntos en este momoento donde se encuentra el ratón, donde llegó
            const x_prev = x,
                  y_prev = y;

            x = e.pageX - canvas.offsetLeft;
            y = e.pageY - canvas.offsetTop;
            draw('line', x_prev, y_prev, x, y);
        }
    };

    // Quita el click del ratón
    canvas.onmouseup = function(e) {
        if (drawing) {
            // x,y -> punto inicial
            // -> puntos en este momoento donde se encuentra el ratón, donde llegó
            draw('line', x, y,
                  e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);

            drawing = false;
            x = 0, y = 0;
        }
    };
}

function line() {
    // Clica
    canvas.onmousedown = function(e) {
        img = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // conseguimos la coordenadas correspondientes en el canvas
        x = e.pageX - canvas.offsetLeft;
        y = e.pageY - canvas.offsetTop;

        drawing = true;
    };

    // Mueve el ratón
    canvas.onmousemove = function(e) {
        if (drawing) {
            ctx.putImageData(img, 0, 0);

            draw('line', x, y,
                  e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
        }
    };

    // Quita el click del ratón
    canvas.onmouseup = function(e) {
        if (drawing) {
            ctx.putImageData(img, 0, 0);

            draw('line', x, y,
                  e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);

            drawing = false;
            x = 0, y = 0;
        }
    };
}

function rectangle() {
    // Clica
    canvas.onmousedown = function(e) {
        img = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // conseguimos la coordenadas correspondientes en el canvas
        x = e.pageX - canvas.offsetLeft;
        y = e.pageY - canvas.offsetTop;

        drawing = true;
    };

    // Mueve el ratón
    canvas.onmousemove = function(e) {
        if (drawing) {
            ctx.putImageData(img, 0, 0);

            draw('rectangle', x, y,
                  e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
        }
    };

    // Quita el click del ratón
    canvas.onmouseup = function(e) {
        if (drawing) {
            ctx.putImageData(img, 0, 0);

            draw('rectangle', x, y,
                  e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);

            drawing = false;
            x = 0, y = 0;
        }
    };
}

function circle() {
    // Clica
    canvas.onmousedown = function(e) {
        img = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // conseguimos la coordenadas correspondientes en el canvas
        x = e.pageX - canvas.offsetLeft;
        y = e.pageY - canvas.offsetTop;

        drawing = true;
    };

    // Mueve el ratón
    canvas.onmousemove = function(e) {
        if (drawing) {
            ctx.putImageData(img, 0, 0);

            draw('circle', x, y,
                  e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
        }
    };

    // Quita el click del ratón
    canvas.onmouseup = function(e) {
        if (drawing) {
            ctx.putImageData(img, 0, 0);

            draw('circle', x, y,
                  e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);

            drawing = false;
            x = 0, y = 0;
        }
    };
}

function bucket_fill() {
    canvas.onmousedown = function(e) {
        let img = ctx.getImageData(0, 0, canvas.width, canvas.height),
            open_set = [{x: e.pageX - canvas.offsetLeft,
                         y: e.pageY - canvas.offsetTop}],
            checked = Array(canvas.width).fill().map(()=>Array(canvas.height).fill(false));

        //~ color2change = ctx.getImageData(x, y, 1, 1).data;
        const red = open_set[0].y * (canvas.width * 4) + open_set[0].x * 4,
              color2change = {r: img.data[red], g: img.data[red+1], b: img.data[red+2]},
              new_color = hex2rgb(ctx.fillStyle),
              size_width = canvas.width*4;

        // Mientras haya elementos en la lista de abiertos
        while (open_set.length > 0) {
            // Extraer elemento de la lista de abiertos
            pixel = open_set.pop();

            r = pixel.y * (canvas.width * 4) + pixel.x * 4;

            img.data[r] = new_color.r;
            img.data[r+1] = new_color.g;
            img.data[r+2] = new_color.b;
            img.data[r+3] = 255;

            checked[pixel.x][pixel.y] = true;

            if (pixel.x>0 && !checked[pixel.x-1][pixel.y] &&
                img.data[r-4] == color2change.r &&
                img.data[r-3] == color2change.g &&
                img.data[r-2] == color2change.b) {

                open_set.push({x: (pixel.x-1), y: pixel.y})
            }
            if (pixel.x<canvas.width-1 && !checked[pixel.x+1][pixel.y] &&
                img.data[r+4] == color2change.r &&
                img.data[r+5] == color2change.g &&
                img.data[r+6] == color2change.b) {

                open_set.push({x: (pixel.x+1), y: pixel.y})
            }

            if (pixel.y>0 && !checked[pixel.x][pixel.y-1] &&
                img.data[r-size_width] == color2change.r &&
                img.data[r-size_width+1] == color2change.g &&
                img.data[r-size_width+2] == color2change.b) {

                open_set.push({x: pixel.x, y: (pixel.y-1)})
            }
            if (pixel.y<canvas.height-1 && !checked[pixel.x][pixel.y+1] &&
                img.data[r+size_width] == color2change.r &&
                img.data[r+size_width+1] == color2change.g &&
                img.data[r+size_width+2] == color2change.b) {

                open_set.push({x: pixel.x, y: (pixel.y+1)})
            }
        }

        // Actualizar canvas
        ctx.putImageData(img, 0, 0);
    };
}

function change_color(new_color) {
    ctx.strokeStyle = new_color;
    ctx.fillStyle = new_color;
}

function change_width(new_width) {
    ctx.lineWidth = new_width;
}

function draw(type, x1, y1, x2, y2) {
    ctx.beginPath(); // nueva ruta
    if (type == 'line') {
        ctx.moveTo(x1, y1); // mover a la coordenada inicial
        ctx.lineTo(x2, y2); // dibujar una línea
    }
    else if (type == 'rectangle') {
        ctx.rect(x1, y1, x2-x1, y2-y1);
        ctx.fill();
    }
    else if (type == 'circle') {
        ctx.arc((x1+x2)/2, (y1+y2)/2, // center
                Math.hypot(x2-x1, y2-y1)/2, // radius
                0, 2*Math.PI)
        ctx.fill();
    }
    ctx.stroke(); // va a realizar una simple línea, no va a rellenar áreas
    ctx.closePath(); // cerramos la ruta
}


//~ https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hex2rgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}


function clear_canvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
