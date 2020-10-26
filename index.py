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
