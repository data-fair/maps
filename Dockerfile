FROM ghcr.io/koumoul-dev/docker-maplibre-gl-native:master

WORKDIR /webapp

RUN mv /maplibre-gl-native/lib /webapp/lib

ENV NODE_ENV production

COPY package.json .
COPY package-lock.json .

RUN npm ci --production


COPY public public
COPY nuxt.config.js .
RUN npm run build

COPY server server
COPY config config
COPY scripts scripts


CMD xvfb-run -s ":99" node server
