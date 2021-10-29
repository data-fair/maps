FROM ghcr.io/koumoul-dev/docker-maplibre-gl-native

WORKDIR /webapp

RUN mv /maplibre-gl-native/lib /webapp/lib

ENV NODE_ENV production

COPY public public
COPY nuxt.config.js .

COPY server server
COPY config config
COPY scripts scripts

COPY package.json .
COPY package-lock.json .

RUN npm ci --production
RUN npm run build

CMD xvfb-run -s ":99" node server
