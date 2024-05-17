FROM public.ecr.aws/docker/library/node:20.13.1-bullseye

WORKDIR /usr/src/app/

COPY . .

RUN npm ci && npm run build && mv ./lib/* . && rm -rf ./lib

CMD ["node", "/usr/src/app/app.js"]