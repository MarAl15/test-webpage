import os
from flask import  Flask, flash, request, redirect, url_for, render_template
from werkzeug.utils import secure_filename
#https://flask.palletsprojects.com/en/1.1.x/patterns/flashing/

app = Flask(__name__)
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'
app.config['UPLOAD_FOLDER'] = "static/tmp/"


# Define EndPoints
@app.route("/")
def home():
    return render_template("home.html")

@app.route('/demo', methods=['GET', 'POST'])
def demo():
    if request.method == "POST":
        if 'file' not in request.files:
            flash('No file part.')
            return redirect(request.url)
        f = request.files['file']
        if f.filename == '':
            flash('No image selected for uploading.')
            return redirect(request.url)

        filename, file_extension = os.path.splitext(secure_filename(f.filename))

        if file_extension.lower() in [".jpeg", ".jpg", ".png"]:
            f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

            flash('Image successfully uploaded and displayed.')
            # ~ return 'Image successfully uploaded and displayed'
            return render_template('demo.html', filename=filename)

        flash('No valid images were found. Allowed image types are: png, jpg, jpeg.')
        return redirect(request.url)

    return render_template("demo.html")


@app.route('/display/<filename>')
def display_image(filename):
    return redirect(url_for('static', filename='tmp/' + filename), code=301)



if __name__ == '__main__':
    app.run(debug=True)
