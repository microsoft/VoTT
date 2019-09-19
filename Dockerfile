FROM node:10.16.3-alpine

WORKDIR /app

RUN npm install -g serve

RUN npm ci \
    && npm run build \
    && npm run webpack:prod

ADD ./build /app

CMD serve -s .
