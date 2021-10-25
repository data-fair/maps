FROM node:16-buster
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get -qq update
RUN apt-get install -y --no-install-recommends \
  libuv1-dev libgles2-mesa-dev libglfw3-dev \
  cmake \
  xvfb xauth

RUN git clone https://github.com/koumoul-dev/maplibre-gl-native
WORKDIR /maplibre-gl-native
RUN git checkout node-14

RUN git submodule update --init --recursive
RUN npm i --ignore-scripts

RUN cmake . -B build -D MBGL_WITH_EGL=ON
RUN cmake --build build

ENV DISPLAY :99.0
RUN xvfb-run -s ":99" npm run test

