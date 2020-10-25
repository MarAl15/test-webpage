import os, string, random, logging
import tensorflow as tf
from trainer_tester.tester_one import TesterOne
from trainer_tester.options import parse_args
from flask import  Flask, flash, request, redirect, url_for, render_template
from werkzeug.utils import secure_filename
#https://flask.palletsprojects.com/en/1.1.x/patterns/flashing/

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY')
app.config['UPLOAD_FOLDER'] = "static/tmp/"

# TENSORFLOW
tf.get_logger().setLevel(logging.ERROR)
gpus= tf.config.experimental.list_physical_devices('GPU')
tf.config.experimental.set_memory_growth(gpus[0], True)
# Parse arguments
args = parse_args(train=False, one=True)
# Initialize tester
tester = TesterOne(args)

# Define EndPoints
@app.route("/")
def home():
    return render_template("home.html")

filename_segmap = None
filename_style = None
filename_fake = None

@app.route('/demo', methods=['GET', 'POST'])
def demo():
    global filename_segmap, filename_style, filename_fake
    if request.method == "POST":
        if 'file' not in request.files:
            flash('No file part.')
            return redirect(request.url)
        f = request.files['file']
        if f.filename == '':
            flash('No image selected for uploading.')
            return redirect(request.url)

        # filename = f.filename
        filename, file_extension = os.path.splitext(secure_filename(f.filename))
        filename += '_'+''.join(random.choices(string.ascii_letters, k=10))+file_extension

        if file_extension.lower() in [".jpeg", ".jpg", ".png"]:
            image_file = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            f.save(image_file)

            flash('Image successfully uploaded and displayed.')

            if request.form['submit_button'] == "Upload Segmentation Map":
                tester.preprocess_image(image_file, num_channels=1,
                                       resize_method=tf.image.ResizeMethod.NEAREST_NEIGHBOR,
                                       normalize=False)
                if filename_segmap is not None and filename_segmap!=filename:
                    os.remove(image_file, normalize=False)
                filename_segmap = filename
            elif request.form['submit_button'] == "Upload Style Filter":
                tester.preprocess_image(image_file)
                if filename_style is not None and filename_style!=filename:
                    os.remove(image_file)
                filename_style = filename
            if filename_segmap is not None and filename_style is not None:
                filename_fake = tester.generate_fake(os.path.join(app.config['UPLOAD_FOLDER'], filename_segmap),
                                     os.path.join(app.config['UPLOAD_FOLDER'], filename_style))

            return render_template('demo.html', filename_segmap=filename_segmap, filename_style=filename_style,
                                                filename_fake=filename_fake)

        flash('No valid images were found. Allowed image types are: png, jpg, jpeg.')
        return redirect(request.url)

    # Remove files
    if filename_segmap is not None:
        os.remove(os.path.join(app.config['UPLOAD_FOLDER'],filename_segmap))
        filename_segmap = None
    if filename_style is not None:
        os.remove(os.path.join(app.config['UPLOAD_FOLDER'],filename_style))
        filename_style = None

    return render_template("demo.html")


@app.route('/display/<filename>')
def display_image(filename):
    return redirect(url_for('static', filename='tmp/' + filename), code=301)


if __name__ == '__main__':
    app.run(debug=True)
