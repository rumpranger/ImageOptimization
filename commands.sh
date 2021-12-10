docker build --tag lambci/lambda:build-nodejs12.13.0 .

docker run --rm --volume ${PWD}/lambda/origin-response-function:/build lambci/lambda:build-nodejs12.13.0 /bin/bash -c "source ~/.bashrc; npm init -f -y; npm install sharp --save; npm install querystring --save; npm install --only=prod"
docker run --rm --volume ${PWD}/lambda/viewer-request-function:/build lambci/lambda:build-nodejs12.13.0 /bin/bash -c "source ~/.bashrc; npm init -f -y; npm install querystring --save; npm install path --save; npm install useragent --save; npm install yamlparser; npm install --only=prod"

mkdir -p dist && cd lambda/origin-response-function && zip -FS -q -r ../../dist/origin-response-function.zip * && cd ../..
mkdir -p dist && cd lambda/viewer-request-function && zip -FS -q -r ../../dist/viewer-request-function.zip * && cd ../..