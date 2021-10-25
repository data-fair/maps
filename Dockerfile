FROM maplibre-gl-native-node

WORKDIR /app

RUN mv /maplibre-gl-native/lib /app/lib

ENV NODE_ENV production

COPY public public
COPY nuxt.config.js .

COPY server server
COPY config config
COPY scripts scripts

COPY package.json .
COPY package-lock.json .

RUN npm i --production
RUN npm run build

CMD ["xvfb-run -s \":99\"","node","server"]
