// Open file system
document.getElementById("add-segmap").onclick = function() {
    document.getElementById("add-new-segmap").click();
};
document.getElementById("add-style").onclick = function() {
    document.getElementById("add-new-style").click();
};

// Preview image before uploading
document.getElementById("add-new-segmap").onchange = function() {
    var file = this.files[0];

    if (['image/jpeg', 'image/png'].indexOf(file.type) != -1)
        document.getElementById('span-segmap').outerHTML =
                '<img id="span-segmap" class="dim-img" src="' + URL.createObjectURL(file) + '">'
    else
        alert('File not supported. Allowed image types are: png, jpg, jpeg.')

};

document.getElementById("add-new-style").onchange = function() {
    var file = this.files[0];

    if (['image/jpeg', 'image/png'].indexOf(file.type) != -1)
        document.getElementById('span-style').outerHTML =
                '<img id="span-style" class="style-tmp" src="' + URL.createObjectURL(file) + '">'
    else
        alert('File not supported. Allowed image types are: png, jpg, jpeg.')

};


// Display synthesized image
function compute_fake_img() {
    let fd = new FormData(document.forms["form-data"]),
        xhr = new XMLHttpRequest({mozSystem: true});
    xhr.open('POST', 'http://127.0.0.1:5000/demo', true);
    xhr.responseType = "blob";

    xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE)
            document.getElementById('fake-img').innerHTML = '<img class="dim-img" src="' + URL.createObjectURL(xhr.response) + '">';
    }

    xhr.onload = function() {};
    xhr.send(fd);
};