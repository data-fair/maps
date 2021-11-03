FROM ghcr.io/koumoul-dev/docker-maplibre-gl-native:master

WORKDIR /webapp

RUN ln -s /maplibre-gl-native/lib /webapp/lib

ENV NODE_ENV test

COPY package.json .
COPY package-lock.json .

RUN npm i

COPY .eslintrc.js .
COPY .gitignore .
COPY public public
COPY server server
COPY test test
COPY config config
COPY scripts scripts
COPY .nycrc .
COPY nuxt.config.js .


CMD npm run lint && npm run test-cover
