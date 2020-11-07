// Open file system
document.getElementById("add-style-v2").onclick = function() {
    document.getElementById("add-new-style-v2").click();
};

// Preview image before uploading
document.getElementById("add-new-style-v2").onchange = function() {
    var file = this.files[0];

    if (['image/jpeg', 'image/png'].indexOf(file.type) != -1)
        document.getElementById('span-style-v2').outerHTML =
                '<img id="span-style-v2" class="style-tmp" src="' + URL.createObjectURL(file) + '">'
    else
        alert('File not supported. Allowed image types are: png, jpg, jpeg.')

};

/*
 * PAINT
 */
 class Changes {
    constructor(max_size=50) {
        this.max_size = max_size;
        this.previous_changes = [];
        this.tmp_changes = [];
    }

    push(dict) {
        if (this.isNotEmptyTmpChanges())
            this.tmp_changes = [];

        if (this.previous_changes.length == this.max_size)
            this.previous_changes.splice(0, 1); // Removes the first element

        this.previous_changes.push(dict);
    }

    popPreviousChanges() {
        if (this.isNotEmptyPreviousChanges()) {
            let change = this.previous_changes.pop();
            this.tmp_changes.push(change);

            return change;
        }
        return {};
    }
    popTmpChanges() {
        if (this.isNotEmptyTmpChanges()) {
            let change = this.tmp_changes.pop();
            this.previous_changes.push(change);

            return change;
        }
        return {};
    }


    get sizePreviousChanges() {
        return this.previous_changes.length;
    }
    isNotEmptyPreviousChanges() {
        return this.previous_changes.length > 0;
    }

    get sizeTmpChanges() {
        return this.tmp_changes.length;
    }
    isNotEmptyTmpChanges() {
        return this.tmp_changes.length > 0;
    }

    clear() {
        this.previous_changes = [];
        this.tmp_changes = [];
    }
}

let canvas = document.getElementById('paint-segmap'), // capturar canvas
    ctx = canvas.getContext('2d'), // contexto - nos permite dibujar sobre este objeto, manipularlo
    x=0, y=0,
    drawing = false,
    changes = new Changes();


ctx.canvas.width  = canvas.offsetWidth;
ctx.canvas.height = canvas.offsetHeight;

ctx.strokeStyle = 'black';
ctx.fillStyle = 'black';
ctx.lineWidth = 1; // Grosor de la línea
document.getElementById("color-selected").style.background = 'black';

clear_canvas();

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
        pixels = [];
        previous_colors = [];

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
            //~ draw('line', x_prev, y_prev, x, y);
            const change = plotLine(x_prev, y_prev, x, y);

            pixels = pixels.concat(change.pixels);
            previous_colors = previous_colors.concat(change.previous_color);
        }
    };

    // Quita el click del ratón
    canvas.onmouseup = function(e) {
        if (drawing) {
            // x,y -> punto inicial
            // -> puntos en este momoento donde se encuentra el ratón, donde llegó
            //~ draw('line', x, y,
                  //~ e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
            const change = plotLine(x, y,
                                    e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);


            changes.push({
                pixels: pixels.concat(change.pixels),
                previous_color: previous_colors.concat(change.previous_color),
                color: change.color
            });

            drawing = false;
            x = 0, y = 0;
        }
    };
}

