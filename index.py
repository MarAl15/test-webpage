import os, logging
import tensorflow as tf
from trainer_tester.tester_one import TesterOne
from trainer_tester.options import parse_args
from flask import  Flask, flash, request, redirect, render_template, send_file
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
import base64, cv2
import numpy as np
from PIL import Image
import io
#https://flask.palletsprojects.com/en/1.1.x/patterns/flashing/

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY')

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
@cross_origin()
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


        _, file_extension_segmap = os.path.splitext(secure_filename(f_segmap.filename))
        _, file_extension_style = os.path.splitext(secure_filename(f_style.filename))

        if file_extension_segmap.lower() in [".jpeg", ".jpg", ".png"] and \
           file_extension_style.lower() in [".jpeg", ".jpg", ".png"]:
            #https://stackoverflow.com/questions/47515243/reading-image-file-file-storage-object-using-cv2
            # Read image file string data
            segmap = f_segmap.read()
            styimg = f_style.read()

            # Convert string data to numpy array
            segmap = np.fromstring(segmap, np.uint8)
            styimg = np.fromstring(styimg, np.uint8)

            # Convert numpy array to image
            segmap = cv2.imdecode(segmap, cv2.IMREAD_GRAYSCALE)
            styimg = cv2.imdecode(styimg, cv2.IMREAD_COLOR)
            ######

            # OpenCV likes to treat images as BGR instead of RGB. We need to swap layers
            #https://docs.opencv.org/3.4/d4/da8/group__imgcodecs.html#gga61d9b0126a3e57d9277ac48327799c80aeddd67043ed0df14f9d9a4e66d2b0708
            styimg = cv2.cvtColor(styimg, cv2.COLOR_BGR2RGB)

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



if __name__ == '__main__':
    app.run(debug=True)
