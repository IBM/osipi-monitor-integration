const axios = require('axios');
const winston = require("winston");

require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "osi-pi-data" },
  transports: [
    new winston.transports.File({
      filename: process.env.LOG_LOCATION,
      level: process.env.LOG_LEVEL,
    }),
  ],
});

logger.debug('Running ...')


const PIWEBAPISVR = process.env.PIWEBAPISVR;
const PIDBPath = process.env.PIDBPath;
const APPCONNECT_POST_PATH = process.env.APPCONNECT_POST_PATH;
const STARTTIME = process.env.STARTTIME;
const FILTER_ELEM_NAME = process.env.STARTTIME;

var piData = new Object();
var pipointData = new Array();
var point;
var now = new Date().toISOString();

function setPiPointData(point) {
   //console.log(pointData);
   pipointData.push(point);
}

const getUpdatedPointData = async ( startTime) => {
    getAssetDatabaseByPath(PIDBPath, startTime)
    .then(response => {
        //console.log("success");
      })
      .catch(error => {
        logger.error(error);
      })
}

const getAssetDatabaseByPath = async (databasePath, startTime) => {

    return axios.get(PIWEBAPISVR + databasePath)
        .then(function (response) {

            piData.DATASOURCE_ID = response.data.Id;
            piData.DATASOURCE_DEVICETYPE = response.data.Path;
            piData.LOGICALINTERFACE_ID = "None";
            piData.EVENTTYPE = "None";
            piData.FORMAT = "NA";
            piData.UPDATED_UTC = now;
            piData.EVT_TIMESTAMP = now;
            piData.STATUS = "1";

            getElements(response.data, startTime);
        })
        .catch(function (error) {
            // handle error
            logger.error(error);
        });
}

const  getElements = (assetDatabase, startTime) => {

    return axios.get(assetDatabase.Links.Elements)
        .then(function (response) {
            // handle success
            var arr = response.data.Items;
            
            arr.forEach(element => {
                if (element.HasChildren) {
                    getElements(element, startTime);
                } else {
                    getAttributes(element, startTime)
                }
            });
        })
        .catch(function (error) {
            // handle error
            logger.error(error);
        });

}


const getAttributes = (element, startTime) => {

    return axios.get(element.Links.Attributes)
        .then(function (response) {
            // handle success
            var arr = response.data.Items;
            arr.forEach(attribute => {
                if (  (element.Name  === FILTER_ELEM_NAME && FILTER_ELEM_NAME != '') || 
                      (FILTER_ELEM_NAME === '') ) { // Use only if we want to filter a specific element
                   getAttributeRecordedData(attribute, startTime);
                }   
            });
            //console.log(response.data.Items.Links);
        })
        .catch(function (error) {
            // handle error
            logger.error(error);
        });      
}

const getAttributeRecordedData = (attribute, startTime) => {

    pointDataURL = attribute.Links.RecordedData;

    /*
    var deleteTags = ['Links', 'IsConfigurationItem', 'IsExcluded', 'IsHidden', 'IsManualDataEntry', 'Step', 'TraitName', 'Span', 'Zero'];
    deleteTags.forEach ( function (tag) {
        delete attribute[tag];
    });
    */

    return axios.get(pointDataURL  + "?startTime=" + startTime)
        .then(function (response) {
            // handle success

            //console.log(response.data.Items);
            //attribute['Values'] = response.data.Items;
            var hasPointData = response.data.Items.length > 0;

            // Only include points with data
            if (hasPointData) {


                point = new Object()
                // Set PI POINT data attribute values
                point.DEVICEID = attribute.Id;
                point.LOGICALINTERFACE_ID = attribute.WebId;
                point.EVENTTYPE = "PIPOINT";
                point.PATH = attribute.Path;
                point.FORMAT = "";
                point.UNITS = attribute.DefaultUnitsName;
                point.TYPE = attribute.Type;
                point.DESCRIPTION = attribute.Description;
                point.LABEL = attribute.TypeQualifier;
                point.ASSET_NAME = attribute.Name;


                point.VALUES = new Array();
                response.data.Items.forEach(element => {
                    point.VALUES.push({
                        "VALUE": element.Value ,
                        "EVT_TIMESTAMP": element.Timestamp,
                        "UPDATED_UTC": element.Timestamp,
                        "UNITS_ABBREVIATION": element.UnitsAbbreviation
                    });
                });

                //cleaconsole.log(pipointData);
                setPiPointData(point);
            }
        })
        .catch(function (error) {
            // handle error
            logger.error(error);
        });
}

getUpdatedPointData(STARTTIME);

// This is probably not the best way to handle this ... wait for the promise to return data from all URL calls
const delay = t => new Promise(resolve => setTimeout(resolve, t));
delay(5000).then(() => {
    piData.POINTS = pipointData;

    //console.log(piData);
    //console.log(JSON.stringify(pipointData))
    
    axios.post(APPCONNECT_POST_PATH, {
        pipoints: piData
    })
    
});
