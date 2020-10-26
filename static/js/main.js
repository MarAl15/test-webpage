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
                '<img id="span-segmap" class="segmap-tmp" src="' + URL.createObjectURL(file) + '">'
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
