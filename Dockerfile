FROM ghcr.io/koumoul-dev/docker-maplibre-gl-native:master

WORKDIR /webapp

RUN apt-get -qq update && apt-get install -y --no-install-recommends wget unzip

RUN ln -s /maplibre-gl-native/lib /webapp/lib

ENV NODE_ENV production

RUN mkdir ./fonts &&\
  wget --no-check-certificate -nv -O fonts.zip https://github.com/openmaptiles/fonts/releases/download/v2.0/v2.0.zip &&\
  unzip -q fonts.zip -d ./fonts &&\
  rm fonts.zip

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
