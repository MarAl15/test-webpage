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
        img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        x = e.pageX - canvas.offsetLeft;
        y = e.pageY - canvas.offsetTop;
        //~ console.log(x,y);

        color2change = ctx.getImageData(x, y, 1, 1).data;
        new_color = hex2rgb(ctx.fillStyle);

        console.log(color2change)
        r=y*canvas.width*4 + x*4
        console.log(img.data[r], img.data[r+1], img.data[r+2])
        console.log('---')

        //~ img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        //~ checked = Array(canvas.width).fill(Array(canvas.height).fill(false))
        checked =Array(canvas.width).fill().map(()=>Array(canvas.height).fill(false))

        fill(x, y);
        //~ ctx.putImageData(img, x, y);
    };

    //~ function fill(x, y) {
        //~ const red_pos = y * (canvas.width * 4) + x * 4
        //~ console.log('Entra');
        //~ if (!checked[x][y] &&
            //~ img.data[red_pos] == color2change[0] &&
            //~ img.data[red_pos+1] == color2change[1] &&
            //~ img.data[red_pos+2] == color2change[2]) {

            //~ img.data[red_pos] = new_color.r;
            //~ img.data[red_pos+1] = new_color.g;
            //~ img.data[red_pos+2] = new_color.b;
            //~ img.data[red_pos+3] = 255;

            //~ checked[x][y] = true;

            //~ if (y > 1)
                //~ fill(x, y-1);
            //~ if (y < canvas.height-1)
                //~ fill(x, y+1);

            //~ if (x > 1) {
                //~ console.log(x);
                //~ fill(x-1, y);

            //~ }
            //~ if (x < canvas.width-1) {
                //~ console.log(x);
                //~ fill(x+1, y);
            //~ }


            //~ return true;
        //~ }
        //~ return false;
    //~ };
    function fill(x, y) {
        //~ let pixel = ctx.getImageData(x, y, 1, 1)
        //~ console.log('fill');
        //~ console.log(x, x > 1, x < canvas.width-1, checked[x][y]);
        //~ console.log('y');
        //~ console.log(new_color);
        if (!checked[x][y] &&
            pixel.data[0] == color2change[0] &&
            pixel.data[1] == color2change[1] &&
            pixel.data[2] == color2change[2]) {
            //~ console.log('Entra');

            pixel.data[0] = new_color.r;
            pixel.data[1] = new_color.g;
            pixel.data[2] = new_color.b;
            pixel.data[3] = 255;
            console.log(ctx.getImageData(x, y, 1, 1).data);
            //~ console.log(pixel.data);
            //~ console.log(pixel);

            ctx.putImageData(pixel, x, y);
            console.log(ctx.getImageData(x, y, 1, 1).data);


            checked[x][y] = true;

            if (x > 1) {
                //~ console.log(x);
                fill(x-1, y);

            }
            if (x < canvas.width-1) {
                //~ console.log(x);
                fill(x+1, y);
            }
            if (y > 1)
                fill(x, y-1);
            if (y < canvas.height-1)
                fill(x, y+1);
        }
        else
            console.log(x, y, checked[x][y], checked[x]);
    };

}

function change_color(new_color) {
    ctx.strokeStyle = new_color;
    ctx.fillStyle = new_color;
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
