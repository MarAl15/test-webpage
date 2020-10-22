import os
from flask import Flask, render_template, request
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = "./tmp"


# Define EndPoints
@app.route("/")
def home():
    return render_template("home.html")

@app.route('/demo', strict_slashes=False)
def demo():
    return render_template("demo.html")

@app.route('/uploader', methods=['POST'])
def uploader():
    if request.method == "POST":
        f = request.files['image']
        filename = secure_filename(f.filename)
        f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return "Imagen subida exitosamente"


if __name__ == '__main__':
    app.run(debug=True)
