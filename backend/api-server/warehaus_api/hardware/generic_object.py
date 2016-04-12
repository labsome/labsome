import httplib
from slugify import slugify
from flask import abort as flask_abort
from flask import request
from flask_restful.reqparse import RequestParser
from ..auth.roles import require_user
from .type_class import TypeClass
from .type_class import type_action
from .type_class import object_action
from .labs import get_lab_from_type_object
from .models import create_object
from .models import ensure_unique_slug
from .models import get_user_attributes

class GenericObject(TypeClass):
    TYPE_VENDOR = 'builtin'
    TYPE_NAME = 'generic-object'
    USER_CONTROLLABLE = True

    @classmethod
    def display_name(cls):
        return 'Generic Object'

    @classmethod
    def description(cls):
        return ("A plain object type with user attributes. This type " +
                "should be used when you want to store objects that " +
                "don't fit any other available type.")

    create_object_parser = RequestParser()
    create_object_parser.add_argument('display_name', required=True)

    @type_action('POST', '')
    def create_generic_object(self, typeobj):
        require_user()
        lab = get_lab_from_type_object(typeobj)
        args = self.create_object_parser.parse_args()
        slug = slugify(args['display_name'])
        ensure_unique_slug(lab, slug)
        generic_object = create_object(slug=slug, display_name=args['display_name'], parent=lab, type=typeobj)
        generic_object.save()
        return generic_object.as_dict(), httplib.CREATED

    @object_action('DELETE', '')
    def delete_generic_object(self, generic_object):
        require_user()
        generic_object.delete()
        return generic_object.as_dict(), httplib.NO_CONTENT

    @object_action('GET', 'config.json')
    def generic_object_config(self, generic_object):
        require_user()
        return dict(
            id           = generic_object['id'],
            type_id      = generic_object['type_id'],
            slug         = generic_object['slug'],
            display_name = generic_object['display_name'],
            user_attrs   = get_user_attributes(generic_object),
        )
