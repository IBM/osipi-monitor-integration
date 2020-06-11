const axios = require("axios");
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

logger.debug("Running ...");

const PIWEBAPISVR = process.env.PIWEBAPISVR;
const PIDBPath = process.env.PIDBPath;
const APPCONNECT_POST_PATH = process.env.APPCONNECT_POST_PATH;
const STARTTIME = process.env.STARTTIME;
const FILTER_ELEM_NAME = process.env.FILTER_ELEM_NAME;

var piData = new Object();
var pipointData = new Array();
var point;
var now = new Date().toISOString();

function setPiPointData(point) {
  //console.log(pointData);
  pipointData.push(point);
}

const getUpdatedPointData = async (startTime) => {
  getAssetDatabaseByPath(PIDBPath, startTime)
    .then((response) => {
      //console.log("success");
    })
    .catch((error) => {
      logger.error(error);
    });
};

const getAssetDatabaseByPath = async (databasePath, startTime) => {
  return axios
    .get(PIWEBAPISVR + databasePath)
    .then(function (response) {
      // console.log(response);
      piData.PrimaryKey = trimData(response.data.WebId, 50);
      piData.DATASOURCE_ID = trimData(response.data.Id, 50);
      piData.DATASOURCE_DEVICETYPE = trimData(response.data.Path, 50);
      piData.POINTS_DEVICETYPE = "POINTS";
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
};

const getElements = (assetDatabase, startTime) => {
  return axios
    .get(assetDatabase.Links.Elements)
    .then(function (response) {
      // handle success
      var arr = response.data.Items;

      arr.forEach((element) => {
        if (element.HasChildren) {
          getElements(element, startTime);
        } else {
          getAttributes(element, startTime);
        }
      });
    })
    .catch(function (error) {
      // handle error
      logger.error(error);
    });
};

const getAttributes = (element, startTime) => {
  return axios
    .get(element.Links.Attributes)
    .then(function (response) {
      // handle success
      var arr = response.data.Items;
      arr.forEach((attribute) => {
        if (
          (element.Name === FILTER_ELEM_NAME && FILTER_ELEM_NAME != "") ||
          FILTER_ELEM_NAME === ""
        ) {
          // Use only if we want to filter a specific element
          getAttributeRecordedData(attribute, startTime);
        }
      });
    })
    .catch(function (error) {
      // handle error
      logger.error(error);
    });
};

const getAttributeRecordedData = (attribute, startTime) => {
  pointDataURL = attribute.Links.RecordedData;

  /*
    var deleteTags = ['Links', 'IsConfigurationItem', 'IsExcluded', 'IsHidden', 

'IsManualDataEntry', 'Step', 'TraitName', 'Span', 'Zero'];
    deleteTags.forEach ( function (tag) {
        delete attribute[tag];
    });
    */
  return axios
    .get(pointDataURL + "?startTime=" + startTime)
    .then(function (response) {
      // handle success

      //console.log(response.data.Items);
      //attribute['Values'] = response.data.Items;
      var hasPointData = response.data.Items.length > 0;

      // Only include points with data
      if (hasPointData) {
        point = new Object();
        // Set PI POINT data attribute values
        point.DEVICEID = trimData(attribute.Id, 50);
        point.LOGICALINTERFACE_ID = trimData(attribute.WebId, 50);
        point.EVENTTYPE = "PIPOINT";
        point.POINT_PATH = getLabel(attribute.Path);
        point.FORMAT = "";
        point.UNITS = attribute.DefaultUnitsName;
        point.TYPE = trimData(attribute.Type, 50);
        point.DESCRIPTION = trimData(attribute.Description, 50);
        point.LABEL = trimData(attribute.TypeQualifier, 50);
        point.ASSET_NAME = trimData(attribute.Name, 50);

        point.VALUES = new Array();
        response.data.Items.forEach((element) => {
          // console.log(element.Timestamp);
          point.VALUES.push({
            VALUE: formatNumber(element.Value, 2),
            EVT_TIMESTAMP: element.Timestamp,
            UPDATED_UTC: element.Timestamp,
            UNITS_ABBREVIATION: element.UnitsAbbreviation,
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
};

const getLabel = (theString) => {
  const index = theString.lastIndexOf('|');

  if (index >= 0) {
    return theString.slice((index + 1));
  }
  return theString;
}

const trimData = (theString, length) => {
  if (theString) {
    return theString.slice(0, (length - 1));
  }
  return theString;
};

const formatNumber = (theNumber, decimalPlaces) => {
  console.log("start",theNumber);
  const roundedNumber = Number(
    Math.round(parseFloat(theNumber + "e" + decimalPlaces)) +
      "e-" +
      decimalPlaces
  );
  console.log(roundedNumber);
  return roundedNumber;
} 

getUpdatedPointData(STARTTIME);

// This is probably not the best way to handle this ... wait for the promise to return data from all URL calls
const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

delay(5000).then(() => {
  piData.POINTS = pipointData;

  console.log(JSON.stringify(piData));
  // console.log(APPCONNECT_POST_PATH);

  axios
    .post(APPCONNECT_POST_PATH, piData)
    .then(function (response) {
      logger.info(JSON.stringify(piData));
      logger.info(response);
      console.log("Success");
    })
    .catch(function (error) {
      logger.info(JSON.stringify(piData));

      logger.error(error);
      console.log("Error");
    	console.log(error);
    });
});
