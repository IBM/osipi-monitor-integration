# Monitor operational data captured in an OSIsoft PI data historian with Maximo Asset Monitor
Integrate PLC data from an OSIsoft PI Data Historian with Maximo Asset Monitor using IBM App Connect 

## Introduction
A connected and instrument world of the internet of things, devices such as temperature, pressure or flow sensors and actuators are the key source of intelligence and automation in instrumented industrial and manufacturing processes. In many scenarios, Programmable Logic Controller (PLC) and Remote Terminal Unit (RTU) systems typically have direct control over these devices and are able to monitor and control their state. Supervisory control and data acquisition (SCADA) is a device monitoring and controlling framework comprising of instrumented equipment and process, PLC systems, higher level supervisory control computers and often a data historian. The historian is typically a database that captures site and equipment data along with instrumented time series sensor data. The data elements or attributes that are captured are tags or points that correspond to sensors that are often associated with asset site and location.  

The PI System developed by OSIsoft is one such data historian that can capture, store and manage, real-time time series sensor and plant information data from PLC and SCADA systems. A typical PI System configuration consists of systems that are running the PI Interface and collect data, the PI Data Archive server used for efficient storage and retrieval of data, the PI Asset Framework architecture that provides a human consumable mapping of data points to assets or an asset hierarchy and analytic and visualization tools. In addition to the access and view of equipment tag point data, site operators and equipment maintenance professionals need visibility into the operations of their sites, equipment and their health through customizable dashboards, and alerted when anomalies are detected their operation.  

IBM Maximo Asset Monitor is a solution that is powered by AI and provides remote asset monitoring capabilities through monitoring dashboards. With Maximo Asset Monitor you can connect devices, collect metrics and display them on dashboards, transform / cleanse data and detect anomalies. The advanced analytics and AI powered anomaly detection capabilities can be leveraged to detect issues in operational point data that was captured the historian. The tight integration with Maximo Asset Management drives creation of work orders for instrument equipment records maintained in Maximo.

In this code pattern, we will monitor simulated Oil Well drilling equipment data in Maximo Asset Monitor by integrating an OSIsoft PI System data Historian with it using IBM App Connect Enterprise. For the purpose of this code pattern we have used a simple OSIsoft PI System configuration and used an Asset Based PI Example kit to generate simulated data. Data from the PI data historian is connected to Maximo Asset Monitor through a configuration flow in App Connect Enterprise that maps data from the PI data historian to tables in Maximo Asset Monitor.

When you have completed this code pattern, you will understand how to:

* Monitor operational data in a data historian in Maximo Asset Monitor and create dashboards and alerts.
* Query an OSIsoft PI data historian to fetch operational time series point data.
* Integrate operational data from the PI data historian with Maximo Asset Monitor using IBM App Connect Enterprise.

<!--add an image in this path-->
![architecture](images/MaximoMonitor-PI-Integration-ArchDiagram.jpg)

<!--Optionally, add flow steps based on the architecture diagram-->
## Flow

1. The PI System collects operational asset time series sensor data  as PI points via a PI Interface which gets persisted in a PI archive. 
2. A scheduled cron script fetches new point data from the archive or data historian using PI Web APIs, filters and formats the data and sends it to App Connect via a HTTP POST. 
3. In App Connect, point data is mapped to data in the entity type and dimensions tables that was created to store point data and point meta-data. 
4. Point data captured in these tables for each site and asset can be viewed in Maximo Asset Monitor and dashboards created for a consolidated view.  

 
<!--Optionally, update this section when the video is created-->
# Watch the Video

