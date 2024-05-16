FROM public.ecr.aws/docker/library/node:20.13.1-bullseye as builder

WORKDIR /tmp

COPY . .
RUN npm ci && npm run build

FROM public.ecr.aws/docker/library/node:20.13.1-bullseye

COPY --from=builder /tmp/lib/*  /usr/src/app/

CMD ["node", "/usr/src/app/app.js"]