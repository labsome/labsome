#!/usr/bin/python
import os
from setuptools import setup
from setuptools import find_packages

here = os.path.dirname(__file__)

setup(
    name = 'labsome',
    version = open(os.path.join(here, '..', 'VERSION')).read().strip(),
    url = 'http://www.labsome.com/',
    license = 'AGPL-3.0',
    zip_safe = False,

    packages = find_packages(),
    include_package_data = True,
    package_data = {
        '': ['*.txt'],
    },

    install_requires = [
        'Flask == 0.10.1',
        'Flask-Login == 0.3.2',
        'Flask-Principal == 0.4.0',
        'Flask-RethinkDB == 0.2',
        'Flask-WTF == 0.12',
        'bunch == 1.0.1',
        'pytz',
        'rethinkdb >= 2.2.0',
        'setuptools',
        'uwsgi == 2.0.11.2',
    ],

    extras_require = {
        'docs': [
            'mkdocs',
        ],
    },

    entry_points = {
        'console_scripts': [
            'labsome-server=labsome.backend.server:main',
        ],
    },
)
