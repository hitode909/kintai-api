# Kintai API - The e-asp wrapper

Kintai API allows you to punch time cards via simple HTTP request.

# Deploy to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

To deploy Kintai API, you must set following kintai variables.

- KINTAI_URL
 - The URL to record your time card. like this: `https://****H.HTML`
- KINTAI_STAFF_ID
 - Your Staff ID.
- KINTAI_PASSWORD
 - The password to login.
- API_TOKEN
 - The API token for authorization (basically auto-generated).

# How to get API token

With deploy to heroku button, the API token is auto-generated. You can get it at Heroku's application settings → Config Variables → Reveal Config Vars.

# Endpoints

```
GET /up?api_token=***     : Start working
GET /down?api_token=***   : Stop working
GET /report?api_token=*** : Print the report
```

# Get the Kintai Button

With IFTTT's DO Button and Maker Channel, you can punch time card from the smartphone's home screen.

![](https://i.gyazo.com/7cf735891ba6c127f3b0183c8a4d7433.png)

- [DO Button - IFTTT](https://ifttt.com/products/do/button)
- [Connect Maker to hundreds of apps - IFTTT](https://ifttt.com/maker)


# Run Locally

## Setup

```
npm install
npm run build
brew install phantomjs
```

## Run

```
KINTAI_URL='***' KINTAI_STAFF_ID='***' KINTAI_PASSWORD='***' API_TOKEN='***' PORT=3001 phantomjs lib/kintai.js
```
