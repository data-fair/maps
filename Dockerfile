FROM ghcr.io/koumoul-dev/docker-maplibre-gl-native:master

WORKDIR /webapp

RUN \
  apt-get -qq update\ 
  && apt-get install -y --no-install-recommends\
    wget unzip\
    git build-essential liblua5.1-0 liblua5.1-0-dev libprotobuf-dev\
    libsqlite3-dev protobuf-compiler shapelib libshp-dev\
    libboost-program-options-dev libboost-filesystem-dev\
    libboost-system-dev libboost-iostreams-dev rapidjson-dev\
    gdal-bin\
  && rm -rf /var/lib/apt/lists/*

RUN ln -s /maplibre-gl-native/lib /webapp/lib

ENV NODE_ENV production

RUN mkdir ./tippecanoe &&\
  wget --no-check-certificate -nv -O tippecanoe.zip https://github.com/mapbox/tippecanoe/archive/refs/tags/1.36.0.zip &&\
  unzip -q tippecanoe.zip -d ./tippecanoe &&\
  rm tippecanoe.zip &&\
  mv ./tippecanoe/tippecanoe-1.36.0/* ./tippecanoe &&\
  cd ./tippecanoe &&\
  make &&\
  make install &&\
  rm -rf ./tests ./*.cpp ./*.hpp ./*.o

RUN mkdir ./tilemaker &&\
  wget --no-check-certificate -nv -O tilemaker.zip https://github.com/systemed/tilemaker/archive/27b3a7bc5eef1aeeed663c061c0cdcedb62099e5.zip &&\
  unzip -q tilemaker.zip -d ./tilemaker &&\
  rm tilemaker.zip &&\
  mv ./tilemaker/tilemaker-27b3a7bc5eef1aeeed663c061c0cdcedb62099e5/* ./tilemaker &&\
  cd ./tilemaker &&\
  make &&\
  make install &&\
  rm -rf ./server

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
