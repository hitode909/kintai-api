# Kintai API - The e-asp wrapper

Kintai API allows you to punch timecards via simple HTTP request.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

# Endpoints

```
GET /up     : Start working
GET /down   : Stop working
GET /report : Print the report
```

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

## WARNING

Don't tell the deployed URL to others. Anyone who knows the URL can punch your timecard.

