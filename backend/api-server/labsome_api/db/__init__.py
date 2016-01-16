from .db import db
from .models import Model
from .models import ensure_models
from .fields import *

def init_app(app):
    db.init_app(app)
    ensure_models()
