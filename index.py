from flask import Flask, render_template

app = Flask(__name__)


# Define EndPoints
@app.route("/")
def home():
    return render_template("home.html")

@app.route('/demo', strict_slashes=False)
def demo():
    return render_template("demo.html")


if __name__ == '__main__':
    app.run(debug=True)
