from flask.ext.login import UserMixin
from .. import db

class User(db.Model, UserMixin):
    username   = db.Field(db.Index())
    roles      = db.Field()
    first_name = db.Field()
    last_name  = db.Field()
    email      = db.Field()

    @classmethod
    def get_by_username(cls, username):
        docs = tuple(cls.query.get_all(username, index='username'))
        if not docs:
            return None
        if len(docs) != 1:
            raise RuntimeError('Found more than one user with username={!r}'.format(username))
        return docs[0]