function line() {
    // Clica
    canvas.onmousedown = function(e) {
        prev_img = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // conseguimos la coordenadas correspondientes en el canvas
        x = e.pageX - canvas.offsetLeft;
        y = e.pageY - canvas.offsetTop;

        drawing = true;
    };

    // Mueve el ratón
    canvas.onmousemove = function(e) {
        if (drawing) {
            ctx.putImageData(prev_img, 0, 0);

            //~ draw('line', x, y,
                  //~ e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
            plotLine(x, y,
                     e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
        }
    };

    // Quita el click del ratón
    canvas.onmouseup = function(e) {
        if (drawing) {
            ctx.putImageData(prev_img, 0, 0);

            //~ draw('line', x, y,
                  //~ e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
            const change = plotLine(x, y,
                                    e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);


            changes.push(change);

            drawing = false;
            x = 0, y = 0;
        }
    };
}


/*
 *  Plot a line of width ctx.lineWidth.
 */
function plotLine(x0, y0, x1, y1) {
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const new_color = hex2rgb(ctx.strokeStyle),
          line_pixels = [],
          pixel_colors = [];

    savePixel = (red_index) => {
        //~ if (!line_pixels.some(function(p){return p.x == x && p.y == y})) {
        if (!line_pixels.includes(red_index)) {
            const color = img.data.slice(red_index, red_index+3);
            pixel_colors.push({r: color[0], g: color[1], b: color[2]});
            line_pixels.push(red_index);
            return true;
        }
        return false;
    }
    const drawLine = (x0, y0, x1, y1, perp=false) => {
        const dx = Math.abs(x1-x0), sx = x0 < x1 ? 1 : -1,
              dy = Math.abs(y1-y0), sy = y0 < y1 ? 1 : -1,
              len = perp ? ctx.lineWidth/2 : -1;

        let x=x0, y = y0,
            D, D0_inc, D1_inc,
            i = 0;

        if (dx > dy) {
            D = 2 * dy - dx;
            D0_inc = 2 * dy;
            D1_inc = 2 * (dy - dx);
        }
        else {
            D = 2 * dx - dy;
            D0_inc = 2 * dx;
            D1_inc = 2 * (dx - dy);
        }

        while (((!perp && (x != x1 || y != y1)) || ++i<len)){
            setPixelColorXY(x, y, new_color);

            if (D>=0) {
                y += sy; x += sx;
                D += D1_inc;
            }
            else {
                if (dx > dy) x += sx;
                else y += sy;
                D += D0_inc;
            }
        }

        if (!perp)
            setPixelColorXY(x1, y1, new_color);

        return {x: x, y: y};
    }

    if (ctx.lineWidth == 1) {
        drawLine(x0, y0, x1, y1);

        // Actualizar canvas
        ctx.putImageData(img, 0, 0);
    }
    else {
        /* Draw shape line */
        const dx = x1-x0,
              dy = y1-y0;

        // Normal lines
        const pixel2 = drawLine(x0, y0, x0 + dy, y0 - dx, perp=true),
              pixel3 = drawLine(x0, y0, x0 - dy, y0 + dx, perp=true),
              pixel4 = drawLine(x1, y1, x1 + dy, y1 - dx, perp=true),
              pixel5 = drawLine(x1, y1, x1 - dy, y1 + dx, perp=true);

        drawLine(pixel2.x, pixel2.y, pixel4.x, pixel4.y);
        drawLine(pixel3.x, pixel3.y, pixel5.x, pixel5.y);

        /* Fill line */
        fillTo(Math.round((x0+x1)/2), Math.round((y0+y1)/2),
                 hex2rgb(ctx.strokeStyle), line_pixels);
    }

    return { pixels: line_pixels,
             previous_color: pixel_colors,
             color: ctx.strokeStyle }
}



function setPixelColorXY(x, y, color, save=true) {
    const r = (x + y * img.width) * 4;
    if (x >= 0 && x < img.width && y >= 0 && y < img.height &&
        (!save || savePixel(r))){
        img.data[r] = color.r;
        img.data[r+1] = color.g;
        img.data[r+2] = color.b;
        img.data[r+3] = 255;
    }
}

function setPixelColor(r, color, save=true) {
    if (r >= 0 && r < img.width*img.height*4 &&
        (!save || savePixel(r))){
        img.data[r] = color.r;
        img.data[r+1] = color.g;
        img.data[r+2] = color.b;
        img.data[r+3] = 255;
    }
}

function colorMatch(r, color) {
    if (r >= 0 && r < img.width*img.height*4){
        return img.data[r] == color.r &&
               img.data[r+1] == color.g &&
               img.data[r+2] == color.b;
    }
    return -1;
}

function fillTo(x, y, end_color, shape_pixels) {
    let open_set = [{x: x, y: y}],
        checked = Array(canvas.width).fill().map(()=>Array(canvas.height).fill(false));

    const red = (open_set[0].y * canvas.width + open_set[0].x) * 4,
          new_color = hex2rgb(ctx.fillStyle);

    //~ for (pixel of shape_pixels)
        //~ checked[pixel.x][pixel.y] = true;

    // Mientras haya elementos en la lista de abiertos
    while (open_set.length > 0) {
        // Extraer elemento de la lista de abiertos
        let pixel = open_set.pop();

        r = (pixel.y * canvas.width + pixel.x) * 4;

        const same_color = colorMatch(r, end_color);
        if (!checked[pixel.x][pixel.y] && (!same_color ||
            (same_color && !shape_pixels.includes(r)))){

            if (!same_color)
                setPixelColor(r, new_color);


            if (pixel.x>0 && !checked[pixel.x-1][pixel.y])
                open_set.push({x: (pixel.x-1), y: pixel.y});

            if (pixel.x<canvas.width-1 && !checked[pixel.x+1][pixel.y])
                open_set.push({x: (pixel.x+1), y: pixel.y});

            if (pixel.y>0 && !checked[pixel.x][pixel.y-1])
                open_set.push({x: pixel.x, y: (pixel.y-1)});

            if (pixel.y<canvas.height-1 && !checked[pixel.x][pixel.y+1])
                open_set.push({x: pixel.x, y: (pixel.y+1)});
        }

        checked[pixel.x][pixel.y] = true;
    }

    // Actualizar canvas
    ctx.putImageData(img, 0, 0);

}

function rectangle() {
    // Clica
    canvas.onmousedown = function(e) {
        prev_img = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // conseguimos la coordenadas correspondientes en el canvas
        x = e.pageX - canvas.offsetLeft;
        y = e.pageY - canvas.offsetTop;

        drawing = true;
    };

    // Mueve el ratón
    canvas.onmousemove = function(e) {
        if (drawing) {
            ctx.putImageData(prev_img, 0, 0);

            //~ draw('rectangle', x, y,
                  //~ e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
            plotRectangle(x, y,
                          e.pageX - canvas.offsetLeft - x, e.pageY - canvas.offsetTop - y);
        }
    };

    // Quita el click del ratón
    canvas.onmouseup = function(e) {
        if (drawing) {
            ctx.putImageData(prev_img, 0, 0);

            //~ draw('rectangle', x, y,
                  //~ e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
            //~ ctx.rect(x1, y1, x2-x1, y2-y1);

            const change = plotRectangle(x, y,
                                         e.pageX - canvas.offsetLeft - x, e.pageY - canvas.offsetTop - y);

            changes.push(change);

            drawing = false;
            x = 0, y = 0;
        }
    };
}

function plotRectangle(x0, y0, width, height) {
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const new_color = hex2rgb(ctx.strokeStyle),
          si = width > 0 ? 1 : -1,
          sj = height > 0 ? 1 : -1,
          rectangle_pixels = [],
          pixel_colors = [];

    savePixel = (red_index) => {
        const color = img.data.slice(red_index, red_index+3);
        pixel_colors.push({r: color[0], g: color[1], b: color[2]});
        rectangle_pixels.push(red_index);
        return true;
    }

    for (let i=0; i!=width+si; i+=si)
        for (let j=0; j!=height+sj; j+=sj)
            setPixelColorXY(x0+i, y0+j, new_color);

    // Update canvas
    ctx.putImageData(img, 0, 0);

    return { pixels: rectangle_pixels,
             previous_color: pixel_colors,
             color: ctx.strokeStyle }
}

function circle() {
    // Clica
    canvas.onmousedown = function(e) {
        prev_img = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // conseguimos la coordenadas correspondientes en el canvas
        x = e.pageX - canvas.offsetLeft;
        y = e.pageY - canvas.offsetTop;

        drawing = true;
    };

    // Mueve el ratón
    canvas.onmousemove = function(e) {
        if (drawing) {
            ctx.putImageData(prev_img, 0, 0);

            //~ draw('circle', x, y,
                  //~ e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
            const x_curr = e.pageX - canvas.offsetLeft,
                  y_curr = e.pageY - canvas.offsetTop;

            plotCircle(Math.round((x+x_curr)/2), Math.round((y+y_curr)/2), // center
                       Math.round(Math.hypot(x_curr-x, y_curr-y)/2)); // radius
        }
    };

    // Quita el click del ratón
    canvas.onmouseup = function(e) {
        if (drawing) {
            ctx.putImageData(prev_img, 0, 0);

            //~ draw('circle', x, y,
                  //~ e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
            const x_curr = e.pageX - canvas.offsetLeft,
                  y_curr = e.pageY - canvas.offsetTop;

            const change = plotCircle(Math.round((x+x_curr)/2), Math.round((y+y_curr)/2), // center
                                      Math.round(Math.hypot(x_curr-x, y_curr-y)/2)); // radius

            changes.push(change);

            drawing = false;
            x = 0, y = 0;
        }
    };
}

// https://www.geeksforgeeks.org/bresenhams-circle-drawing-algorithm/
function plotCircle(xc, yc, radius) {
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const new_color = hex2rgb(ctx.strokeStyle),
          circle_pixels = [],
          pixel_colors = [];
    savePixel = (red_index) => {
        const color = img.data.slice(red_index, red_index+3);
        pixel_colors.push({r: color[0], g: color[1], b: color[2]});
        circle_pixels.push(red_index);
        return true;
    }

    // Function to draw all other 7 pixels present at symmetric position
    const drawSymmetricPoints = (x, y) => {
        setPixelColorXY(xc+x, yc+y, new_color);
        setPixelColorXY(xc-x, yc+y, new_color);
        setPixelColorXY(xc+x, yc-y, new_color);
        setPixelColorXY(xc-x, yc-y, new_color);
        setPixelColorXY(xc+y, yc+x, new_color);
        setPixelColorXY(xc-y, yc+x, new_color);
        setPixelColorXY(xc+y, yc-x, new_color);
        setPixelColorXY(xc-y, yc-x, new_color);
    }

    /* Draw circle */
    let sx = 0, sy = radius,
        D = 3 - 2 * radius;
    drawSymmetricPoints(sx, sy);

    while (sy >= sx) {
        // For each pixel, draw all eight pixels
        ++sx;

        // Check for decision parameter and correspondingly
        // update D, sx, sy
        if (D > 0){
            --sy;
            D += 4 * (sx - sy) + 10;
        }
        else
            D += 4 * sx + 6;
        drawSymmetricPoints(sx, sy);
    }

    /* Fill circle */
    fillTo(xc, yc,
           hex2rgb(ctx.strokeStyle), circle_pixels);

    return { pixels: circle_pixels,
             previous_color: pixel_colors,
             color: ctx.strokeStyle }
}

function bucket_fill() {
    canvas.onmousedown = function(e) {
        img = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let open_set = [{x: e.pageX - canvas.offsetLeft,
                         y: e.pageY - canvas.offsetTop}],
            checked = Array(canvas.width).fill().map(()=>Array(canvas.height).fill(false));

        const red = (open_set[0].y * canvas.width + open_set[0].x) * 4,
              color2change = {r: img.data[red], g: img.data[red+1], b: img.data[red+2]},
              new_color = hex2rgb(ctx.fillStyle),
              size_width = canvas.width*4,
              filled_pixels = [],
              pixel_colors = [];;
        // color2change = img.data.slice(red, red+3);
        savePixel = (red_index) => {
            const color = img.data.slice(red_index, red_index+3);
            pixel_colors.push({r: color[0], g: color[1], b: color[2]});
            filled_pixels.push(red_index);
            return true;
        }

        // Mientras haya elementos en la lista de abiertos
        while (open_set.length > 0) {
            // Extraer elemento de la lista de abiertos
            pixel = open_set.pop();

            if (!checked[pixel.x][pixel.y]) {
                const r = (pixel.y * canvas.width + pixel.x) * 4;
                setPixelColor(r, new_color);

                checked[pixel.x][pixel.y] = true;

                if (pixel.x>0 && !checked[pixel.x-1][pixel.y] &&
                    colorMatch(r-4, color2change))
                    open_set.push({x: (pixel.x-1), y: pixel.y});

                if (pixel.x<canvas.width-1 && !checked[pixel.x+1][pixel.y] &&
                    colorMatch(r+4, color2change))
                    open_set.push({x: (pixel.x+1), y: pixel.y});

                if (pixel.y>0 && !checked[pixel.x][pixel.y-1] &&
                    colorMatch(r-size_width, color2change))
                    open_set.push({x: pixel.x, y: (pixel.y-1)});

                if (pixel.y<canvas.height-1 && !checked[pixel.x][pixel.y+1] &&
                    colorMatch(r+size_width, color2change))
                    open_set.push({x: pixel.x, y: (pixel.y+1)});

            }
        }

        // Actualizar canvas
        ctx.putImageData(img, 0, 0);

        changes.push({
            pixels: filled_pixels,
            previous_color: pixel_colors,
            color: ctx.strokeStyle
        });
    };
}

function eyedropper() {
    canvas.onmousedown = function(e) {
        new_color = ctx.getImageData(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop, 1, 1).data;
        change_color(`rgba(${new_color[0]}, ${new_color[1]}, ${new_color[2]}, 255)`);
    }
}

function change_color(new_color) {
    ctx.strokeStyle = new_color;
    ctx.fillStyle = new_color;

    document.getElementById("color-selected").style.background = new_color;
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
    const color_prev = ctx.fillStyle;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#9FD9FF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = color_prev;

    changes.clear();
}



// Extract image from the canvas and display synthesized image
function compute_fake_img() {
    let dataURL = canvas.toDataURL("image/png");
    document.getElementById('segmap').value = dataURL;

    let fd = new FormData(document.forms["form-data"]),
        xhr = new XMLHttpRequest({mozSystem: true});
    xhr.open('POST', 'http://127.0.0.1:5000/demov2', true);
    xhr.responseType = "blob";

    xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE)
            document.getElementById('fake-img').innerHTML = '<img class="dim-img" src="' + URL.createObjectURL(xhr.response) + '">';
    }

    xhr.onload = function() {};
    xhr.send(fd);
};

function undo() {
    if (changes.isNotEmptyPreviousChanges()) {
        img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const change = changes.popPreviousChanges();

        for (let i = change.pixels.length-1; i>=0; --i)
            setPixelColor(change.pixels[i], change.previous_color[i], save=false);

        // Update canvas
        ctx.putImageData(img, 0, 0);
    }
}

function redo() {
    if (changes.isNotEmptyTmpChanges()) {
        img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const change = changes.popTmpChanges(),
              color = hex2rgb(change.color);

        for (r of change.pixels)
            setPixelColor(r, color, save=false);

        // Update canvas
        ctx.putImageData(img, 0, 0);
    }
}




// Change tool button style after click
//https://stackoverflow.com/questions/31178653/how-to-keep-active-css-style-after-click-a-button
$('.tool').on('click', function(){
    $('.tool').removeClass('selected');
    $(this).addClass('selected');
});