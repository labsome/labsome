FROM labsome/base-image:v2

RUN mkdir -p /opt/labsome

COPY . /opt/labsome

# Build frontend
RUN cd /opt/labsome/src/labsome/frontend && npm install
RUN cd /opt/labsome/src/labsome/frontend && ./node_modules/.bin/bower install --allow-root
RUN cd /opt/labsome/src/labsome/frontend && ./node_modules/.bin/gulp build

# Install backend
RUN cd /opt/labsome/src && python setup.py install

EXPOSE 5000

CMD ["/usr/bin/supervisord", "-c", "/opt/labsome/etc/supervisor-labsome.conf"]
