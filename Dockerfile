FROM ghcr.io/koumoul-dev/docker-maplibre-gl-native:master

WORKDIR /webapp

RUN ln -s /maplibre-gl-native/lib /webapp/lib

ENV NODE_ENV production

COPY package.json .
COPY package-lock.json .

RUN npm ci --production

RUN mkdir mbtiles
COPY config config
COPY public public
COPY nuxt.config.js .
RUN npm run build

COPY server server
COPY scripts scripts


CMD xvfb-run -a node server
