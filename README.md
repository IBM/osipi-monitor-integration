# osipi-monitor-integration

Integrate PLC data from an OSIsoft PI Data Historian with Maximo Asset Monitor with App Connect utilizing [PI Web API](https://livelibrary.osisoft.com/LiveLibrary/web/ui.xql?action=html&resource=publist_home.html&pub_category=PI-Web-API)

To run

1. Clone the repo
2. Run `npm install`
3. Define/update the .env in the directory on par with src
4. Run `npm start`

A sample .env

```
# PIWEBAPISVR is the URL for OSIPI Web API Server
PIWEBAPISVR=https://172.16.85.163/piwebapi

## NOTE: The real endpoint is /assetdatabases?path=\\\\MX7VM\\OSIDemo%20Oil%20%26%20Gas%20Well%20Downtime%20Tracking%20FULL
## However dotenv does some funny stuff with \ and doubles them so you have to use the following URL
PIDBPath=/assetdatabases?path=\\MX7VM\OSIDemo%20Oil%20%26%20Gas%20Well%20Downtime%20Tracking%20FULL

# APPCONNECT_POST_PATH is the URL of where th ACE server enpoint is to send the data to
APPCONNECT_POST_PATH=http://71.14.100.253:7800/DatabaseMapping

# STARTTIME is what time period are you pulling the data from as per the OSI PI WEB API time periods
STARTTIME=-1H

# FILTER_ELEM_NAME is the name you want to filter on
FILTER_ELEM_NAME=Well17

# LOG_LEVEL is the level of logging Pino should use
LOG_LEVEL=debug
# LOG_LOCATION is the location of the logs for Pino
LOG_LOCATION=/tmp/osi.log



```
