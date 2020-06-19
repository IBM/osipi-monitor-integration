import json
import logging
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, func
from iotfunctions import bif
# from custom.functions import InvokeModel
from iotfunctions.metadata import EntityType
from iotfunctions.db import Database
from iotfunctions.base import BaseTransformer
# from iotfunctions.bif import EntityDataGenerator
from custom import settings
import datetime as dt

import sys
import pandas as pd
import numpy as np

import csv
import sqlalchemy

if (len(sys.argv) > 0):
    entity_name = sys.argv[1]
    input_file = sys.argv[2]
else:
    print("Please provide path to csv file as script argument")
    exit()


'''
# Replace with a credentials dictionary or provide a credentials
# Explore > Usage > Watson IOT Platform Analytics > Copy to clipboard
# Past contents in a json file.
'''
credentials_file = 'monitor-demo.json'
with open(credentials_file, encoding='utf-8') as F:
    credentials = json.loads(F.read())

'''
Developing Test Pipelines
-------------------------
When creating a set of functions you can test how they these functions will
work together by creating a test pipeline.
'''


'''
Create a database object to access Watson IOT Platform Analytics DB.
'''
db = Database(credentials = credentials)
db_schema = None #  set if you are not using the default

# expects csv as input arg
rows = []
with open(input_file) as csvfile:
    reader = csv.reader(csvfile)
    for r in reader:
        # Pull Name and Type from headers
        if (('Point_Name' in ''.join(r)) and ('Point_Data_Type' in ''.join(r))):
            name_idx = r.index('Point_Name')
            type_idx = r.index('Point_Data_Type')
            continue
        if (name_idx and type_idx):
            name = r[name_idx].lower().replace(' ', '_')
            type = r[type_idx]
            if (len(name) < 1 ) or (len(type) < 1):
                continue
            if " " in type:
                type = type.split(" ")[0]
            print(name)
            print(type)
            print("-----")
            if 'string' in type.lower():
                metrics.append(Column(name, getattr(sqlalchemy, type)(50)))
            else:
                metrics.append(Column(name, getattr(sqlalchemy, type)()))

columns = tuple(metrics)
entity = EntityType(entity_name, db,
                    *columns,
                    **{
                      '_timestamp' : 'evt_timestamp',
                      '_db_schema' : db_schema}
)
entity.register()
print("Entity registered")
