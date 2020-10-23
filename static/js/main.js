// Open file system
document.getElementById("add-segmap").onclick = function() {
    document.getElementById("add-new-segmap").click();
};

document.getElementById("add-new-segmap").onchange = function() {
    file = this.files[0];

    if (['image/jpeg', 'image/png'].indexOf(file.type) != -1)
        document.getElementById('span-segmap').outerHTML =
                '<img src="' + URL.createObjectURL(file) + '">'
    else
        alert('File not supported. Allowed image types are: png, jpg, jpeg.')

};