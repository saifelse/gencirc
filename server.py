import os
from flask import Flask, send_from_directory
from werkzeug.wsgi import SharedDataMiddleware

app = Flask(__name__)
static = 'static'

@app.route('/')
def index():
  return send_from_directory(static,'index.html')
  #return redirect('/index.html')

# Serve our static content
app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
    '/': os.path.join(os.path.dirname(__file__), static)
})

if __name__ == "__main__":
  app.run(host='0.0.0.0',port=80)
