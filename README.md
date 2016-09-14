# Kintai API - The e-asp wrapper

Kintai API allows you to punch timecards via simple HTTP request.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

# Endpoints

```
GET /up?api_token=***     : Start working
GET /down?api_token=***   : Stop working
GET /report?api_token=*** : Print the report
```

# Run Locally

```
npm install
npm run build
brew install phantomjs
KINTAI_URL='***' KINTAI_STAFF_ID='***' KINTAI_PASSWORD='***' API_TOKEN='***' PORT=3001 phantomjs lib/kintai.js
```

# Deploy to Heroku

```
heroku create --stack cedar --buildpack https://github.com/stomita/heroku-buildpack-phantomjs.git
heroku config:set KINTAI_URL="https://**"
heroku config:set KINTAI_STAFF_ID="***"
heroku config:set KINTAI_PASSWORD="***"
git push heroku master
```

## WARNING

Don't tell the deployed URL to others. Anyone who knows the URL can punch your timecard.

