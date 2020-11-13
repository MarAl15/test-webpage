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
from ast import literal_eval
#https://flask.palletsprojects.com/en/1.1.x/patterns/flashing/

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY')

# TENSORFLOW
tf.get_logger().setLevel(logging.ERROR)
gpus = tf.config.list_physical_devices('GPU')
if len(gpus)>0:
    tf.config.experimental.set_memory_growth(gpus[0], True)
# Parse arguments
args = parse_args(train=False, one=True)
args.semantic_label_path = './datasets/ADE5K/semantic_labels.txt'
args.checkpoint_dir = './checkpoints'
args.use_vae = True
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
            segmap = file2img(f_segmap, color_mode=cv2.IMREAD_GRAYSCALE)
            styimg = file2img(f_style)

            flash('Images successfully displayed.')
            return send_file(generate_fake(segmap, styimg), mimetype='image/PNG')

        flash('No valid images were found. Allowed image types are: png, jpg, jpeg.')
        return redirect(request.url)

    return render_template("demo.html")


@app.route('/demov2', methods=['GET', 'POST'])
@cross_origin()
def demo_v2():
    if request.method == "POST":
        if 'file_style' not in request.files:
            flash('No file part.')
            return redirect(request.url)
        f_style = request.files['file_style']
        if f_style.filename == '':
            flash('No style image selected.')
            return redirect(request.url)

        _, file_extension_style = os.path.splitext(secure_filename(f_style.filename))
        if file_extension_style.lower() in [".jpeg", ".jpg", ".png"]:
            ###################
            #   STYLE IMAGE
            ###################
            styimg = file2img(f_style)

            ########################
            #   SEGMENTATION MAP
            ########################
            # Read the segmentation map from a base64 data URL
            b64_string = request.form['file_segmap']

            # Convert the data URL to an OpenCV image
            segmap = uri2img(b64_string)

            # Transform the color segmentation map to id segmentation map
            segmap = transform_segmentation_map_from_color(segmap)

            #########################
            #   SYNTHESIZED IMAGE
            #########################
            flash('Images successfully displayed.')
            return send_file(generate_fake(segmap, styimg), mimetype='image/PNG')

        flash('No valid images were found. Allowed image types are: png, jpg, jpeg.')
        return redirect(request.url)

    return render_template("demov2.html")

with open('./datasets/ADE5K/color_semantic_labels.txt', 'r') as f:
    color_labels = literal_eval(f.read())
def transform_segmentation_map_from_color (segmap_color):
    """Transforms the given color segmentation map into a grayscale segmentation map
      by assigning the corresponding identifier to each color.
    """
    segmap = np.zeros((segmap_color.shape[0], segmap_color.shape[1]), dtype=np.uint8)

    for color, id in color_labels.items():
        color_array = np.asarray(color, np.float32).reshape([1, 1, -1])
        m = np.all(segmap_color == color_array, axis=-1)
        segmap[m] = id

    return segmap

def generate_fake(segmap, styimg):
    """Creates a fake image from the segmentation map and the style image, and
      returns a file-object in memory with the synthesized image.
    """
    # Create synthesized image
    fake_img = tester.generate_fake(segmap, styimg)[0].numpy()

    # Denormalize
    fake_img = (fake_img + 1) * 127.5

    # Convert numpy array of type float64 to type uint8
    fake_img = fake_img.astype(np.uint8)

    # https://stackoverflow.com/questions/56946969/how-to-send-an-image-directly-from-flask-server-to-html
    # Convert numpy array to PIL Image
    fake_img = Image.fromarray(fake_img)

    # Create file-object in memory
    file_object = io.BytesIO()

    # Write PNG in file-object
    fake_img.save(file_object, 'PNG')

    # Move to beginning of file so `send_file()` it will read from start
    file_object.seek(0)

    return file_object

def file2img(file, color_mode=cv2.IMREAD_COLOR):
    """Converts an image file into an OpenCV image.
    Main credit: https://stackoverflow.com/questions/47515243/reading-image-file-file-storage-object-using-cv2
    """
    # Read image file string data
    img = file.read()

    # Convert string data to numpy array
    img = np.frombuffer(img, np.uint8)

    # Convert numpy array to image
    img = cv2.imdecode(img, color_mode)

    if color_mode == cv2.IMREAD_COLOR:
        # OpenCV likes to treat images as BGR instead of RGB. We need to swap layers
        #https://docs.opencv.org/3.4/d4/da8/group__imgcodecs.html#gga61d9b0126a3e57d9277ac48327799c80aeddd67043ed0df14f9d9a4e66d2b0708
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    return img


def uri2img(b64_string):
    """Converts a data URL into an OpenCV image.
    Credit: https://stackoverflow.com/a/54205640/2415512
    """
    encoded_data = b64_string.split(',')[1]
    nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)

    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # return cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)



if __name__ == '__main__':
    app.run(debug=True)
