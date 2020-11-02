import os, string, random, logging
import tensorflow as tf
from trainer_tester.tester_one import TesterOne
from trainer_tester.options import parse_args
from flask import  Flask, flash, request, redirect, url_for, render_template, send_file
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename
import base64, cv2
import numpy as np
from PIL import Image
import io
#https://flask.palletsprojects.com/en/1.1.x/patterns/flashing/

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY')
app.config['UPLOAD_FOLDER'] = "static/tmp/"

# TENSORFLOW
tf.get_logger().setLevel(logging.ERROR)
# ~ gpus= tf.config.experimental.list_physical_devices('GPU')
# ~ tf.config.experimental.set_memory_growth(gpus[0], True)
# Parse arguments
args = parse_args(train=False, one=True)
# Initialize tester
tester = TesterOne(args)

# Define EndPoints
@app.route("/")
def home():
    return render_template("home.html")


@app.route('/demo', methods=['GET', 'POST'])
def demo():
    if request.method == "POST":
        if 'file_segmap' not in request.files or 'file_style' not in request.files:
            flash('No file part.')
            return redirect(request.url)
        f_segmap = request.files['file_segmap']
        f_style = request.files['file_style']
        if f_segmap.filename == '' or f_style.filename == '':
            flash('No segmentation map or style image selected.')
            return redirect(request.url)

        # filename = f.filename
        filename_segmap, file_extension_segmap = generate_filename(f_segmap.filename)
        filename_style, file_extension_style = generate_filename(f_style.filename)

        if file_extension_segmap.lower() in [".jpeg", ".jpg", ".png"] and \
           file_extension_style.lower() in [".jpeg", ".jpg", ".png"]:
            segmap_file = os.path.join(app.config['UPLOAD_FOLDER'], filename_segmap)
            styime_file = os.path.join(app.config['UPLOAD_FOLDER'], filename_style)
            f_segmap.save(segmap_file)
            f_style.save(styime_file)

            flash('Images successfully displayed.')

            filename_fake = tester.generate_fake(segmap_file, styime_file)

            return render_template('demo.html', filename_segmap=filename_segmap, filename_style=filename_style,
                                                filename_fake=filename_fake)

        flash('No valid images were found. Allowed image types are: png, jpg, jpeg.')
        return redirect(request.url)

    return render_template("demo.html")

@app.route('/demov2', methods=['GET', 'POST'])
@cross_origin()
def demo_v2():
    if request.method == "POST":
        # STYLE IMAGE
        if 'file_style' not in request.files:
            flash('No file part.')
            return redirect(request.url)
        #####
        f_style = request.files['file_style']
        if f_style.filename == '':
            flash('No style image selected.')
            return redirect(request.url)

        _, file_extension_style = os.path.splitext(secure_filename(f_style.filename))
        if file_extension_style.lower() in [".jpeg", ".jpg", ".png"]:
            ###################
            #   STYLE IMAGE
            ###################
            #https://stackoverflow.com/questions/47515243/reading-image-file-file-storage-object-using-cv2
            # Read style image file string data
            styimg = f_style.read()

            # Convert string data to numpy array
            styimg = np.fromstring(styimg, np.uint8)

            # Convert numpy array to image
            styimg = cv2.imdecode(styimg, cv2.IMREAD_UNCHANGED)
            ######

            # OpenCV likes to treat images as BGR instead of RGB. We need to swap layers
            styimg = cv2.cvtColor(styimg, cv2.COLOR_BGR2RGB)

            ########################
            #   SEGMENTATION MAP
            ########################
            # Read the segmentation map from a base64 data URL
            b64_string = request.form['file_segmap']

            # Convert the data URL to an OpenCV image
            segmap = uri2img(b64_string)


            #########################
            #   SYNTHESIZED IMAGE
            #########################
            # Create synthesized image
            fake_img = tester.generate_fake(segmap, styimg)[0].numpy()

            # Denormalize
            fake_img = (fake_img + 1) * 127.5

            # Convert numpy array of type float64 to type uint8
            fake_img = fake_img.astype(np.uint8)

            #####
            # https://stackoverflow.com/questions/56946969/how-to-send-an-image-directly-from-flask-server-to-html
            # Convert numpy array to PIL Image
            fake_img = Image.fromarray(fake_img)

            # Create file-object in memory
            file_object = io.BytesIO()

            # Write PNG in file-object
            fake_img.save(file_object, 'PNG')

            # Move to beginning of file so `send_file()` it will read from start
            file_object.seek(0)

            flash('Images successfully displayed.')
            return send_file(file_object, mimetype='image/PNG')
            #####

        flash('No valid images were found. Allowed image types are: png, jpg, jpeg.')
        return redirect(request.url)

    return render_template("demov2.html")

def uri2img(b64_string):
    """Convert a data URL to an OpenCV image.
    Credit: https://stackoverflow.com/a/54205640/2415512
    """

    encoded_data = b64_string.split(',')[1]
    nparr = np.fromstring(base64.b64decode(encoded_data), np.uint8)

    return cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    # ~ return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

@app.route('/display/<filename>')
def display_image(filename):
    return redirect(url_for('static', filename='tmp/' + filename), code=301)



# https://stackoverflow.com/questions/279561/what-is-the-python-equivalent-of-static-variables-inside-a-function
def static_vars(**kwargs):
    def decorate(func):
        for k in kwargs:
            setattr(func, k, kwargs[k])
        return func
    return decorate

@static_vars(n_random_letters=5)
def generate_filename(filename):
    """Creates a unique filename by adding a random string of letters."""
    file_name, file_extension = os.path.splitext(secure_filename(filename))

    for i in range(5):
        filename = file_name + '_'+''.join(random.choices(string.ascii_letters, k=generate_filename.n_random_letters))+file_extension
        if not os.path.isfile(filename):
            return filename, file_extension

    # Change the length of the random string if all the generated possibilities exist
    generate_filename.n_random_letters+=1
    return file_name + '_'+''.join(random.choices(string.ascii_letters, k=generate_filename.n_random_letters))+file_extension, file_extension





if __name__ == '__main__':
    app.run(debug=True)
