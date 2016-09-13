[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

# Kintai API

The e-asp wrapper

# Endpoints

```
GET /up     : Start working
GET /down   : Stop working
GET /report : Print the report
```

# WARNING

Don't tell the URL to others.


# Run Locally

```
npm install
npm run build
brew install phantomjs
KINTAI_URL='***' STAFF_ID='***' PASSWORD='***' PORT=3001 phantomjs lib/kintai.js
```

# Deploy to Heroku

```
heroku create --stack cedar --buildpack https://github.com/stomita/heroku-buildpack-phantomjs.git
heroku config:set KINTAI_URL="https://**"
heroku config:set STAFF_ID="***"
heroku config:set PASSWORD="***"
git push heroku master
```
