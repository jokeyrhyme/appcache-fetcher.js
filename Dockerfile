FROM node:0.12.4

RUN ["mkdir", "/app"]
WORKDIR /app

ADD ./package.json /app/
ADD ./README.md /app/

# npm needs above package.json and README.md to operate well
RUN ["npm", "install"]

ADD ./index.js /app/
ADD ./.eslintignore /app/
ADD ./.eslintrc /app/
ADD ./lib/ /app/lib/
ADD ./tests/ /app/tests/

ENTRYPOINT ["npm", "test"]
