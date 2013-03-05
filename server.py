import os
from flask import Flask, redirect
from werkzeug.wsgi import SharedDataMiddleware

app = Flask(__name__)

@app.route('/')
def index():
  return redirect('/index.html')

# Serve our static content
app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
    '/': os.path.join(os.path.dirname(__file__), 'static')
})

if __name__ == "__main__":
  app.run()