[![video](https://img.youtube.com/vi/IyQgRwAseLU/0.jpg)](https://www.youtube.com/watch?v=IyQgRwAseLU)

# Included Components and Technologies

* [IBM Maximo Asset Monitor](https://www.ibm.com/products/ibm-maximo-asset-performance-management/asset-monitor) "Advanced  AI-powered remote asset monitoring at enterprise scale for assets and operations. Essential insights for intelligent asset maintenance and operations."
* [IBM App Connect Enterprise V11](https://www.ibm.com/us-en/cloud/app-connect) "combines the existing, industry-trusted technologies of IBM Integration Bus with IBM App Connect Professional and with new cloud native technologies, to deliver a platform that supports the full breadth of integration needs across a modern digital enterprise."
* [Node.js](https://nodejs.org/) is an open source, cross-platform JavaScript run-time environment that executes server-side JavaScript code.
* [OSIsoft PI Server](https://www.OSIsoft.com/pi-system/pi-capabilities/pi-server/) a data historian server that captures and stores operation point or tag data.  

# Steps

1. [Clone the repo](#1-clone-the-repo).
2. [Setup the OSIsoft PI Server](#2-setup-the-OSIsoft-pi-server).
3. [Prepare Maximo Asset Monitor to receive PI point data](#3-prepare-maximo-asset-monitor-to-receive-pi-point-data).
4. [Install the App Connect Enterprise Developer Edition Toolkit](#4-install-the-app-connect-enterprise-developer-edition-toolkit).
5. [Setup and start an App Connect Enterprise container](#5-setup-and-start-an-app-connect-enterprise-container).
6. [Update the App Connect application configuration and deploy to an ACE server](#6-update-the-app-connect-application-configuration-and-deploy-to-an-ace-server).
7. [Send oil well down time data from the PI data historian to Maximo Asset Monitor](#7-send-oil-well-down-time-data-from-the-pi-data-historian-to-maximo-apasset-monitor).


6. [Run the application](#6-run-the-application).

### 1. Clone the repo

Clone the `maximo-monitor-osipi-integration` in the destination of your choice. In a terminal, run:

```
git clone https://github.com/IBM/maximo-monitor-osipi-integration.git
```

### 2. Setup the OSIsoft PI Server

* You will need to have an environment with the OSIsoft PI Server and dependent components like a MS SQL Enterprise database management system installed. For this code pattern a simple [PI Server deployment](https://livelibrary.OSIsoft.com/LiveLibrary/web/pub.xql?c=t&action=home&pub=server-v14&lang=en#addHistory=true&filename=GUID-FC32B910-AD95-40B3-87E0-790D4EA0F7FF.xml&docid=GUID-541BD702-45B5-4B3A-8D4B-73776F60A6B5&inner_id=&tid=&query=&scope=&resource=&toc=false&eventType=lcContent.loadDocGUID-541BD702-45B5-4B3A-8D4B-73776F60A6B5) with all PI Server components installed on the same physical Windows machine is sufficient. You will need to install the following [PI Server](https://livelibrary.OSIsoft.com/LiveLibrary/web/pub.xql?c=t&action=home&pub=server-v14&lang=en) components by using the installers and following the default install prompts (remember to point to the MS SQL database):
    * OSIsoft Prerequisites Kit - Standalone version
    * PI Interface Configuration Utility (ICU) Install Kit
    * PI Server 2018 SP3 Patch 1 Installation Kit
    * PI SDK 2018 SP1 Patch 1
    * PI System Management Tools (PI SMT) Installation Kit 2018 SP3 Patch 1
    * [PI SQL Data Access Server via PI Asset Framework (AF) Client 2018 SP3 Patch 2](https://livelibrary.OSIsoft.com/LiveLibrary/web/pub.xql?action=publist_home&_ga=2.262148874.767846259.1592060213-894486930.1585751141&pub_category=PI-SQL-Data-Access-Server-(PI-Integrators))
    * [PI Web API](https://livelibrary.OSIsoft.com/LiveLibrary/web/pub.xql?c=t&action=home&pub=web-api-v13&lang=en)

* For the purpose of this code pattern we will be using simulated oil well drilling equipment downtime data. OSIsoft provides an asset-based example starter kit with simulated data that you will need to install. Download the kit [here](https://pisquare.OSIsoft.com/community/all-things-pi/af-library/asset-based-pi-example-kits/well-downtime-kit) and following the install instructions in the included install guide.  

* Install Node v8.x or greater and npm v5.x or greater. This is needed by the OSIsoft PI Web API client that fetches periodic point data which is then sent to Maximo Asset Monitor via App Connect.  

### 3. Prepare Maximo Asset Monitor to receive PI point data

Connect to your instance of Maximo Asset Monitor to create tables to capture the well downtime point data and dashboards to display and summarize the data. 

* Login to Maximo Asset Monitor and navigate to the "Db2 Warehouse on Cloud" services on the Services tab. First, create Entity Types, Entities, Metrics and Dimensions tables in the Maximo Asset Monitor database to capture the PI historian points.  

![Maximo Asset Monitor Dashboard](images/MAM-DB-Dashboard-Image2.png)

* Click on the Details and note down the JDBC URL property. This will be needed later when configuring your flow in App Connect to connect to the Maximo Asset Monitor database.

![](images/MAM-DB-Properties-Image3.png)

***TODO: DETAILS AND SCREEN SHOTS HERE OF THE DASHDB OR ANYTHING ELSE RELATED THAT NEEDS TO BE CREATED IN MONITOR***
* Connect to the Monitor database with your choice of a database client using the JDBC URL and credentials to create tables to capture Entity Types, Entities, Metrics and Dimension data. The EntityType table is where normal metrics are stored. Each metric is an IO Point with a name and value. EntityType_Dimensions table is where metadata that is applied to entities is stored. DM_EntityType is where all calculated metrics are stored in as Name-value pairs. Navigate to the maximo-asset-monitor/db-scripts directory in your clone GitHub repository which contains the 3 database definition language scripts that need to be run from your database client to create these tables. 

***NOT SURE IF THIS IS NEEDED IF SO INSTRUCTIONS NEEDED HERE**
* Create an Entity Type

### 4. Install the App Connect Enterprise Developer Edition Toolkit

App Connect Enterprise is used to connect data from the OSIsoft PI data historian to Maximo Asset Monitor. The source code in the ace-pi-monitor-integration directory of the cloned GitHub repository defines a flow and a data mapping to achieve this goal. The input node to the flow is a HTTP POST node that accepts a JSON data object. An OSIsoft Web API REST client periodically fetches new point data from PI and sends this point data as JSON to App Connect by calling a POST REST API call. This data is then mapped to columns of the 3 newly created tables in the Maximo Asset Monitor. The output node of the flow is a JDBC connection to insert data in the EntityType, DM_EntityType and EntityType_Dimensions Maximo Asset Monitor tables.  

![](images/ACE-Flow-Image.png)

You will need to configure the connection and other configuration settings in this flow. Then rebuild and deploy the mapping which is packaged as a .bar file to an App Connect Enterprise runtime.  

* IBM App Connect Enterprise (ACE) Developer edition is a functional version that can used by developers to evaluate and prototype integration solutions. It is available for Windows 64-bit, Linux® on x86-64, and for MacOS.  ACE is available to download without charge from https://www.ibm.com/marketing/iwm/iwm/web/dispatcher.do?source=swg-wmbfd . Install the App Connect Enterprise Toolkit by following the instructions in the [Knowledge Center](https://www.ibm.com/support/knowledgecenter/SSTTDS_11.0.0/com.ibm.etools.mft.doc/ba10630_.html) or in the [Get started with IBM App Connect Enterprise article](https://developer.ibm.com/integration/docs/app-connect-enterprise/get-started/).  


### 5. Setup and start an App Connect Enterprise container

The messaging flow and mapping created and packaged by the toolkit will need to be deployed to a runtime instance of App Connect Enterprise. Connect your App Connect Enterprise (ACE) Developer edition toolkit to an on-premise instance or App Connect, to [App Connect on IBM Cloud](https://www.ibm.com/support/knowledgecenter/en/SSTTDS_11.0.0/com.ibm.ace.cloud.doc/index.html) or an App Connect Docker container. An App Connect Enterprise server container running on  the IBM Cloud Kubernetes service has been used in this code pattern.

* Login to or create a new [IBM Clout Lite (free tier)](https://cloud.ibm.com/login) account if you do not already have one.

* Search for and provision an instance of the [IBM Cloud Kubernetes service](https://cloud.ibm.com/catalog?category=containers#services) from the IBM Cloud service catalog. 
 
 ![](images/ACE-IKS-Catalog-Image.png)

* Your cluster could take up to 45 minutes to provision. Once it has provisioned, note down the Cluster ID of your Kubernetes cluster and the public IP address of the worker node.

![](images/ACE-IKS-ClusterID-Image.png)

 ![](images/ACE-IKS-Cluster-PublicIP-Image.png)

* [Setup the IBM Cloud Command Line tools and Kubernetes service plugins](https://cloud.ibm.com/docs/containers?topic=containers-cs_cli_install) 

* Validate that you can connect to your cluster
```
ibmcloud login -a cloud.ibm.com -r us-south -g default  
ibmcloud ks cluster config --cluster <cluster id>   
kubectl config current-context  
```

* The directory ace-pi-monitor-integration/ace in the cloned GitHub repository contains the Kubernetes deployment YAML file that creates the App Connect container. To create and start an instance of the container, navigate to the container and run the command:
```
kubectl create -f ./kube-config.yml
```

* Once the ACE container has been deployed, you can open your ACE server by navigating to the public IP of your Kubernetes cluster and the port assigned in the Kubernetes configuration file ex. http://184.x.x.x:30007/?tab=0  (the ACE container instance has not been password protected)

 ![](images/ACE-Instance-Image.png)

***TODO Add instructions for bundling and including the JDBC drivers in the container image and its path***
* Adding JDBC Drivers???? --- Do we need it here, the JDBC drivers have been packaged in the jar I am generating and can point directly to them


### 6. Update the App Connect flow configuration and deploy to an ACE server      ***TODO***

* Launch the App Connect Developer toolkit. Create a new workspace and import the PI - Asset Monitor Mapping project.

* Update the config file DB properties

* Generate the bar file

* Deploy to the ACE container

### 7. Send oil well down time data from the PI data historian to Maximo Asset Monitor

Time series point data generated by oil well sensors and SCADA systems such as well pressure, temperature, etc., is captured in the PI data historian. OSIsoft provides a RESTful [PI Web API](https://techsupport.osisoft.com/Documentation/PI-Web-API/help.html) that can be used to query and fetch this data. The pi-data-fetch sub-directory in the cloned GitHub repository contains a Node.js client that calls fetches periodic point data. It then filters and formats the data and POSTs it to the Http endpoint exposed by App Connect. In App Connect, this data is mapped to tables and columns in the Maximo Asset Monitor database. The mapped point data flows from the PI System to Maximo Asset Monitor via App Connect. Run this script on the server that hosts the PI Web API.

* Before you run the Node.js client script, you will need to modify some environment variable present in the .env file in the pi-data-fetch sub-directory. Change the following environment variables depending on your environment:
    * PIWEBAPISVR - The hostname or ip address and port of your PI Web API server.
    * PIDBPath - The Path to your PI database. This can be determined from the PI Interface Configuration Utility.  
    * APPCONNECT_POST_PATH - The hostname or ip address and port of the App Connect Enterprise server or container and end point context path.
    * FILTER_ELEM_NAME - Optionally the name of the asset for which point data is to be retrieved, all assets are the default.

* Install the node dependencies and run the script. To validate the PI point data, you can post to any POST end point where the data can be viewed like one created in [Requestbin](https://requestbin.com/). Navigate to the pi-data-fetch sub-directory and run:
```
npm start
npm install
```
This script fetches the latest data in the past hour (determined by the STARTTIME environment property).   

* Setup a windows schedule or cron job that executes the script every hour (depending on the value of STARTTIME environment property).  

 ![](images/PIWebAPIClient-Schedule.png)  

   
### 8. View oil well down time series data in Maximo Asset Monitor  ***TODO***  

* Login to your instance of Maximo Asset Monitor and click on the Monitor tab. Here you can see all of the entity types created. 

* Search for your Entity Type "POINTS"

 ![](images/MaximoMonitor-Monitor-Dashboard.png)  

* Select your Entity Type "POINTS" from your search results. This loads the main dashboard tab which will display a list of dashboards for each entity. These correspond to OSI PI asset attributes or points, each containing the dimension and time series data that was sent to Maximo Asset Monitor from the Web API REST client through App Connect.

 ![](images/MaximoMonitor-EntityType-Points.png)  

* Click on any point and which launches a dashboard view for that point and observe the dimensions and metrics. On the metrics tab is a widget that displays time series data for the data point that was sent from the OSI PI data historian and is updated every hour depending on the schedule of the client script.

 ![](images/MaximoMonitor-LinePressure-Dimensions.png)  

 ![](images/MaximoMonitor-LinePressure-Metrics.png)  

* Click on the data tab in the main dashboard view. This launches views to display, Metrics, Calculated Metrics and Dimension data for the POINTS Entity Type.

 ![](images/MaximoMonitor-POINT-EntityType-Data.png)  


### 9. Create a dashboard to monitor Oil Well operations in Maximo Asset Monitor  ***TODO***  

* Create a calculated Metric

* Create a new Summary Dashboard




<!-- keep this -->
## License

This code pattern is licensed under the Apache License, Version 2. Separate third-party code objects invoked within this code pattern are licensed by their respective providers pursuant to their own separate licenses. Contributions are subject to the [Developer Certificate of Origin, Version 1.1](https://developercertificate.org/) and the [Apache License, Version 2](https://www.apache.org/licenses/LICENSE-2.0.txt).

[Apache License FAQ](https://www.apache.org/foundation/license-faq.html#WhatDoesItMEAN)

