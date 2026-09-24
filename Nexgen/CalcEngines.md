# Nexgen CalcEngine Documentation Contents

- [Overview](#Overview)
- [Benefit Requirements Document](#Benefit-Requirements-Document)
    - [BRD Settings](#BRD-Settings)
        - [API DataSource Mappings](#API-DataSource-Mappings)
            - [Massaging to xDS Format](#Massaging-to-xDS-Format)
            - [API DataSource CalcEngine Tables](#API-DataSource-CalcEngine-Tables)
            - [Custom API Reponse Processing](#Custom-API-Reponse-Processing)
                - [QnA Processing](#QnA-Processing)
                - [WebDataView Processing](#WebDataView-Processing)
                - [Transaction History Details Processing](#Transaction-History-Details-Processing)
                - [Dynamic Calc Details Processing](#Dynamic-Calc-Details-Processing)
                - [Eligibility Group Processing](#Eligibility-Group-Processing)
                - [Life Events Processing](#Life-Events-Processing)
                - [Beneficiary Processing](#Beneficiary-Processing)
            - [Supported Mapping Features](#Supported-Mapping-Features)
                - [Default Profile Mapping](#Default-Profile-Mapping)
                - [Default Array Processing](#Default-Array-Processing)
                - [Query String Processing](#Query-String-Processing)
                - [Index Formatting](#Index-Formatting)
                - [Nested Array Processing](#Nested-Array-Processing)
                - [Simple Array Processing](#Simple-Array-Processing)
                - [Namespacing Fields](#Namespacing-Fields)
                - [Incremental Index](#Incremental-Index)
                - [Mapping Response Containers To History](#Mapping-Response-Containers-To-History)
                    - [Mapping Response Root To History](#Mapping-Response-Root-To-History)
                    - [Mapping History Container To New History Type](#Mapping-History-Container-To-New-History-Type)
                - [Concatenating Index Fields](#Concatenating-Index-Fields)
                - [Manual Fields](#Manual-Fields)
                - [Field Mapping](#Field-Mapping)
                - [Multiple Destinations](#Multiple-Destinations)
                - [Field Filter Expressions](#Field-Filter-Expressions)
        - [appSettings Table](#appSettings-Table)
        - [appAttributeMapping Table](#appAttributeMapping-Table)
        - [userEligibility Table](#userEligibility-Table)
        - [manualResults Table](#manualResults-Table)
        - [userCalculatedData Table](#userCalculatedData-Table)
    - [Global and Client BRD Merging Flow](#Global-and-Client-BRD-Merging-Flow)
        - [BRD Calculation Flow Types](#BRD-Calculation-Flow-Types)
        - [BRD Calculation Flow](#BRD-Calculation-Flow)
        - [BRD Results Merge Flow](#BRD-Results-Merge-Flow)
        - [Building the AppSettings Object](#Building-the-AppSettings-Object)
        - [Building the UserSettings Object](#Building-the-UserSettings-Object)
        - [Building ManualResult Caches](#Building-ManualResult-Caches)
- [Managing xDS Data Model](#Managing-xDS-Data-Model)
    - [Data Cache Merge Flow](#Data-Cache-Merge-Flow)
    - [Temp Query Processing](#Temp-Query-Processing)
        - [Temp Query Lifespan](#Temp-Query-Lifespan)
        - [Temp Query MergeMode](#Temp-Query-MergeMode)
    - [Refreshing API Data On Demand / cacheRefreshKeys](#refreshing-api-data-on-demand--cacherefreshkeys)
        - [Refreshing API Data Before Client Side Calculations](#Refreshing-API-Data-Before-Client-Side-Calculations)
        - [Refreshing API Data Before Command Processing](#Refreshing-API-Data-Before-Command-Processing)
        - [Refreshing API Data During Command Processing](#Refreshing-API-Data-During-Command-Processing)
		- [apiDataSource ID Advanced Segments](#apidatasource-id-advanced-segments)
		- [Refresh Key Workflow During Calculation](#refresh-key-workflow-during-calculation)
- [NexGen CalcEngines](#NexGen-CalcEngines)
    - [Command Processing](#Command-Processing)
        - [Command Processing CalcEngine Tables](#Command-Processing-CalcEngine-Tables)
            - [command Layout](#command-Layout)
            - [command Verb Segments](#command-Verb-Segments)
            - [command-inputs Layout](#command-inputs-Layout)
            - [Accessing Previous Command Result Values](#Accessing-Previous-Command-Result-Values)
            - [command-inputs value Processing](#command-inputs-value-Processing)
                - [command-inputs value Payload Creation](#command-inputs-value-Payload-Creation)
                - [command-inputs QnA Payload Creation](#command-inputs-QnA-Payload-Creation)
    - [RBL Calculation Caching](#RBL-Calculation-Caching)
		- [forceCalculation](#forceCalculation)
    - [Conduent_Nexgen_QnA_SE](#Conduent_Nexgen_QnA_SE)
        - [Conduent_Nexgen_QnA_SE Tables](#Conduent_Nexgen_QnA_SE-Tables)
        - [Passing Conduent_Nexgen_QnA_SE Data](#Passing-Conduent_Nexgen_QnA_SE-Data)
        - [Refreshing Conduent_Nexgen_QnA_SE API Data On Demand](#Refreshing-Conduent_Nexgen_QnA_SE-API-Data-On-Demand)

# Overview

By in large, all the CalcEngines used in the Nexgen site are no different from any other KAT site's CalcEngine.  There are a few exceptions and this document will describe special CalcEngines and the features they facilitate and how to use/manage them.

# Benefit Requirements Document

In the Nexgen framework, the _Benefit Requirements Document CalcEngines_ (BRD) control almost all 'settings/rules' that control the site experience for each client.  There is a concept of a 'global' BRD that generates settings for all clients, then each client has its own client BRD that merges with, and overrides when necessary, the global settings.  See [Global and Client Merging Flow](#Global-and-Client-Merging-Flow) for more information.

## BRD Settings

A BRD CalcEngine can contain any custom tables it desires and be configured to inject those into various locations of the application, however, there are several core tables that every client BRD will contain.

### API DataSource Mappings

Almost all of the data the represents a logged in user is managed and provided by 'Nexgen APIs'.  These API endpoints are documented inside CalcEngines with the BRD being the primary source, however, API endpoints can be specified in other CalcEngines during 'command processing' (see the [Command Processing](#Command-Processing) for more information).  The APIs are called upon login and can also be called later on in the lifecycle to update, refresh, or query data.

#### Massaging to xDS Format

When the API is a _GET_ method, the json data returned from the API is massaged back into xml known as 'xDS format' to ensure that all the framework code from the _BTR Evolution_ and _RBLe_ frameworks continued to work.  The xDS format is represented by Xml structure that has a `Profile` element containing demographic (or non-repeating) data and a `HistoryData` element containing `HistoryItem` elements that represent repeating/transactional data.

##### Sample API json response

```json
{
    "response": {
        "person": {
            "ssn": "911390205",
            "name": {
                "nameLast": "Doe",
                "nameFirst": "John"
            },
            "communication": {
                "addresses": [
                    {
                        "addressType": "HOME",
                        "address1": "123 Normal Way",
                        "city": "New York",
                        "postalCode": "12121",
                        "state": "NY"
                    },
                    {
                        "addressType": "MAILING",
                        "address1": "999 Conduent Towers",
                        "city": "Manhattan",
                        "postalCode": "34343",
                        "state": "NY"
                    }
                ]
            }
        }
    },
    "status": {
        "code": "0",
        "message": "SUCCESS"
    }
}
```

##### Resulting xDS Format

```xml
<xDataDef>
    <Profile>
        <ssn>911390205</ssn>
        <nameFirst>John</nameFirst>
        <nameLast>Doe</nameLast>
    </Profile>
    <HistoryData>
        <HistoryItem hisType="addresses" hisIndex="HOME">
            <index>HOME</index>
            <address1>123 Normal Way</address1>
            <city>New York</city>
            <state>NY</state>
            <postalCode>12121</postalCode>
        </HistoryItem>
        <HistoryItem hisType="addresses" hisIndex="MAILING">
            <index>MAILING</index>
            <address1>999 Conduent Towers</address1>
            <city>Manhattan</city>
            <state>NY</state>
            <postalCode>34343</postalCode>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

#### API DataSource CalcEngine Tables

There are two tables that describe the mapping rules when converting Nexgen API responses into BTR xDS Format: `apiDataSource`, `apiDataSourceMapping`, and `apiDataSourceInputs` (if an API is a `POST` and needs inputs to run at login).  `apiDataSource` is the 'parent' table of `apiDataSourceMapping` and `apiDataSourceInputs`.  That is, endpoints can exist in `apiDataSource` without any mappings or inputs, however not the other way around.  `apiDataSourceMapping` rows are primarily used to describe how to map to historical/transactional data and `apiDataSourceInputs` list inputs to add before calling the Nexgen API.  The table schemas are described below.  See [Supported Mapping Features](#Supported-Mapping-Features) for information on how different settings provide specific control over how data is mapped to xDS format.

##### apiDataSource Layout

Column | Description
---|---
id | The name of the API which is then referenced in the `apiDataSourceMapping` table, `requires` column, and in [Command Processing](#Command-Processing).  The name should start with a lower case domain prefix (i.e. `hw`, `db`, `com`) which generally matches with the controller name in the API.
endpoint | The endpoint url (excluding the site url).
runAtLogin | A value indicating whether or not the API should be ran at login (as a _GET_ method).  _Blank_ or `1` will run it, returning `0` indicates that the API should **not** be run.
ignoreErrors | A value indicating whether or not errors from the API should be ignored.  This is helpful if the API itself makes external calls that are not always stable.  Returning `1` indicates that the API errors **can** be ignored.
eligibility | Upon login, if an API should only be ran based on data that is returned from other API(s), an _XPath Expression_ can be provided to run against xDS Data (i.e. `xDataDef/HistoryData/HistoryItem[@hisType='dbCalculationID' and @hisIndex='ACCRUED']` will only allow API to process if a row exists for the `ACCRUED` index).  If the expression returns a node, then the API can be ran, otherwise it'll be skipped.  Note, after login, an API no longer checks eligibility and it is responsibility of the CalcEngine to only call APIs correctly.
requires | When `eligiblity` is specified, a comma delimmited list of ids are required to indicate which APIs contain the required data to use during the `eligibility` expression evaluation.  When `id` values are provided in the `requires` column, the specified apiDataSource rows will run until completion before the dependent row starts and evaluates `eligibility`.
mergeMode | Control how historical/transaction data is merged into the current xDS data model.  The default is `Replace` which will _delete all existing history rows_ before adding rows from API results.  Using `Merge` will leave existing history, and _only delete history rows with matching index values_ before adding the rows from API results.  Note that [temporary queries](#Temp-Query-Processing) are always treated as `Replace`.

###### apiDataSource Layout Notes

1. Using the `requires` column changes the processing order significantly.  By default, all API requests are sent in a batch so that they can process simultaneously.  However, when `requires` is used by an API, it can not be called until its dependicies are *completely* finished.  Therefore, multiple batches will be created  and sent one at a time based on the 'dependency graph' generated by `requires`.
1. If an endpoint has a [{selector}](#apiDataSource-Selector-Support) that uses a value generated from the BRD calculation, you can use a requires value of `xDS`. When processing apiDataSource rows during login, all rows that *do not* use `xDS` are processed until completion first, then all rows that use `xDS` are processed. 

    >  Only time both `xDS` and `requires` column should be used in conjunction is if all following conditions are met:
    >  1. 'Data Selectors' are used in `endpoint`, `eligibility`, or `apiDataSourceInputs`
    >  2. **Both** 'xDS' fields (data not from LWC API calls) *and* LWC API results fields are used in Data Selectors
    >  3. Currently running API and each item listed in `requires` is part of a 'transaction'
    >    a. `runAtLogin=1`
    >    b. In same 'transaction' from command/command-inputs results
    > 
    >  If any of the above are `false`, then no matter what is 'required' for Data Selectors, **ONLY** `xDS` should be assigned.

1. You **must** provide `requires` if `apiDataSource.endpoint`, `apiDataSource.eligibility`, or `apiDataSourceInputs` values use any selector logic.



###### apiDataSource Selector Support

API Data Source endpoints support some token replacements via a selector syntax inside the endpoint url.  The most common endpoint format is `/businessapi-service-tbo/common/participant/v1/{legalIdentifier}/address`.

By default, the `{legalIdentifier}` token is always replaced by Nexgen server code using the xDS AuthID.  Note that 'AuthIDs' should never be generated in a url in *any* CalcEngine (including [command processing](#Command-Processing) calculations).  In addition to this specific token, there is a selector syntax to pull values from the currnetly logged in users profile.

The following selectors are supported inside endpoint urls.

Column | Description
---|---
`{legalIdentifier}` | This token is always replaced with the current user's xDS AuthID.
`{today}` | This token is always replaced with the date value of today in the format of yyyy-mm-dd.
`{Profile.field}` | Select any field from the `Profile` data.  For example, to select a field called `sharkfinDbAge`, use a token of `{Profile.sharkfinDbAge}`.
`{table.index.field}` | Select a field from a specific history row.  For example, `{dbCalculationID.PROJECT.calcID}` would select the `calcID` field from the `dbCalculationID` table where the index is `PROJECT`.
`{xDSApi.settingsName}` | If the endpoint is actually an api call to the KAT xDS API, the route segment for group can be provided via `xDS.settingsName` where `settingsName` is the name of an `appSettings` value.  For example, an `appSettings.severanceGroup` with a value of `DeltaSeverance` could be used via `{xDS.severanceGroup}` token in an endpoint url and it would be substituted with `DeltaSeverance`.  These values should be specified in the `RBLSite.appSettings` table of client BRDs.
`{QS.param}` | Select any value that will be provided via a querystring parameter.  Useful when the KatApp/javascript or [command processing calculation](#Command-Processing) is going to know the value and it is not stored in the xDS Profile.  For example, an apiDataSource `dbCalculationsDetailsDynamic` with an endpoint of `/businessapi-service-db/db/calc/v1/{legalIdentifier}/{QS.calcID}/calc-details-dynamic` would expect to be invoked via `dbCalculationsDetailsDynamic?calcID=11111` using [cacheRefreshKeys](#refreshing-api-data-on-demand--cacherefreshkeys) or during [command processing calculations](#Command-Processing).  Note that, when this feature is used, the API result will always be treated as a [temporary query](#Temp-Query-Processing) if the `{QS.param}` is specified as a 'query string'.  It will be a 'normal' query if the `{QS.param}` is part of the endpoint 'route'.
`{{resultCommandId.jsonSelector}}` | Select a field from a previous command result which was run within the current 'command processing' context.  This feature is usually used in conjunction with the `{QS.param}` feature.  See [Accessing Previous Command Result Values](#Accessing-Previous-Command-Result-Values) for more information.

##### apiDataSourceMappings Layout

Column | Description
---|---
dataSource | The `id` of the `apiDataSource` used to relate mappings to an endpoint.
apiTable | The name of the table (array of objects) returned in json responses.
xdsTable | Optional.  If provided, specifies the name of the table name that should be used in xDS profile.  If not provided, the value in `apiTable` is used.
indexField | Specifies how to generate the unique index for each history row.
manualFields | Optional. Inject custom values into each resopnse object before being processed.  Value is simply a comma delimitted list of `key1=value1,key2=value2` pairs or JSON object string `{ "key1": "value1", "key2": "value2" }`.  [See sample usage](#manual-fields)
fieldMapping | Optional. Controls how field names are mapped **when calling Nexgen APIs** before xDS mapping processing.  This is used in BA7 implementations to try and match field names between BA7 and Nexgen APIs.  The value is simply a comma delimitted list of `addr1=address1,zip=postalCode` or a JSON object string `{"addr1":"address1","zip":"postalCode"}`.  Renaming occurs before any xDS mapping processing occurs and this sample would rename all `addr1` fields to `address1` and all `zip` fields to `postalCode` .  [See sample usage](#field-mapping)
filterExpression | Optional.  Regular expression for field name patterns that must succeed to allow a field. Only matching fields that match the expression are mapped. [See sample usage](#field-filter-expressions)

##### apiDataSourceInputs Layout

Column | Description
---|---
dataSource | The `id` of the `apiDataSource` used to relate mappings to an endpoint.
key | The name of the input parameter to send to the API.
value | Can be a static value or a string representation of JSON object (if `value` starts with `json:`).  Note that `{legalIdentifier}` is always replaced with the current user's xDS AuthID.
parse | (Optional) A `1` or `0` indicating whether or not the site should attempt to parse the value into an `int`, `double` or `boolean`.  The default is `0` meaning the value will be treated as a `string` and enclosed in quotes.

**Note**: When inputs are provided, the API is always called as a `POST` method.

#### Custom API Reponse Processing

Some API response formats are not in a desireable format for use in CalcEngines.  The responses are massaged into a more usable form either before the [supported mapping features](#Supported-Mapping-Features) are processed or by the Nexgen site's API controller before the API response is cached.

##### QnA Processing

The QnA API responses are massaged my the Nexgen site controller before the results are cached.  Currently, it is assumed that the `invoke-sp/QaInitialize` and `invoke-sp/QaQuestionSelect` are always called in tandem and there are no apiDataSourceMappings defined.  

Every QnA API response is associated to a specific `quest_key` value.  Given the volume of data in QnA data that could be requested throughout a site visit, an algorithm to minimize the amount of data passed back and forth to CalcEngines was created.  Every xDS History Item created from a QnA API response with have the history type with a *suffix* of the current `quest_key`.  Then, before any submission to a CalcEngine that has an `iQuestKey` input, only history rows with a history type ending with the matching `quest_key` will be submitting to the CalcEngine.  Additionally, when these rows are submitted to the CalcEngine, the *quest_key suffix* will be **removed** so that the CalcEngine can have a single *generic* table specified in the input tab regardless of which `quest_key` is being processed. 

###### invoke-sp/QaInitialize Original Response

The original response has: 

1. A list of all QnA parameters associated with the current `quest_key`.

```json
{
  "response": {
    "resultData": [],
    "outputs": {
      "outputData": {
        "parameters": [
          { "name": "returnCode", "type": "INTEGER", "value": "0", "index": "1" },
          { "name": "description", "type": "VARCHAR", "value": "Communications > Communication Preferences", "index": "7" },
          { "name": "jump_back", "type": "VARCHAR", "value": "N", "index": "8" }
        ],
        "parameterCount": 3
      }
    }
  },
  "status": { "code": "0", "message": "SUCCESS" }
}
```

###### invoke-sp/QaInitialize Updated Response

The final response Xml to be cached:

1. Includes the `name` and `value` columns from original response.
1. Injects a `quest_key` column into each history row.
1. Injects a sequential `index` into each history row.
1. Appends the current `quest_key` to `QaInitialize` to create the final `hisType` value.

```xml
<xDataDef>
  <HistoryData>
    <HistoryItem hisType="QaInitializeCommPref" hisIndex="0">
      <index>0</index>
      <quest_key>CommPref</quest_key>
      <name>returnCode</name>
      <value>0</value>
    </HistoryItem>
    <HistoryItem hisType="QaInitializeCommPref" hisIndex="1">
      <index>1</index>
      <quest_key>CommPref</quest_key>
      <name>description</name>
      <value>Communications &gt; Communication Preferences</value>
    </HistoryItem>
    <HistoryItem hisType="QaInitializeCommPref" hisIndex="2">
      <index>2</index>
      <quest_key>CommPref</quest_key>
      <name>jump_back</name>
      <value>N</value>
    </HistoryItem>
  </HistoryData>
</xDataDef>
```

###### invoke-sp/QaQuestionSelect Original Response

The original response has: 

1. A `resultSetMetaData.columnData[]` array property that contains meta data describing each column in the results (the sample below does not display all rows).
1. A `resultSetData.rowList[]` array property that contains a row for each 'QnA object row' to process.
1. Each `rowList` row has a `columnList[]` array property and each row within this property describes a column using `index` (which references the `index` property in `columnData` meta data rows) and a `value`.

```json
{
    "response": {
        "resultData": [
            {
                "resultSetMetaData": {
                    "columnData": [
                        { "index": 1, "name": "quest_seq", "type": "-6", "value": null },
                        { "index": 2, "name": "descr", "type": "12", "value": null },
                        { "index": 3, "name": "ans_type", "type": "1", "value": null },
                        { "index": 20, "name": "ans_char", "type": "12", "value": null },
                        { "index": 27, "name": "descr2", "type": "12", "value": null },
                        { "index": 28, "name": "descr3", "type": "12", "value": null },
                        { "index": 29, "name": "descr4", "type": "12", "value": null }
                    ]
                },
                "resultSetData": {
                    "rowList": [
                        {
                            "columnList": [
                                { "index": 1, "value": "6" },
                                { "index": 2, "value": "<div class=\"alert alert-info commPrefText\"><strong>Note</strong>  To add a mobile phone number to your Communication Preferences, please visit the <a href=\"#/portal/view/MY_PROFILE?TAB=PERSONAL\">Personal Info</a> tab.</div>" },
                                { "index": 3, "value": "O" },
                                { "index": 20, "value": " " },
                                { "index": 27, "value": null },
                                { "index": 28, "value": null },
                                { "index": 29, "value": null }
                            ]
                        },
                        {
                            "columnList": [
                                { "index": 1, "value": "1" },
                                { "index": 2, "value": "<strong>Work E-mail Address</strong><p>Your Work e-mail Address.</p>" },
                                { "index": 3, "value": "O" },
                                { "index": 20, "value": "911391007@samplelife.com" },
                                { "index": 27, "value": null },
                                { "index": 28, "value": null },
                                { "index": 29, "value": null }
                            ]
                        },
                        {
                            "columnList": [
                                { "index": 1, "value": "12" },
                                { "index": 2, "value": "<div class=\"commPrefText\"><strong>Health &amp; Welfare Event Communications</strong><p>Select the email address you would like to use for receiving event reminders and notifications.</p></div>" },
                                { "index": 3, "value": "R" },
                                { "index": 20, "value": "Email  to work email (911391007@samplelife.com)|<BR> ~t1/Email to personal email (myname2@sample.com)|<BR> ~t2/" },
                                { "index": 27, "value": null },
                                { "index": 28, "value": null },
                                { "index": 29, "value": null }
                            ]
                        },
                        {
                            "columnList": [
                                { "index": 1, "value": "13" },
                                { "index": 2, "value": "Sample List Row With Answer Values To Retreive from invoke-sp/QaAnswerSelect API call" },
                                { "index": 3, "value": "W" },
                                { "index": 20, "value": "Option 1 ~t1/Option 2 ~t2/More In Api Results ~t3/" },
                                { "index": 27, "value": " and more description details available here." },
                                { "index": 28, "value": null },
                                { "index": 29, "value": null }
                            ]
                        }
                    ]
                },
                "name": null,
                "index": 1
            }
        ],
        "outputs": {
            "outputData": {
                "parameters": [
                    { "name": "returnCode", "type": "INTEGER", "value": "0", "index": "1" },
                    { "name": "errorMessage", "type": "VARCHAR", "value": null, "index": "8" }
                ],
                "parameterCount": 2
            }
        }
    },
    "status": { "code": "0", "message": "SUCCESS" }
}
```

###### invoke-sp/QaQuestionSelect Updated Response

The final response Xml to be cached:

1. For each row in `resultSetData.rowList[]`:
    1. Appends the current `quest_key` to `QaQuestionSelect` to create the final `hisType` value.
    1. Injects a sequential `index` into each history row.
    1. Injects a `quest_key` column into each history row.
    1. Includes all columns (defined via `resultSetMetaData.columnData[]`) from original response except for `descr`, `descr2`, `descr3`, and `desc4`.
    1. Injects a `descr` column into each history row that is a concatenation of the four 'descr' fields found in the result.
1. For each generated history row where `ans_type=W` (list type question):
    1. Call the `invoke-sp/QaAnswerSelect` API endpoint to retrieve a list of valid answers.
    1. Replace the `ans_char` value (it starts with a partial list) with a `{text}~t{value}/` repeating list for each row returned from the API call.
1. For each generated history row where `ans_char` contains `~t` (original return value or generated value from previous step), split the `ans_char` value into a list for each `{text}~t{value}/` item:
    1. Appends the current `quest_key` to `QaAnswerSelect` to create the final `hisType` value.
    1. Injects a sequential `index` into each history row.
    1. Injects a `quest_key` column into each history row.
    1. Injects a `quest_seq` column into each history row to link it to appropriate `QaQuestionSelect*` row.
    1. Injects `answer` and `text` columns into each history row for the current `{text}~t{value}/` item.
    1. Clears out `ans_char` from the original `QaQuestionSelect*` row.

```xml
<xDataDef Cache.Key="QnA.CommPref">
  <HistoryData>
    <HistoryItem hisType="QaQuestionSelectCommPref" hisIndex="0">
      <index>0</index>
      <quest_key>CommPref</quest_key>
      <descr>&lt;div class="alert alert-info commPrefText"&gt;&lt;strong&gt;Note&lt;/strong&gt;  To add a mobile phone number to your Communication Preferences, please visit the &lt;a href="#/portal/view/MY_PROFILE?TAB=PERSONAL"&gt;Personal Info&lt;/a&gt; tab.&lt;/div&gt;</descr>
      <quest_seq>6</quest_seq>
      <ans_type>O</ans_type>
      <ans_char> </ans_char>
    </HistoryItem>
    <HistoryItem hisType="QaQuestionSelectCommPref" hisIndex="1">
      <index>1</index>
      <quest_key>CommPref</quest_key>
      <descr>&lt;strong&gt;Work E-mail Address&lt;/strong&gt;&lt;p&gt;Your Work e-mail Address.&lt;/p&gt;</descr>
      <quest_seq>1</quest_seq>
      <ans_type>O</ans_type>
      <ans_char>911391007@samplelife.com</ans_char>
    </HistoryItem>
    <HistoryItem hisType="QaQuestionSelectCommPref" hisIndex="3">
      <index>3</index>
      <quest_key>CommPref</quest_key>
      <descr>&lt;div class="commPrefText"&gt;&lt;strong&gt;Health &amp;amp; Welfare Event Communications&lt;/strong&gt;&lt;p&gt;Select the email address you would like to use for receiving event reminders and notifications.&lt;/p&gt;&lt;/div&gt;</descr>
      <quest_seq>12</quest_seq>
      <ans_type>R</ans_type>
      <ans_char></ans_char>
    </HistoryItem>
    <HistoryItem hisType="QaQuestionSelectCommPref" hisIndex="3">
      <index>4</index>
      <quest_key>CommPref</quest_key>
      <descr>Sample List Row With Answer Values To Retreive from invoke-sp/QaAnswerSelect API call and more description details available here.</descr>
      <quest_seq>13</quest_seq>
      <ans_type>W</ans_type>
      <ans_char></ans_char>
    </HistoryItem>
    <HistoryItem hisType="QaAnswerSelectCommPref" hisIndex="0">
      <index>0</index>
      <quest_key>CommPref</quest_key>
      <quest_seq>12</quest_seq>
      <answer>1</answer>
      <text>Email  to work email (911391007@samplelife.com)|&lt;BR&gt; </text>
    </HistoryItem>
    <HistoryItem hisType="QaAnswerSelectCommPref" hisIndex="1">
      <index>1</index>
      <quest_key>CommPref</quest_key>
      <quest_seq>12</quest_seq>
      <answer>2</answer>
      <text>Email to personal email (myname2@sample.com)|&lt;BR&gt; </text>
    </HistoryItem>
    <HistoryItem hisType="QaAnswerSelectCommPref" hisIndex="0">
      <index>0</index>
      <quest_key>CommPref</quest_key>
      <quest_seq>13</quest_seq>
      <answer>1</answer>
      <text>Option 1 </text>
    </HistoryItem>
    <HistoryItem hisType="QaAnswerSelectCommPref" hisIndex="1">
      <index>1</index>
      <quest_key>CommPref</quest_key>
      <quest_seq>13</quest_seq>
      <answer>2</answer>
      <text>Option 2 </text>
    </HistoryItem>
    <HistoryItem hisType="QaAnswerSelectCommPref" hisIndex="2">
      <index>2</index>
      <quest_key>CommPref</quest_key>
      <quest_seq>13</quest_seq>
      <answer>3</answer>
      <text>Option 3 </text>
    </HistoryItem>
    <HistoryItem hisType="QaAnswerSelectCommPref" hisIndex="2">
      <index>3</index>
      <quest_key>CommPref</quest_key>
      <quest_seq>13</quest_seq>
      <answer>4</answer>
      <text>Option 4 </text>
    </HistoryItem>
  </HistoryData>
</xDataDef>
```

##### WebDataView Processing

If the API endpoint ran contains `invoke-sp/WebDataView`, it is recognized as a WebDataView response.

###### WebDataView Original Response

The original response has: 

1. A `resultSetMetaData.columnData[]` array property that contains meta data describing each column in the results (the sample below does not display all rows).
1. A `resultSetData.rowList[]` array property that contains a row for each 'Web Data View object row' to process.
1. Each `rowList` row has a `columnList[]` array property and each row within this property describes a column using `index` (which references the `index` property in `columnData` meta data rows) and a `value`.

```json
{
    "response": {
        "resultData": [
            {
                "resultSetMetaData": {
                    "columnData": [
                        {
                            "index": 1,
                            "name": "VALUE1",
                            "type": "12",
                            "value": null
                        },
                        {
                            "index": 2,
                            "name": "VALUE2",
                            "type": "12",
                            "value": null
                        },
                        {
                            "index": 3,
                            "name": "VALUE3",
                            "type": "12",
                            "value": null
                        },
                        {
                            "index": 4,
                            "name": "VALUE4",
                            "type": "12",
                            "value": null
                        }
                    ]
                },
                "resultSetData": {
                    "rowList": [
                        {
                            "columnList": [
                                {
                                    "index": 1,
                                    "value": "Date"
                                },
                                {
                                    "index": 2,
                                    "value": "Transaction"
                                },
                                {
                                    "index": 3,
                                    "value": "Amount"
                                },
                                {
                                    "index": 4,
                                    "value": "Status"
                                }
                            ]
                        },
                        {
                            "columnList": [
                                {
                                    "index": 1,
                                    "value": "08/11/2022"
                                },
                                {
                                    "index": 2,
                                    "value": "HSA Per-Pay-Period Change"
                                },
                                {
                                    "index": 3,
                                    "value": "$4.62"
                                },
                                {
                                    "index": 4,
                                    "value": "Completed"
                                }
                            ]
                        }
                    ]
                },
                "name": null,
                "index": 1
            }
        ],
        "outputs": {
            "outputData": {
                "parameters": [
                    { "name": "returnCode", "type": "INTEGER", "value": "0", "index": "1" },
                    { "name": "errorMessage", "type": "VARCHAR", "value": null, "index": "6" }
                ],
                "parameterCount": 2
            }
        }
    },
    "status": { "code": "0", "message": "SUCCESS" }
}
```

###### WebDataView Updated Response

The updated response will have:

1. Create a `webDataView` array property to hold API response.
1. Inject a meta data row inside `webDataView`:
    1. Inject a `type` column set to `resultSetMetaData`.
    1. Inject a `pagename` column holding the value supplied in the API post data.
    1. Inject a mapping of `col*` for all columns (defined via `resultSetMetaData.columnData[]`) from original response that contains the 'name' of the column.
1. Inject a row for each row in original `resultSetData.rowList[]`:
    1. Inject a `type` column set to `resultSetData`.
    1. Inject a `pagename` column holding the value supplied in the API post data.
    1. Inject `col*` column containing the value for all columns (defined via `resultSetMetaData.columnData[]`) from original response.

```json
{
    "response": {
        "webDataView": [
            {
                "pagename": "HSAP.2022-08-11 15:57:49.29",
                "type": "resultSetMetaData",
                "col1": "VALUE1",
                "col2": "VALUE2",
                "col3": "VALUE3",
                "col4": "VALUE4"
            },
            {
                "pagename": "HSAP.2022-08-11 15:57:49.29",
                "type": "resultSetData",
                "col1": "Date",
                "col2": "Transaction",
                "col3": "Amount",
                "col4": "Status"
            },
            {
                "pagename": "HSAP.2022-08-11 15:57:49.29",
                "type": "resultSetData",
                "col1": "08/11/2022",
                "col2": "HSA Per-Pay-Period Change",
                "col3": "$4.62",
                "col4": "Completed"
            }
        ]
    },
    "status": { "code": "0", "message": "SUCCESS" }
}
```

##### Transaction History Details Processing

If the API endpoint ran ends with `/transaction-details`, it is recognized as a transaction detail response.  The original response has a `transactionHistoryDetails` where each row is *one field* from a specific row (identified by `rowNumber` and `columnNumber`).  It is reorganized to have each row in the array to contain all fields for the given row.  Additionally, a `transactionDetailsColumns` meta property is added to describe how many columns are present in each row.

###### Transaction History Details Original Response

```json
{
  "response": {
    "confirmationID": "22223140525",
    "transactionHistoryDetails": [
      { "rowNumber": 1, "columnNumber": 1, "value": "Plan" },
      { "rowNumber": 1, "columnNumber": 2, "value": "GRP" },
      { "rowNumber": 2, "columnNumber": 1, "value": "Type of Tax Withholding" },
      { "rowNumber": 2, "columnNumber": 2, "value": "State" }
    ]
  },
  "status": { "code": "0", "message": "SUCCESS" }
}
```

###### Transaction History Details Updated Response

```json
{
    "response": {
      "confirmationID": "22223140525",
      "transactionDetailsColumns": 2,
      "transactionHistoryDetails": [
        {
          "rowNumber": 1,
          "col1": "Plan",
          "col2": "GRP"
        },
        {
          "rowNumber": 2,
          "col1": "Type of Tax Withholding",
          "col2": "State"
        }
      ]
    },
    "status": { "code": "0", "message": "SUCCESS" }
  }
  ```

##### Dynamic Calc Details Processing

If the API endpoint ran ends with `/calc-details-dynamic`, it is recognized as a dynamic calc detail response.

###### Dynamic Calc Details Original Response

The original response has: 

1. A `resultSections` array property where each row contains meta data about the table (ID, header and footer Savanna IDs).
1. A `gridColumns` array property that contains a row for *each column* for a given table (linked via the `TABLE_NUM` value).  Only columns listed in this child table should be processed.
1. A `gridRows` array property where each row is a row of data for the specified table (linked via the `TABLE_NUM` value) and the appropriate properties (with matching names described in `gridColumns`) contain data and all other columns are null.

```json
{
    "calcIDDisplayValue": "June 05, 2184 08:05:10.004 AM",
    "calcAsOfDate": "2184-06-05",
    "calcRunDatetime": "2184-06-05T12:05:10.004Z",
    "resultSections": [
        {
            "TABLE_NUM": "A0132",
            "TABLE_HEADER": "A01_hdr.html",
            "TABLE_FOOTER": null,
            "CATEGORY": null,
            "RESULT_GROUP": null
        },
        {
            "TABLE_NUM": "A400002",
            "TABLE_HEADER": "A40_0002_hdr.html",
            "TABLE_FOOTER": null,
            "CATEGORY": null,
            "RESULT_GROUP": null
        }
    ],
    "gridColumns": [
        {
            "TABLE_NUM": "A0132",
            "COL_HEADER": "Description",
            "COL_NAME": "ROWLABEL",
            "COL_FORMAT": "STRING_LEFT"
        },
        {
            "TABLE_NUM": "A0132",
            "COL_HEADER": "Value",
            "COL_NAME": "CHARVAL1",
            "COL_FORMAT": "STRING_LEFT"
        },
        {
            "TABLE_NUM": "A400002",
            "COL_HEADER": "Payment Options",
            "COL_NAME": "ROWLABEL",
            "COL_FORMAT": "STRING_LEFT"
        },
        {
            "TABLE_NUM": "A400002",
            "COL_HEADER": "Your Total Pension Benefit <BR>(monthly, unless otherwise noted)",
            "COL_NAME": "CHARVAL1",
            "COL_FORMAT": "STRING_LEFT"
        },
        {
            "TABLE_NUM": "A400002",
            "COL_HEADER": "Benefit to your <BR>spouse or joint annuitant <BR>after your death",
            "COL_NAME": "CHARVAL2",
            "COL_FORMAT": "STRING_LEFT"
        }
    ],
    "gridRows": [
        {
            "TABLE_NUM": "A0132",
            "ROWLABEL": "Date of Birth:",
            "FLOAT1": 0.0,
            "FLOAT2": 0.0,
            "FLOAT3": 0.0,
            "FLOAT4": 0.0,
            "FLOAT5": 0.0,
            "FLOAT6": 0.0,
            "FLOAT7": 0.0,
            "FLOAT8": 0.0,
            "FLOAT9": 0.0,
            "CHARVAL": null,
            "CHARVAL1": "03/29/1967",
            "CHARVAL2": "N/A",
            "CHARVAL3": null,
            "CHARVAL4": null,
            "CHARVAL5": null,
            "CHARVAL6": null,
            "CHARVAL7": null,
            "CHARVAL8": null,
            "CHARVAL9": null,
            "DATE1": null,
            "DATE2": null,
            "DATE3": null,
            "DATE4": null,
            "DATE5": null,
            "DATE6": null,
            "DATE7": null,
            "DATE8": null,
            "DATE9": null
        },
        {
            "TABLE_NUM": "A0132",
            "ROWLABEL": "Ford Service Date:",
            "FLOAT1": 0.0,
            "FLOAT2": 0.0,
            "FLOAT3": 0.0,
            "FLOAT4": 0.0,
            "FLOAT5": 0.0,
            "FLOAT6": 0.0,
            "FLOAT7": 0.0,
            "FLOAT8": 0.0,
            "FLOAT9": 0.0,
            "CHARVAL": null,
            "CHARVAL1": "06/12/2000",
            "CHARVAL2": "N/A",
            "CHARVAL3": null,
            "CHARVAL4": null,
            "CHARVAL5": null,
            "CHARVAL6": null,
            "CHARVAL7": null,
            "CHARVAL8": null,
            "CHARVAL9": null,
            "DATE1": null,
            "DATE2": null,
            "DATE3": null,
            "DATE4": null,
            "DATE5": null,
            "DATE6": null,
            "DATE7": null,
            "DATE8": null,
            "DATE9": null
        },
        {
            "TABLE_NUM": "A400002",
            "ROWLABEL": "Single Life Benefit",
            "FLOAT1": 0.0,
            "FLOAT2": 0.0,
            "FLOAT3": 0.0,
            "FLOAT4": 0.0,
            "FLOAT5": 0.0,
            "FLOAT6": 0.0,
            "FLOAT7": 0.0,
            "FLOAT8": 0.0,
            "FLOAT9": 0.0,
            "CHARVAL": null,
            "CHARVAL1": "$3,320.26",
            "CHARVAL2": "N/A",
            "CHARVAL3": "$0.00",
            "CHARVAL4": null,
            "CHARVAL5": null,
            "CHARVAL6": null,
            "CHARVAL7": null,
            "CHARVAL8": null,
            "CHARVAL9": null,
            "DATE1": null,
            "DATE2": null,
            "DATE3": null,
            "DATE4": null,
            "DATE5": null,
            "DATE6": null,
            "DATE7": null,
            "DATE8": null,
            "DATE9": null
        },
        {
            "TABLE_NUM": "A400002",
            "ROWLABEL": "50% Joint & Survivor Benefit - Spouse Option",
            "FLOAT1": 0.0,
            "FLOAT2": 0.0,
            "FLOAT3": 0.0,
            "FLOAT4": 0.0,
            "FLOAT5": 0.0,
            "FLOAT6": 0.0,
            "FLOAT7": 0.0,
            "FLOAT8": 0.0,
            "FLOAT9": 0.0,
            "CHARVAL": null,
            "CHARVAL1": "$2,953.37",
            "CHARVAL2": "$1,476.69",
            "CHARVAL3": "$0.00",
            "CHARVAL4": "$1,476.69",
            "CHARVAL5": null,
            "CHARVAL6": null,
            "CHARVAL7": null,
            "CHARVAL8": null,
            "CHARVAL9": null,
            "DATE1": null,
            "DATE2": null,
            "DATE3": null,
            "DATE4": null,
            "DATE5": null,
            "DATE6": null,
            "DATE7": null,
            "DATE8": null,
            "DATE9": null
        }
    ],
    "footerContent": []
}
```

###### Dynamic Calc Details Updated Response

The updated response:

1. Ignores the `footerContent` property.
1. Merges `resultSections` and `gridColumns` into a more condensed meta table named `tableInfo` retaining only name, header Savanna ID and footer Savanna ID.  Additionaly, it adds a `columns` property indicating the number of columns of data that are present.
1. Uses `gridRows` to create a more condensed version of an `tableRows` array property.
    1. A row `type` of `alignment`, `header`, or `data` is added where `alignment` and `header` are meta data rows to be used by CalcEngines.
    1. Each data row only has the columns used in each table instead of every possible item.

```json
{
    "response": {
        "calcIDDisplayValue": "June 05, 2184 08:05:10.004 AM",
        "calcAsOfDate": "2184-06-05",
        "calcRunDatetime": "2184-06-05T12:05:10.004Z",
        "tableInfo": [
            {
                "table": "A0132",
                "headerId": "A01_hdr.html",
                "footerId": null,
                "columns": 2
            },
            {
                "table": "A400002",
                "headerId": "A40_0002_hdr.html",
                "footerId": null,
                "columns": 3
            }
        ],
        "tableRows": [
            {
                "table": "A0132",
                "type": "alignment",
                "col1": "STRING_LEFT",
                "col2": "STRING_LEFT"
            },
            {
                "table": "A0132",
                "type": "header",
                "col1": "Description",
                "col2": "Value"
            },
            {
                "table": "A0132",
                "type": "data",
                "col1": "Date of Birth:",
                "col2": "03/29/1967"
            },
            {
                "table": "A0132",
                "type": "data",
                "col1": "Ford Service Date:",
                "col2": "06/12/2000"
            },
            {
                "table": "A400002",
                "type": "alignment",
                "col1": "STRING_LEFT",
                "col2": "STRING_LEFT",
                "col3": "STRING_LEFT"
            },
            {
                "table": "A400002",
                "type": "header",
                "col1": "Payment Options",
                "col2": "Your Total Pension Benefit <BR>(monthly, unless otherwise noted)",
                "col3": "Benefit to your <BR>spouse or joint annuitant <BR>after your death"
            },
            {
                "table": "A400002",
                "type": "data",
                "col1": "Single Life Benefit",
                "col2": "$3,320.26",
                "col3": "N/A"
            },
            {
                "table": "A400002",
                "type": "data",
                "col1": "50% Joint & Survivor Benefit - Spouse Option",
                "col2": "$2,953.37",
                "col3": "$1,476.69"
            }
        ]
    },
    "status": {
        "code": "0",
        "message": "SUCCESS"
    }
}
```

###### Dynamic Calc Details Final xDS Mapping

After the response is processed using the designated mappings and the results are returned to the site, the Nexgen API controller will look inside each `tableInfo` row that has a Savanna header or footer ID specified.  It will request the content for each of them and place them inside new properties/elements in the Xml:  `headerId` content is injected into `headerContent` and `footerId` into `footerContent`.

##### Eligibility Group Processing

If the API endpoint ran contains `/elig-groups`, it is recognized as a Eligibility Group response.

###### Eligibility Group Original Response

The original response has: 

1. Array properties at the root.
1. Each array property contains rows of objects identified by `planID`.

```json
{
  "response": {
    "commonPopulations": [
      {
        "planID": "98",
        "populations": {
          "isTextElig": false,
          "isDocUpld": true,
          "isFaqs": true
        }
      }
    ],
    "hwPopulations": [
      {
        "planID": "21",
        "populations": {
          "isCoveragePayment": false,
          "isHwChannel": true,
          "isCobraCw": false
        }
      }
    ]
  },
  "status": {
    "code": "0",
    "message": "SUCCESS"
  }
}
```

###### Eligibility Group Updated Response

The updated response:

1. Create a `eligGroups` array property to hold API response.
1. Inject a row for each 'property' contained array row (regardless of level) with `key` and `value` property.
1. `key` is `arrayName-planID-propertyName`.

```json
{
  "response": {
    "eligGroups": [
      { "key": "commonPopulations-98-isTextElig", "value": false },
      { "key": "commonPopulations-98-isDocUpld", "value": true },
      { "key": "commonPopulations-98-isFaqs", "value": true },
      { "key": "hwPopulations-21-isCoveragePayment", "value": false },
      { "key": "hwPopulations-21-isHwChannel", "value": true },
      { "key": "hwPopulations-21-isCobraCw", "value": false }
    ]
  },
  "status": {
    "code": "0",
    "message": "SUCCESS"
  }
}
```


##### Life Events Processing

If the API endpoint ran ends with `/life-events`, it is recognized as a Life Events custom processing response.

###### Life Events Original Response

The original response has: 

1. Array properties of `openEvents` and `eligEvents` at the root.

```json
{
	"response": {
		"openEvents": [
			{
				"eventType": "BIRTH",
				"description": "Birth/Adoption",
				"eventCode": "BIRTH",
				"eventDate": "2023-07-07",
				"eventStatus": "COMPLETED",
				"isCompleted": true,
				"isPriority": false,
				"isPreviewPeriod": false,
				"isEnrollmentPeriod": false,
				"isCorrectionPeriod": false,
				"isReviewPeriod": false,
				"isPaymentRequired": false,
				"canDelete": false,
				"planID": "LE,21",
				"eventID": "268803",
				"eventCutoffDate": "2023-08-07T03:59:59.000Z",
				"eventStatusDate": "2023-07-21T12:49:46.616Z",
				"canMakeChanges": true
			}
		],
		"eligEvents": [
			{
				"eventType": "RETINT",
				"description": "Retiree Enrollment",
				"eventCode": "RETINT",
				"minEventDate": "2023-07-22",
				"maxEventDate": "2023-07-23",
				"maxModelDate": "2024-12-31",
				"canReport": false,
				"canModel": true,
				"planID": "LE,21"
			}
		]
	}
}
```

###### Life Events Updated Response

The updated response before mapping processing:

1. Create a `pendingBenefits` array property.
1. For each `openEvents` row with `eventStatus == COMPLETED` and `eventDate > Today`, run `/coverages?asOfDate=` with each `eventDate`
	1. For each `coverages` row where `pending` object is present
		1. Inject the `optionName`, `coverageLevelName`, `eeCostPreTax`, and `eeCostPostTax` from the `coverages` row into the child `pending` object with a `nonPended` prefix (i.e. `nonPendedOptionName`).
		1. Inject the `pending` object into the `pendingBenefits` array property
1. Process mappings as normal

**Sample 'response' with injected `pendingBenefits`**

```json
{
	"response": {
		"openEvents": [
			{
				"eventType": "BIRTH",
				"description": "Birth/Adoption",
				"eventCode": "BIRTH",
				"eventDate": "2023-07-07",
				"eventStatus": "COMPLETED",
				"isCompleted": true,
				"isPriority": false,
				"isPreviewPeriod": false,
				"isEnrollmentPeriod": false,
				"isCorrectionPeriod": false,
				"isReviewPeriod": false,
				"isPaymentRequired": false,
				"canDelete": false,
				"planID": "LE,21",
				"eventID": "268803",
				"eventCutoffDate": "2023-08-07T03:59:59.000Z",
				"eventStatusDate": "2023-07-21T12:49:46.616Z",
				"canMakeChanges": true
			}
		],
		"eligEvents": [
			{
				"eventType": "RETINT",
				"description": "Retiree Enrollment",
				"eventCode": "RETINT",
				"minEventDate": "2023-07-22",
				"maxEventDate": "2023-07-23",
				"maxModelDate": "2024-12-31",
				"canReport": false,
				"canModel": true,
				"planID": "LE,21"
			}
		],
		"pendingBenefits": [
			{
				"benefitType": "SUPPLIFE",
				"benefitName": "Supplemental Employee Life Insurance",
				"optionName": "5x Pay",
				"coverageLevel": "02",
				"coverageLevelName": "Smoker",
				"electionAmt": 0.0,
				"electionChildAmt": 0.0,
				"imputedAmt": 0.0,
				"premiumAmt": 0.0,
				"pendingReason": "EOI",
				"eoiVendor": "MetLife",
				"eoiDeadline": "2023-09-11",
				"eoiSSOAvailable": true,
				"eventType": "OPENENR",
				"eventDate": "2024-01-01",
				"effDate": "2024-01-01T05:00:00Z",
				"expDate": "2025-01-01T04:59:59Z",
				"optionID": "05",
				"eeCostPreTax": 0.0,
				"eeCostPostTax": 0.0,
				"erCostPreTax": 0.0,
				"erCostPostTax": 0.0,
				"electionSpouseAmt": 0.0,
				"isPtpCovered": true,
				"eventID": "251721",
				"nonPendedOptionName": "Waive Coverage",
				"nonPendedCoverageLevelName": "NA",
				"nonPendedEeCostPreTax": 0.0,
				"nonPendedEeCostPostTax": 0.0
			}
		]
	}
}
```

##### Beneficiary Processing

If the API endpoint ran ends with `/beneficiaries` and contains `/common/participant/`, it is recognized as a Beneficiary custom processing response.

###### Beneficiary Original Response

The original response has: 

1. Each row of `beneficiaries` can have nested array properties of `beneficiaryDetails/designations`.
1. Each row of `designations` can have multiple designations for each `planType`, but only one row will be 'effective' (no `expDate` present).

```json
{
  "beneficiaries": [
    {
      "beneficiaryDetails": {
        "ssn": "811550202",
        "birthDate": "2019-02-02",
        "genderCode": "FEMALE",
        "name": {
          "nameLast": "Adopted",
          "nameFirst": "Annie"
        },
        "communication": {
          "addresses": [
            {
              "addressType": "MAILING",
              "country": "UNKNOWN"
            }
          ]
        },
        "relationshipCode": "C",
        "relationship": "Child",
        "isSpouse": false,
        "isBeneHidden": false,
        "designations": [
			{
				"planType": "HW",
				"planID": "21",
				"benefitType": "ADD",
				"beneDesignationType": "Contingent",
				"beneID": 17,
				"designatedPercent": 33.0,
				"isEquallyDistributed": false,
				"effDate": "2023-05-17T04:00:00.000Z",
				"expDate": "2023-05-22T03:59:59.000Z",
				"beneStatus": "Confirmed",
				"isIrrevocable": false
			},
			{
				"planType": "HW",
				"planID": "21",
				"benefitType": "ADD",
				"beneDesignationType": "Contingent",
				"beneID": 17,
				"designatedPercent": 25.0,
				"isEquallyDistributed": false,
				"effDate": "2023-06-22T04:00:00.000Z",
				"beneStatus": "Confirmed",
				"isIrrevocable": false
			}
		]
      },
      "ID": 17,
      "beneType": "PERSON"
    }
  ]
}
```

###### Beneficiary Updated Response

The updated response:

1. For each row in `beneficiaries/beneficiaryDetails/designations`, remove all rows that have an `expDate` property present.
1. Final result will have at most a one `designations` row per `planType`.

```json
{
  "beneficiaries": [
    {
      "beneficiaryDetails": {
        "ssn": "811550202",
        "birthDate": "2019-02-02",
        "genderCode": "FEMALE",
        "name": {
          "nameLast": "Adopted",
          "nameFirst": "Annie"
        },
        "communication": {
          "addresses": [
            {
              "addressType": "MAILING",
              "country": "UNKNOWN"
            }
          ]
        },
        "relationshipCode": "C",
        "relationship": "Child",
        "isSpouse": false,
        "isBeneHidden": false,
        "designations": [
			{
				"planType": "HW",
				"planID": "21",
				"benefitType": "ADD",
				"beneDesignationType": "Contingent",
				"beneID": 17,
				"designatedPercent": 25.0,
				"isEquallyDistributed": false,
				"effDate": "2023-06-22T04:00:00.000Z",
				"beneStatus": "Confirmed",
				"isIrrevocable": false
			}
		]
      },
      "ID": 17,
      "beneType": "PERSON"
    }
  ]
}
```

#### Supported Mapping Features

In all the supported features described, a sample json resopnse that will be used to generate mappings is shown below.  Mappings are only processed when the response `status.code` does not equal `-1`.

Resopnse properties that are not part of an object within an array property (`[]`) are **automatically mapped to the xDS Profile**, there is no need to provide a `apiDataSourceMapping` row.  For any response array property that you want to be converted into xDS history rows, you *must* provide a `apiDataSourceMapping` row.

In the JSON response, the `response` property is renamed to `profile` before processing, so any mapping instructions against the root object, should use `profile` (i.e. [Namespacing Fields](#Namespacing-Fields) or [Mapping Containers to History](#mapping-response-containers-to-history)).

```json
{
    "response": {
        "person": {
            "birthDate": "1955-02-28",
            "name": {
                "nameLast": "TEST",
                "nameFirst": "EMPLOYEE"
            },
            "employment": {
                "emplCategory": "PART_TIME",
                "emplStatusCode": "A",
                "payRate": "54329.6",
                "hireDate": "1977-10-17"
            },
            "prevEmployment": {
                "emplCategory": "PART_TIME",
                "emplStatusCode": "A",
                "payRate": "54329.6",
                "hireDate": "1967-10-17"
            },
            "communication": {
                "phones": [
                    {
                        "type": "WORK",
                        "countryCode": "1",
                        "areaCode": "866",
                        "dialNumber": "5551212"
                    },
                    {
                        "type": "HOME",
                        "countryCode": "1",
                        "areaCode": "888",
                        "dialNumber": "5551212"
                    }
                ]
            }
        },
        "paymentDate": [
            "2022-06-30",
            "2022-04-30"
        ],
        "beneficiaries": [
            {
                "beneficiaryDetails": {
                    "ssn": "11669594",
                    "name": {
                        "nameLast": "TEST",
                        "nameFirst": "BENEFICIARY",
                    },
                    "communication": {
                        "addresses": [
                            {
                                "addressType": "HOME",
                                "address1": "123 Normal Way",
                                "city": "New York",
                                "postalCode": "12121",
                                "state": "NY"
                            },
                            {
                                "addressType": "MAILING",
                                "address1": "999 Conduent Towers",
                                "city": "Manhattan",
                                "postalCode": "34343",
                                "state": "NY"
                            }
                        ]
                    }
                }
            }
        ],
        "designations": [
            {
                "planID": "21",
                "benefitType": "BASICLIFE",
                "designatedPercent": 100.0
            },
            {
                "planID": "22",
                "benefitType": "BASICLIFE",
                "designatedPercent": 100.0
            },
            {
                "planID": "21",
                "benefitType": "SUPPLIFE",
                "designatedPercent": 100.0,
            },
            {
                "planID": "22",
                "benefitType": "SUPPLIFE",
                "designatedPercent": 100.0,
            }
        ],        
        "electedCoverages": [
            {
                "benefitType": "SPOUSELIFE",
                "benefitName": "Spouse Life Insurance",
                "coverageLevel": "00",
                "electionAmt": 0.0,
                "premiumAmt": 0.0,
                "pending": {
                    "benefitType": "SPOUSELIFE",
                    "benefitName": "Spouse Life Insurance",
                    "optionName": "$15,000",
                    "coverageLevel": "01",
                    "electionAmt": 15000.0,
                    "premiumAmt": 0.6,
                    "eeCostPreTax": 0.0,
                    "eeCostPostTax": 0.28
                },
                "eeCostPreTax": 0.0,
                "eeCostPostTax": 0.0
            },
            {
                "benefitType": "SUPPLIFE",
                "benefitName": "Supplemental Employee Life Insurance",
                "coverageLevel": "00",
                "electionAmt": 0.0,
                "premiumAmt": 0.0,
                "eeCostPreTax": 0.0,
                "eeCostPostTax": 0.0
            }
        ]
    },
    "status": {
        "code": "0",
        "message": "SUCCESS"
    }
}
```

**Supported Features:**

1. [Default Profile Mapping](#Default-Profile-Mapping)
1. [Default Array Processing](#Default-Array-Processing)
1. [Query String Processing](#Query-String-Processing)
1. [Index Formatting](#Index-Formatting)
1. [Nested Array Processing](#Nested-Array-Processing)
1. [Simple Array Processing](#Simple-Array-Processing)
1. [Namespacing Fields](#Namespacing-Fields)
1. [Incremental Index](#Incremental-Index)
1. [Mapping Response Containers To History](#Mapping-Response-Containers-To-History)
1. [Concatenating Index Fields](#Concatenating-Index-Fields)
1. [Manual Fields](#Manual-Fields)

##### Default Profile Mapping

Every property that is *not* a direct descendant of an array (`[]`), regardless of hierarchy depth in the response object, by default, is flattened out and injected into the xDS Profile.  

Additionally, default processing of xDS Profile fields **do not** require a `apiDataSourceMappings` row.  Mapping from 'root properties' to xDS Profile is automatic.

**Note:** Given the sample reponse, the BRD would most likely contain [namespace mapping information](#Namespacing-Fields) for the `employment` and/or `prevEmployment` containers since the contained property names are identical.  With no mapping information supplied, given identical names, the last properties processed (top to bottom) will take precedence and resulting in the Xml below.  

```xml
<xDataDef>
    <Profile>
        <birthDate>1955-02-28</birthDate>
        <nameLast>TEST</nameLast> <!-- Flattened from name -->
        <nameFirst>EMPLOYEE</nameFirst> <!-- Flattened from name -->
        <emplCategory>PART_TIME</emplCategory> <!-- Flattened from employement, overwritten by prevEmployment -->
        <emplStatusCode>A</emplStatusCode> <!-- Flattened from employement, overwritten by prevEmployment -->
        <payRate>54329.6</payRate> <!-- Flattened from employement, overwritten by prevEmployment -->
        <hireDate>1967-10-17</hireDate> <!-- Flattened from employement, overwritten by prevEmployment -->
    </Profile>
</xDataDef>
```

##### Default Array Processing

Array properties (`[]`) by default are not processed unless an `apiDataSourceMappings` is provided.  When an array property is found, regardless of hierarchy depth, mapping information must be provided to indicate how to map back to xDS history data. Specify the name of the `apiTable` (the array property name), the `xdsTable` (destination history type), and `indexField` (which field should be used as the unique history index).

When the history row is being generated, the field specified in `indexField` will automatically be renamed to `index` in the generated history row and the original field **will not be present**.

Just like [Default Profile Mapping](#Default-Profile-Mapping), every property that is *not* a direct descendant of an array (`[]`), regardless of hierarchy depth, by default, is flattened out and injected into the history row.

dataSource|apiTable|xdsTable|indexField|manualFields|fieldMapping
---|---|---|---|---|---
sampleAPI|electedCoverages|coverages|benefitType

**Note:** Given the sample reponse, the BRD would most likely contain namespace mapping information for the `electedCoverages.pending` container.  With no mapping information supplied, given identical names, the last properties processed (top to bottom) will take precedence and resulting in the Xml below.

```xml
<xDataDef>
    <!-- Profile mapping is on by default, but removing for brevity -->
    <HistoryData>
        <HistoryItem hisType="coverage" hisIndex="SPOUSELIFE">
            <index>SPOUSELIFE</index>
            <benefitName>Spouse Life Insurance</benefitName> <!-- Overwritten from pending -->
            <coverageLevel>01</coverageLevel> <!-- Overwritten from pending -->
            <electionAmt>15000.0</electionAmt> <!-- Overwritten from pending -->
            <premiumAmt>0.6</premiumAmt> <!-- Overwritten from pending -->
            <optionName>$15,000</optionName> <!-- Flattened from pending -->
            <eeCostPreTax>0.0</eeCostPreTax> <!-- Flattened from pending, then overwritten from electedCoverages -->
            <eeCostPostTax>0.28</eeCostPostTax> <!-- Flattened from pending, then overwritten from electedCoverages -->
        </HistoryItem>
        <HistoryItem hisType="coverage" hisIndex="SUPPLIFE">
            <index>SUPPLIFE</index>
            <benefitName>Supplemental Employee Life Insurance</benefitName>
            <coverageLevel>00</coverageLevel>
            <electionAmt>0.0</electionAmt>
            <premiumAmt>0.0</premiumAmt>
            <eeCostPreTax>0.0</eeCostPreTax>
            <eeCostPostTax>0.0</eeCostPostTax>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

##### Query String Processing

By default, every API called that has query strings (either hard coded in the BRD or passed during temp queries), will have their values injected into an `apiParams` xDS history row with `index`, `name`, and `value` columns.

Given the API endpoint of `/businessapi-service-tbo/common/history/v1/{legalIdentifier}/transaction?disciplineCode=HW&isForRecentOnlyList=true&planIDList=21`, the following would be generated:

```xml
<xDataDef>
    <HistoryData>
        <HistoryItem hisType="apiParams" hisIndex="1">
            <index>1</index>
            <name>disciplineCode</name>
            <value>HW</value>
        </HistoryItem>
        <HistoryItem hisType="apiParams" hisIndex="2">
            <index>2</index>
            <name>isForRecentOnlyList</name>
            <value>true</value>
        </HistoryItem>
        <HistoryItem hisType="apiParams" hisIndex="3">
            <index>3</index>
            <name>planIDList</name>
            <value>21</value>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

However, since the `apiParams` name is generic, it would be overwritten if multiple APIs use query strings, so the Nexgen site, then changes the history type from `apiParams` to `apiParams{Key}` where `Key` is the `apiDataSource.id` property.

##### Index Formatting

When a field containing a number is used for the index via `indexField` it may be beneficial to format the value before generating the xDS history index.  This is because, by default history rows are sorted ascending on the index, however the index is treated as a `string`, so `11` would come before `2`.  If order of the history rows needs to be retained, a format can be applied to zero pad the index sufficiently so that when sorted as a string it still sorts correctly.  To do this, simply use a `:format` after the field name.

Note: Formatting is also supported while [Concatenating Index Fields](#Concatenating-Index-Fields).  To accomplish this, simply place the `:format` after any desired field segments.

dataSource|apiTable|xdsTable|indexField|manualFields|fieldMapping
---|---|---|---|---|---
sampleAPI|beneficiaries|beneficiary|ssn:000000000

```xml
<xDataDef>
    <!-- Profile mapping is on by default, but removing for brevity -->
    <HistoryData>
        <HistoryItem hisType="beneficiaries" hisIndex="011669594">
            <index>011669594</index> <!-- Zero padded to nine digits -->
            <nameLast>TEST</nameLast> <!-- Flattened from beneficiaryDetails.name -->
            <nameFirst>BENEFICIARY</nameFirst> <!-- Flattened from beneficiaryDetails.name -->
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

##### Nested Array Processing

As mentioned above, array properties (`[]`) are *only* processed if an `apiDataSourceMappings` is provided with a `apiTable` matching the array property name, regardless of hierarchy depth.  Some resopnses nest arrays within arrays.  Even if an `apiDataSourceMappings` row is provided for the parent, the child array will be ignored if no mapping information is present.

When the nested arrays *are* processed, all the mapping rules process in the exact same fashion except for the generation of the `index` field.  Regardless of what is provided in the `indexField` mapping row, a child array will have the index of all its ancenstors prepended to help in illustrating the relationship. 

Additionally, each field that built an 'ancestor index' will be injected into the history row in the format of `xDSTable.fieldName`.

**Note:** When index includes a prefix of ancestor index(es), the field specified in the `indexField` for each child mapping **is not** excluded in the resulting history row as happens during normal index processing.

dataSource|apiTable|xdsTable|indexField|manualFields|fieldMapping
---|---|---|---|---|---
sampleAPI|beneficiaries|beneficiary|ssn:000000000
sampleAPI|addresses|beneficiaryAddress|addressType

```xml
<xDataDef>
    <!-- Profile mapping is on by default, but removing for brevity -->
    <HistoryData>
        <HistoryItem hisType="beneficiaries" hisIndex="011669594">
            <index>011669594</index>
            <nameLast>TEST</nameLast> <!-- Flattened from beneficiaryDetails.name -->
            <nameFirst>BENEFICIARY</nameFirst> <!-- Flattened from beneficiaryDetails.name -->
        </HistoryItem>
        <HistoryItem hisType="beneficiaryAddress" hisIndex="011669594-HOME">
            <index>011669594-HOME</index>
            <addressType>HOME</addressType>
            <address1>123 Normal Way</address1>
            <city>New York</city>
            <postalCode>12121</postalCode>
            <state>NY</state>
            <beneficiaries.ssn>011669594</beneficiaries.ssn>
        </HistoryItem>
        <HistoryItem hisType="beneficiaryAddress" hisIndex="011669594-MAILING">
            <index>011669594-MAILING</index>
            <addressType>MAILING</addressType>
            <address1>999 Conduent Towers</address1>
            <city>Manhattan</city>
            <postalCode>34343</postalCode>
            <state>NY</state>
            <beneficiaries.ssn>011669594</beneficiaries.ssn>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

##### Simple Array Processing

The majority of the API responses that contain arrays have JSON *objects* as the array item:

```json
{
    "arrayProp": [
        { "prop1": "value1", "prop2": "value2" },
        { "prop1": "value1", "prop2": "value2" }
    ]
}
```

However, some response have arrays that only contain simple types:

```json
{
    "paymentDate": [
        "2022-06-30",
        "2022-04-30"
    ]
}
```

When simply arrays need to be mapped back to xDS, the field index needs to be `[array]` indicating that it is just a list of simple values.  

When a simple array is processed, for each value in the array, a history row will be created with an `index` and `value` element where the `index` is simply a incremental ID (similar to the `{id}` [Incremental Index](#Incremental-Index)).  

[Index Formatting](#Index-Formatting) is supported as well via `[array:format]` is supported as well if the `index` should have a format applied during processing.

dataSource|apiTable|xdsTable|indexField|manualFields|fieldMapping
---|---|---|---|---|---
sampleAPI|paymentDate|paymentDate|[array:00]

```xml
<xDataDef>
    <!-- Profile mapping is on by default, but removing for brevity -->
    <HistoryData>
        <HistoryItem hisType="paymentDate" hisIndex="01">
            <index>01</index>
            <value>2022-06-30</value>
        </HistoryItem>
        <HistoryItem hisType="paymentDate" hisIndex="02">
            <index>02</index>
            <value>2022-04-30</value>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

##### Namespacing Fields

Fields within a container can be namespaced with a prefix or a suffix to ensure unique field names.  When specifying a mapping for namespacing, the following rules are applied:

1. To `indexField` column is used to specify a prefix or suffix.  A prefix will end with a `*` and a suffix will begin with a `*`.
1. Namespaced fields with a prefix specified, will *always capitalize* the first letter of the original property name.
1. The `apiTable` indicates full path to the container, with `.` delimited property names.
1. When providing a namespace rule for Profile fields, the `apiTable` starts with `profile` instead of `resopnse`.
1. When namespacing a container, if no other namespace mappings are provided for *nested* containers, they will inherit the parent container namespace mappings.
1. Array properties can *not* indicate namespacing.  They can only be mapped to a xDS history type.
1. When namespacing a container that is part of an array object, the `apiTable` should include the array property name (i.e. `arrayProperty.containerName`).

dataSource|apiTable|xdsTable|indexField|manualFields|fieldMapping
---|---|---|---|---|---
sampleAPI|profile||eeData*
sampleAPI|profile.person.prevEmployment||eeDataPrev*
sampleAPI|electedCoverages|coverages|benefitType
sampleAPI|electedCoverages.pending|coverages|*Pending

```xml
<xDataDef>
    <Profile>
        <eeDataBirthDate>1955-02-28</eeDataBirthDate>
        <eeDatanameLast>TEST</eeDatanameLast>
        <eeDataNameFirst>EMPLOYEE</eeDataNameFirst>
        <eeDataEmplCategory>PART_TIME</eeDataEmplCategory>
        <eeDataEmplStatusCode>A</eeDataEmplStatusCode>
        <eeDataPayRate>54329.6</eeDataPayRate>
        <eeDataHireDate>1977-10-17</eeDataHireDate>
        <eeDataPrevEmplCategory>PART_TIME</eeDataPrevEmplCategory>
        <eeDataPrevEmplStatusCode>A</eeDataPrevEmplStatusCode>
        <eeDataPrevPayRate>54329.6</eeDataPrevPayRate>
        <eeDataPrevHireDate>1967-10-17</eeDataPrevHireDate>
    </Profile>
    <HistoryData>
        <HistoryItem hisType="coverage" hisIndex="SPOUSELIFE">
            <index>SPOUSELIFE</index>
            <benefitName>Spouse Life Insurance</benefitName>
            <coverageLevel>00</coverageLevel>
            <electionAmt>0.0</electionAmt>
            <premiumAmt>0.0</premiumAmt>
            <eeCostPreTax>0.0</eeCostPreTax>
            <eeCostPostTax>0.0</eeCostPostTax>
            <benefitTypePending>SPOUSELIFE</benefitTypePending>
            <benefitNamePending>Spouse Life Insurance</benefitNamePending>
            <optionNamePending>$15,000</optionNamePending>
            <coverageLevelPending>01</coverageLevelPending>
            <electionAmtPending>15000.0</electionAmtPending>
            <premiumAmtPending>0.6</premiumAmtPending>
            <eeCostPreTaxPending>0.0</eeCostPreTaxPending>
            <eeCostPostTaxPending>0.28</eeCostPostTaxPending>
        </HistoryItem>
        <HistoryItem hisType="coverage" hisIndex="SUPPLIFE">
            <index>SUPPLIFE</index>
            <benefitName>Supplemental Employee Life Insurance</benefitName>
            <coverageLevel>00</coverageLevel>
            <electionAmt>0.0</electionAmt>
            <premiumAmt>0.0</premiumAmt>
            <eeCostPreTax>0.0</eeCostPreTax>
            <eeCostPostTax>0.0</eeCostPostTax>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

##### Incremental Index

There are times when suitable fields to create a unique index are not available, or accessing rows by an index is not necessary (i.e. dumping transactional history).  In these scenarios, an `indexField={id}` can be used.

When using `{id}`, by default there is no format applied to the number, however [Index Formatting](#Index-Formatting) is encouraged to ensure proper sorting.  To support _Index Formatting_, `{id:format}` is supported.

dataSource|apiTable|xdsTable|indexField|manualFields|fieldMapping
---|---|---|---|---|---
sampleAPI|electedCoverages|coverages|{id:000}

```xml
<xDataDef>
    <!-- Profile mapping is on by default, but removing for brevity -->
    <HistoryData>
        <HistoryItem hisType="coverage" hisIndex="001">
            <index>001</index>
            <benefitName>Spouse Life Insurance</benefitName> <!-- Overwritten from pending -->
            <coverageLevel>01</coverageLevel> <!-- Overwritten from pending -->
            <electionAmt>15000.0</electionAmt> <!-- Overwritten from pending -->
            <premiumAmt>0.6</premiumAmt> <!-- Overwritten from pending -->
            <benefitType>SPOUSELIFE</benefitType> <!-- Flattened from pending -->
            <optionName>$15,000</optionName> <!-- Flattened from pending -->
            <eeCostPreTax>0.0</eeCostPreTax> <!-- Flattened from pending, then overwritten from electedCoverages -->
            <eeCostPostTax>0.28</eeCostPostTax> <!-- Flattened from pending, then overwritten from electedCoverages -->
        </HistoryItem>
        <HistoryItem hisType="coverage" hisIndex="2">
            <index>2</index>
            <benefitName>Supplemental Employee Life Insurance</benefitName>
            <coverageLevel>00</coverageLevel>
            <electionAmt>0.0</electionAmt>
            <premiumAmt>0.0</premiumAmt>
            <eeCostPreTax>0.0</eeCostPreTax>
            <eeCostPostTax>0.0</eeCostPostTax>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

##### Mapping Response Containers To History

A 'container' in the API response is any property with a value of a JSON object. Below, `response`, `response.name`, and `response.dependents.name` are all containers.

```json
{
    "response": {
        "id": "123",
        "name": {
            "first": "TEST",
            "last": "SAMPLE"
        },
        "dependents": [
            {
                "id": "321",
                "name": {
                    "first": "BENEFICIARY",
                    "last": "SAMPLE"
                }
            }
        ]
    }
}
```

As described in the [Default Profile Mapping](#Default-Profile-Mapping) and [Default Array Processing](#Default-Array-Processing) sections, all fields regardless of hierarchy depth are flattened out to the 'root' (whether that is the profile or a history row).  There are times when it would be more beneficial to map an API's containers to a history table instead.

###### Mapping Response Root To History

To map 'root' response containers to history rows, the following mapping could be provided (remember the full path into JSON object is required).

dataSource|apiTable|xdsTable|indexField|manualFields|fieldMapping
---|---|---|---|---|---
sampleAPI|profile|demographic|{id}
sampleAPI|profile.person.employment|employment|{id}

```xml
<xDataDef>
    <HistoryData>
        <HistoryItem hisType="demographic" hisIndex="1">
            <index>1</index>
            <birthDate>1955-02-28</birthDate>
            <nameLast>TEST</nameLast> <!-- Flattened from name -->
            <nameFirst>EMPLOYEE</nameFirst> <!-- Flattened from name -->
            <emplCategory>PART_TIME</emplCategory> <!-- Flattened from prevEmployment -->
            <emplStatusCode>A</emplStatusCode> <!-- Flattened from prevEmployment -->
            <payRate>54329.6</payRate> <!-- Flattened from prevEmployment -->
            <hireDate>1967-10-17</hireDate> <!-- Flattened from prevEmployment -->
        </HistoryItem>
        <HistoryItem hisType="employment" hisIndex="1">
            <index>1</index>
            <emplCategory>PART_TIME</emplCategory>
            <emplStatusCode>A</emplStatusCode>
            <payRate>54329.6</payRate>
            <hireDate>1977-10-17</hireDate>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

###### Mapping History Container To New History Type

Mapping array properties (`[]`) to history tables is straight forward.  Instead of allowing the default flattening or namespacing a container, a container that is part of a history row can map to a different history table as well.

dataSource|apiTable|xdsTable|indexField|manualFields|fieldMapping
---|---|---|---|---|---
sampleAPI|electedCoverages|coverages|benefitType
sampleAPI|electedCoverages.pending|pendingCoverages|{id}

```xml
<xDataDef>
    <HistoryData>
        <HistoryItem hisType="coverages" hisIndex="SPOUSELIFE">
            <index>SPOUSELIFE</index>
            <benefitName>Spouse Life Insurance</benefitName>
            <coverageLevel>00</coverageLevel>
            <electionAmt>0.0</electionAmt>
            <premiumAmt>0.0</premiumAmt>
            <eeCostPreTax>0.0</eeCostPreTax>
            <eeCostPostTax>0.0</eeCostPostTax>
        </HistoryItem>
        <HistoryItem hisType="coverages" hisIndex="SUPPLIFE">
            <index>SUPPLIFE</index>
            <benefitName>Supplemental Employee Life Insurance</benefitName>
            <coverageLevel>00</coverageLevel>
            <electionAmt>0.0</electionAmt>
            <premiumAmt>0.0</premiumAmt>
            <eeCostPreTax>0.0</eeCostPreTax>
            <eeCostPostTax>0.0</eeCostPostTax>
        </HistoryItem>
        <HistoryItem hisType="pendingCoverages" hisIndex="SPOUSELIFE-1">
            <index>SPOUSELIFE-1</index>
            <benefitType></benefitType>SPOUSELIFE</benefitType>
            <benefitName>Spouse Life Insurance</benefitName>
            <optionName>$15,000</optionName>
            <coverageLevel>01</coverageLevel>
            <electionAmt>15000.0</electionAmt>
            <premiumAmt>0.6</premiumAmt>
            <eeCostPreTax>0.0</eeCostPreTax>
            <eeCostPostTax>0.28</eeCostPostTax>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

##### Concatenating Index Fields

There are times when an array row from an API response can not be uniquely identified simply using one field.  To generate a unique index, a mapping can specify that multiple fields should be used in conjunction to form the index.  To use this feature, provide a period delimitted list of field names that should be concatenated together using a `-` as the seperator.

**Note:** When multiple fields form an index, their raw properties **are not** excluded in the resulting history row as happens when only one field is provided.


dataSource|apiTable|xdsTable|indexField|manualFields|fieldMapping
---|---|---|---|---|---
sampleAPI|designations|beneficiaryDesignation|benefitType.planID

```xml
<xDataDef>
    <!-- Profile mapping is on by default, but removing for brevity -->
    <HistoryData>
        <HistoryItem hisType="beneficiaryDesignation" hisIndex="BASICLIFE-21">
            <index>BASICLIFE-21</index>
            <planID>21</planID>
            <benefitType>BASICLIFE</benefitType>
            <designatedPercent>100.0</designatedPercent>
        </HistoryItem>
        <HistoryItem hisType="beneficiaryDesignation" hisIndex="BASICLIFE-22">
            <index>BASICLIFE-21</index>
            <planID>21</planID>
            <benefitType>BASICLIFE</benefitType>
            <designatedPercent>100.0</designatedPercent>
        </HistoryItem>
        <HistoryItem hisType="beneficiaryDesignation" hisIndex="SUPPLIFE-21">
            <index>SUPPLIFE-21</index>
            <planID>21</planID>
            <benefitType>BASICLIFE</benefitType>
            <designatedPercent>100.0</designatedPercent>
        </HistoryItem>
        <HistoryItem hisType="beneficiaryDesignation" hisIndex="SUPPLIFE-22">
            <index>SUPPLIFE-21</index>
            <planID>21</planID>
            <benefitType>BASICLIFE</benefitType>
            <designatedPercent>100.0</designatedPercent>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

##### Manual Fields

There are times when two API calls may map to the same xDS history table.  This is usually accomplished by different query string values (either hard coded in different `apiDataSource.endpoint` rows or passed in during a temporary query via a programmatic query string).

If the responses from both APIs do not have a guaranteed way to make a unique index and `mergeMode=Merge`, the `manualFields` property can be provided to inject custom values into each resopnse object before being processed by the normal processing workflow so that the values can be used during the generation of an index.

The `manualFields` property is simply a comma delimitted list of `key=value` pairs.  Additionally, the `value` part of this assignment can use the `{id}` feature to generating an incrementing counting an injected field.

dataSource|apiTable|xdsTable|indexField|manualFields|fieldMapping
---|---|---|---|---|---
sampleAPI|profile|dbCalcDetailsInfo|category.scenario|category=CURRENT,scenario={id:000}

```xml
<xDataDef>
    <HistoryData>
        <HistoryItem hisType="dbCalcDetailsInfo" hisIndex="CURRENT-001">
            <index>CURRENT-001</index>
            <category>CURRENT</category> <!-- injected by manualFields -->
            <scenario>001</scenario> <!-- injected by manualFields -->
            <birthDate>1955-02-28</birthDate>
            <nameLast>TEST</nameLast> <!-- Flattened from name -->
            <nameFirst>EMPLOYEE</nameFirst> <!-- Flattened from name -->
            <emplCategory>PART_TIME</emplCategory> <!-- Flattened from employement, overwritten by prevEmployment -->
            <emplStatusCode>A</emplStatusCode> <!-- Flattened from employement, overwritten by prevEmployment -->
            <payRate>54329.6</payRate> <!-- Flattened from employement, overwritten by prevEmployment -->
            <hireDate>1967-10-17</hireDate> <!-- Flattened from employement, overwritten by prevEmployment -->
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

##### Field Mapping

If you need to change a field name before xDS mapping process has begun, you can use the `fieldMapping` property.  Originally this was required to convert BA7 api results to match 'equivalent' Nexgen api results.

dataSource|apiTable|xdsTable|indexField|manualFields|fieldMapping
---|---|---|---|---|---
sampleAPI|profile||||{ "first": "nameFirst", "last": "nameLast" }

Given a response of (for brevity, only the relevant part is shown):

```json
{
    "response": {
        "id": "123",
		"first": "TEST",
		"last": "SAMPLE"
    }
}
```

Mapping result would be:

```xml
<xDataDef>
	<Profile>
		<id>123</id>
		<nameFirst>TEST</nameFirst>
		<nameLast>SAMPLE</nameLast>
	</Profile>
</xDataDef>
```

##### Multiple Destinations

There are times when a single API response container needs to map to multiple xDS history tables. For example, a `profile.person.employment` container might contain fields that should be split across separate history types like `employmentCategory`, `employmentStatus`, and `employmentPay`.

The "multiple destinations" feature allows this by using a `+` prefix notation on the `apiTable` column. The same source container can be mapped multiple times by prefixing subsequent mappings with increasing numbers of `+` characters:

1. First mapping: `profile.person.employment` (no prefix) - processed first
2. Second mapping: `+profile.person.employment` (one `+`) - processed second
3. Third mapping: `++profile.person.employment` (two `+`) - processed third

The `+` prefixes are stripped during processing, allowing the same API container to be reused for each mapping.  Essentially the workflow is:

1. Process all mappings without `+` prefixes first.
2. Then process mappings with one `+` prefix.
3. Then process mappings with two `+` prefixes.
4. And so on...so if you needed to group some mappings together, if mapping a parent history and child container to new history rows), you would use the same number of `+` prefixes.  See [Mapping History Container To New History Type](#mapping-history-container-to-new-history-type) for an example of this.

dataSource|apiTable|xdsTable|indexField|filterExpression
---|---|---|---|---
comEmployeeData|profile.person.employment|employmentCategory|{id}|^emplCategory
comEmployeeData|+profile.person.employment|employmentStatus|{id}|^emplStatus
comEmployeeData|++profile.person.employment|employmentPay|{id}|^pay

Given an API response containing employment data with category, status, and pay fields, the mapping would produce three separate history types:

```xml
<xDataDef>
    <HistoryData>
        <HistoryItem hisType="employmentCategory" hisIndex="1">
            <index>1</index>
            <emplCategoryCode>F</emplCategoryCode>
            <emplCategory>FULL_TIME</emplCategory>
        </HistoryItem>
        <HistoryItem hisType="employmentStatus" hisIndex="1">
            <index>1</index>
            <emplStatusCode>A</emplStatusCode>
            <emplStatus>ACTIVE</emplStatus>
            <emplStatusDate>2010-01-19</emplStatusDate>
        </HistoryItem>
        <HistoryItem hisType="employmentPay" hisIndex="1">
            <index>1</index>
            <payFreq>BIWEEKLY</payFreq>
            <payRate>0.0</payRate>
            <payCode>A</payCode>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

**Note**: When using multiple destinations, you will typically want to combine this feature with `filterExpression` to control which fields from the source container go to each destination history type.

##### Field Filter Expressions

The `filterExpression` column allows filtering which fields from the API response are included in the xDS mapping. Only fields whose names match the regular expression pattern will be mapped.

This is particularly useful when:

1. Splitting a single API container across multiple xDS history types (see [Multiple Destinations](#Multiple-Destinations))
2. Excluding unwanted fields from the mapping
3. Selecting specific fields without explicitly listing each one

dataSource|apiTable|xdsTable|indexField|filterExpression
---|---|---|---|---
comAddresses|response.addresses|addresses|addressType|^(address1\|city\|state\|postalCode)$

**Common Filter Expression Patterns**

Expression | Description
---|---
`^(name-first\|name-last)$` | Only include `name-first` and `name-last` fields.
`^(city\|address-.+\|.+-code)$` | Only include `city`, fields that starts with `address-` and fields that ends with `-code`.
`^(?!id$\|address3$\|ignore-fld$).*$` | All fields except the `id`, `address3` and `ignore-fld` fields.
`^(?!hw-\|db-).*$` | All fields except fields that start with `hw-` or `db-`.

Given an API response with many address fields:

```json
{
    "response": {
        "addresses": [
            {
                "addressType": "HOME",
                "address1": "123 Main St",
                "address2": "",
                "city": "New York",
                "state": "NY",
                "postalCode": "10001",
                "country": "US",
                "isPrimary": true,
                "lastUpdated": "2024-01-15"
            }
        ]
    }
}
```

With `filterExpression` of `^(address1|city|state|postalCode)$`, the mapping would only include:

```xml
<xDataDef>
    <HistoryData>
        <HistoryItem hisType="addresses" hisIndex="HOME">
            <index>HOME</index>
            <address1>123 Main St</address1>
            <city>New York</city>
            <state>NY</state>
            <postalCode>10001</postalCode>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

### appSettings Table

This is the primary table used to assign 'client settings' to use while the web site is running.  Each setting can be controlled based on the environment the site is running in.

Column | Description
---|---
id|The name of the application setting.
DEFAULT|The default value to use for the application setting.
LOCAL.DEV|(Optional) Override the `DEFAULT` value when site is running in a local devlopment debugger environment.
EW.QA|(Optional) Override the `DEFAULT` value when site is running in the EW.QA environment.
EW.PROD|(Optional) Override the `DEFAULT` value when site is running in the EW.PROD environment.
NG.QA|(Optional) Override the `DEFAULT` value when site is running in the NG.QA environment.
NG.UAT|(Optional) Override the `DEFAULT` value when site is running in the NG.UAT environment.
NG.PROD|(Optional) Override the `DEFAULT` value when site is running in the NG.PROD environment.

### appAttributeMapping Table

This table controls how secure HTTP Headers passed to the site are processed.  These HTTP Headers are only pass during a 'single sign in' process when a user is re-directed to the Nexgen site after logging into a portal login.  Use this table to indicate how the values are stored in the xDS data model.

Column|Description
---|---
attr|The name of the secure HTTP Header.
profile|When the header is present, `profile` describes the xDS field name the value should be stored under.
persist|Whether or not to persist the value to the xDS data store; set the value to `1` to persist.  By convention, almost all data in the Nexgen site and xDS model are generated via API calls (see the [API DataSource Mappings](#API-DataSource-Mappings) for more information) and no data is persisted in xDS data stores other than identifying info.  However, to aid in the development process, and remove the requirement for always logging into the portal login, `persist=1` can be provided to save the minimum information needed to facilitate *KAT impersonation* log ins.

### userEligibility Table

All user eligiblity logic in the `RBLUser` tab is controlled by the `userEligibity` table.  Each result table returned from this tab that has eligibility requirements will have a `eligibilityAll` and `eligibilityPlusAny` column availble to provide a comma delimitted list of eligibilites to evaluate.  Each eligibility specified in these columns will have a _truthy_ `value` if the current user has eligibility/access to the current resource.

The `userEligibility` table in the 'global' BRD can have default value, while the client BRDs can provide override and additional eligibilities during 'Client Override Calculation' that will ultimately end up in the `<userEligibility>` table during global and client BRD calculations.  See [BRD Calculation Flow](#BRD-Calculation-Flow) for information on how eligibilites are specified between the combination of 'global' and 'user' BRDs.

### manualResults Table

This table is a 'control' table that describes where any table from the calculation result should be injected.  There are two places where a table can be injected: xDS Data or KatApp Manual Results.  KatApp Manual Results are essentially a 'pre calc result' that is passed to the KatAp instead of having the KatApp run a calculation to generate results.  A Manual Result can be the only result a KatApp processes, or it can be a seperate result if a KatApp has associated CalcEngine(s).  The Manaul Result(s) generated in the Nexgen site will always have the `rbl-ce` key of `BRD`.

Column|Description
---|---
table|The name of the table to process.
profile-history|Return a `1` if the table should be injected into the xDS data model as a history row (for use in other CalcEngines).  The history row injected with have an index using the first available value of `id` column, `index` column, or incrementing counter and every column returned in the result row will be directly mapped to the xDS history row.  Note that the `userCalculatedData` table is **always** process regardless of any value found in this table.
katapp|Return a `1` if the table should be injected into the *main/content* KatApp's `manualResult` property when each page is rendered.
katapp-footer|Return a `1` if the table should be injected into the *footer* KatApp's `manualResult` property when each page is rendered.
katapp-sidebar|Return a `1` if the table should be injected into the *profile sidebar* KatApp's `manualResult` property when each page is rendered.

See [Building ManualResult Caches](#Building-ManualResult-Caches) for more information on how the `manualResult` properties are built.

### userCalculatedData Table

The `userCalculatedData` table is used to generate 'data instructions' for data to inject into the xDS Data Model.  It is similar to a table processed via a `profile-history=1` in the `manualResults` control table.  For history tables, it is a bit different because each row in the `userCalculatedData` table represents a *single field*, so it could take several rows in the `userCalculatedData` table to generate a single row in xDS history.  To generate history rows, it is easier for the CalcEngine developer to use the `profile-history` feature since each row in the CalcEngine result maps to a single xDS history row.

However, to inject xDS *profile fields*, the `userCalculatedData` table must be used (simply leave the `type` column blank).

Column|Description
---|---
field|The name of the field being generated.
value|The value to inject into the field.
type|If the field is part of a xDS history row, provide the history table name here.
index|If the field is part of a xDS history row, provide the history index value here.

Below is an example of how to inject some values into xDS profile and history.

field|value|type|index
---|---|---|---
nameFirst|John
nameLast|Doe
pay|40000|payHistory|2022
status|Active|payHistory|2022

The table above would create an xDS data fragment as follows:

```xml
<xDataDef>
    <Profile>
        <nameFirst>John</nameFirst>
        <nameLast>Doe</nameLast>
    </Profile>
    <HistoryData>
        <HistoryItem hisType="payHistory" hisIndex="2022">
            <index>2022</index>
            <pay>40000</pay>
            <status>Active</status>
        </HistoryItem>
    </HistoryData>
</xDataDef>
```

## Global and Client BRD Merging Flow

As described in the [Benefit Requirements Document](#Benefit-Requirements-Document) section, the BRD CalcEngine manages much of the configuration that drives the Nexgen site.  There is a concept of a 'global' BRD which contains settings that can be applied to all Nexgen clients (or provide the best suggested default values).  There is also the concept of a 'client' BRD which provides client specific settings/eligibilities along with the ability to override global BRD settings if needed.  Both the 'calculation' and the 'merge' workflows are important to understand to make sure you are able to fully utilize these CalcEngines.

### BRD Calculation Flow Types

There are two workflows to understand about BRD Calculations: 'Site settings' and 'User settings'.  The details of each BRD calculation type are below.

**Site Settings**

1. Returns settings that are site specific vs user specific (i.e. site key, page parameters, emergency site wide banners, IDs for external APIs etc.)
1. Calculated when the web site starts, cached settings expire, or when BRDs are updated.
1. Input Data
	1. All cookies that start with `IAM_` are passed with input name being the same as the cookie name.
	1. All web site headers that start with `HTTP_NG_ATTR_`, `SM_` or `IAM_` are passed with input name being the same as the header names (if matches name of cookies that start with `IAM_`, the header will be used instead of the cookie).
	1. All page parameters are passed with input name being the the format of `PageParameter.<parameterName>`.
1. Processes the `RBLEligibility` tab during the 'override' calculation.
1. Processes `RBLSite` tab.  **No formulas in this tab can refer to participant or authenticated user data.**

**User Settings**

1. Returns settings that are user specific vs client specific (i.e. views, messaging banners, sharkfin inputs, channel page layout info, resource links for users, etc.)
1. Calculated when a user logs in or when BRDs are updated while a user is logged in.
1. Input Data
	1. All cookies that start with `IAM_` are passed with input name being the same as the cookie name.
	1. All web site headers that start with `HTTP_NG_ATTR_`, `SM_` or `IAM_` are passed with input name being the same as the header names (if matches name of cookies that start with `IAM_`, the header will be used instead of the cookie).
	1. All page parameters are passed with input name being the the format of `PageParameter.<parameterName>`.
1. Processes the `RBLEligibility` tab during the 'override' calculation.
1. Processes `RBLSite` and `RBLUser` tabs.  **Only the `RBLUser` tab can have formulas that refer to user data.**
1. If the resulting `RBLSite` (Site Settings) has a new CalcEngine version than what is cached (i.e. this is the first calculation since a newly uploaded/approved global or client BRD), the new Site Settings will replace the cached settings.

### BRD Calculation Flow

To understand the calculation flow of the global and client BRDs, please review the purpose of the [userEligibility Table](#userEligibility-Table) and how it controls user access to resources returned by the BRD calculations.  Below is the flow that occurs when BRD calculations occur (calculation order, submission data preparation, result merging, etc.).

1. Prepare 'submit data' to pass to calculations.
    1. If user is *not* logged in, simply an empty xDS model.
    1. If user *is* logged in, use current xDS model (this will have all API response data merged into it that were not dependent on the actual BRD calculation via the `requires` column in the `apiDataSource` table).
1. Run the 'Client Override' calculation.
    1. Uses the client BRD and only processes the `RBLEligibility` tab which is expected to return a `userEligibility` table.
    1. Update original 'submit data' to be used in global BRD calculation.
        1. Every table returned from `RBLEligibility` tab is converted into an xDS History table and can be accessed on input tabs via the `<tableName>` syntax.
        1. `index` of each row is created with first matching element: `id`, `index`, simple auto counter.
        1. Every column returned in each table will be availble.
        1. Matching rows (by history type and `index`) will be completely replaced (no merging is supported).
1. Run the global BRD calculation.
    1. Processes the `RBLSite` tab and optionally, the `RBLUser` tab if a user is logging in.
    1. Update original 'submit data' to be used in client BRD calculation by merging global results, then **again, re-merging** the 'Client Override' results.
        1. Global Calculation Results: Every table returned from `RBLUser` tab is converted into an xDS History table in manner described above (replacing matching keys).
        1. Client Override Results: Every table returned from `RBLEligibility` tab in the 'Client Override' calculation re-merged (last) taking precedence over any matching rows from original history or Global Calculation results.
1. Run the 'Client BRD' calculation.
    1. Processes the `RBLSite` tab and optionally, the `RBLUser` tab if a user is logging in.
1. [Merge](#BRD-Results-Merge-Flow) Global and and Client calculation results into a single source of 'settings'.
1. Build [AppSettings object](#AppSettings-Object) used in site.
1. Build [UserSettings object](#UserSettings-Object) used in site for current user (if user is logging in).
1. Build [ManualResult caches](#ManualResult-Caches) used to pass to KatApps.

### BRD Results Merge Flow

For the most part, when merging Global and Client BRD results, Client results override Global results.  But there are slight differences on the 'level' of merging provided based on tables.  The following describes the rules and priorities followed.

1. All table rows, when 'merged', will actually replace a 'matching' row (the rule for matching is described in the next step) if found or be appended if no match is found with the following exceptions:
    1. The `views` and `manualResults` tables will merge 'field by field' if a matching row is found.
    1. If provided, the `configBenefitCategories`, `configBenefitInfo`, `documentCategories`, and `documentTopics` tables from the client BRD will *completely* replace the matching *table* in the global results.
1. The following merge rules are applied top to bottom against all tables, exluding the 'complete replace' tables, and if some client result table rows would satisfy multilpe rules, only the first rule processed will be applied.
    1. Process `views` where a match is defined as having the same `id` value.
    1. Process `manualResults` where a match is defined as having the same `table` value.
    1. Process `appAttributeMapping` where a match is defined as having the same `attr` value.
    1. Process `apiDataSourceMapping` where a match is defined as having the same `dataSource` value.
    1. Process `userCalculatedData` where a match is defined as having the same value when concatenating `type`.`index`.`field`.
    1. Process any tables that have a `topic` field where a match is defined as having the same `topic` value.
    1. Process any tables that have a `selector` field where a match is defined as having the same `selector` value.
    1. Process any tables that have a `id` field where a match is defined as having the same `id` value.
1. For every table returned in the client results that is a 'complete replace' table:
    1. Delete all rows present in the global results.
    1. Append all rows returned from the client results.
1. Remove all rows that have `on_brd=0`.  Can not use standard RBL `on=0` since RBL would remove the row before the Nexgen site would have opportunity to merge rows (i.e. if client wanted to turn off a row that is turned on by default in the global BRD).

### Building the AppSettings Object

The AppSettings object contains settings that are specific to the 'client' vs 'user' and is built from the tables present in the `RBLSite` tabs of the global and client BRDs (the final merged result).  The calculation result rows are turned into JSON objects when placed into the `AppSettings` object.  The following rules are processed when building the AppSettings.

1. All rows from `appAttributeMapping`, `apiDataSource`, and `apiDataSourceMapping` added.
1. Process the [appSettings Table](#appSettings-Table) based on the sites current environment.
    1. All properties that do not start with `pageParameter-` or `globalInput-` are added as a property at the root of AppSettings.
    1. If any properties that start with `pageParameter-` exist
        1. Create a `pageParameters` array property inside the AppSettings.
        1. Add each property into this array after removing the `pageParameter-` prefix.
    1. If any properties that start with `globalInput-` exist
        1. Create a `globalInputs` array property inside the AppSettings.
        1. Add each property into this array after removing the `globalInput-` prefix.

### Building the UserSettings Object

The UserSettings object contains settings that are specific to the 'user' vs 'client' and is built from the tables present in the `RBLUser` tabs of the global and client BRDs (the final merged result).  The calculation result rows are turned into JSON objects when placed into the `UserSettings` object.  The following rules are processed when building the UserSettings.

1. The `contentBanners` table is processed and each row is added inside a `banners` array property containing the `id`, `viewIds`, `disableSite`, `type`, `title`, `subTitle`, `text`, `style`, `backgroundImage`, `buttonStyle`, `buttonClass`, `buttonText`, `buttonTarget` columns.
1. The `views` table is processed in the following manner:
    1. The `id`, `text`, `icon`, and `order` are directly transfered.
    1. The `kaml` column is mapped to a `view` property.
    1. The `hidden` column is mapped to a `onMenu` property.
    1. A `menuItems` array property is created containing any `views` rows with a `parent` column referencing the current row's `id` column (and the entire process for `views` rows is repeated for each item related).
    1. A `level` property (1..N) is generated to describe the level the menu is according to how many parents it has.
    1. If the `defaultInputs` item is not blank, it contains a | delimitted list of `name=value` pairs.  A `{ "katApp": { "manualInputs": [] } }` array property is created containing a property each name-value pair.

### Building ManualResult Caches

KatApps have the ability to receive a `manualResults` property during the time of initialization which contains a JSON object in the same structure as a normal calculation result.  This allows for the notion of a 'pre calc' to be done at desired (minimal) intervals where the result is cached and then passed into the KatApp when it renders.  

The same result could be acheived by configuring the KatApp to have multiple CalcEngines.  The first CalcEngine being the primary and the second CalcEngine providing the 'pre calc' results.  However, this has a major performance disadvantage, because every time a KatApp 'calculation' is triggered, it would submit a calculation job to both CalcEngines.  Therefore, the use of a `manualResults` property for results that change infrequently and are only based on user data is a perfect way to avoid running multiple calculations in KatApps and simply pass the cached `manualResults` when a KatApp is rendered.

Every time a page renders in the Nexgen site, there are three KatApps that are running identified by keys that are part of the [manualResults Table](#manualResults-Table).

Key|Description
---|---
katapp|The main KatApp that drives the site.  This KatApp is rendered in the 'content' portion of the page.
katapp-footer|This KatApp drives the site map content for the site.  This KatApp is renered at the bottom of every page and *only* uses `manualResults` (there is not a CalcEngine configured for this KatApp)
katapp-sidebar|This KatApp serves as a 'dashboard' for the current users account.  The KatApp is rendered in a [Bootstrap offcanvas](#https://getbootstrap.com/docs/5.0/components/offcanvas/) object that is displayed when the user clicks on their profile picture in the page header.

Using the rows from the [manualResults Table](#manualResults-Table), every row of the designated tables are simply converted into JSON format and stored in a cache to be passed to the appropriate KatApp during page rendering.  When these results are passed to the KatApp they can be accessed with a `rbl-ce` of `BRD` in the KatApp markup.

# Managing xDS Data Model

As discussed in the [API DataSource Mappings](#API-DataSource-Mappings) section, API results eventually get mapped into xDS format.  This occurs after login and the 'xDS Model' is cached until (and not rebuilt) until a subsequent API `GET` response is requested.  Understanding the merge flow from multiple API response, how to have temporary query response, and how to refresh API response caches on demand are important concepts to understand to ensure the xDS Model is in the expected state at all times.

## Data Cache Merge Flow

After all specified APIs are called, they are merged together to create the xDS data model.  The following flow is followed when merging API results (mostly governed by [mergeMode](#apiDataSource-Layout)).

1. API results are 'generally' processed on a *First in, First Out* (FIFO) pattern.  Re-running an API and refreshing the results **does not** change this order.  The API run order is based on the order of the API rows are specified in the BRD, taking into consideration the `requires` column. See [notes](#apiDataSource-Layout-Notes) to understand how `requires` changes the flow of processing.
1. All API results with a `mergeMode` of `Replace` are processed first based on the FIFO ordering.  When all `Replace` results are complete, `Merge` results are processed.
1. Merge _xDS Profile Fields_.  They do not have the concept of 'merge' vs 'replace' and are *always* replaced with the last API result processed.
1. For `Replace` mergeMode, all historical tables requested from the API (identified via the apiDataSourceMappings) will have all rows removed.
1. For `Merge` mergeMode, remove all historical data rows that match the type and index of rows returned in API results.
1. Add all history rows returned from API results. 
1. Sort the final _xDS Model_ history data by `hisType`, then `order` field (if present), and finally `hisIndex`.

## Temp Query Processing

When API results are turned into xDS Format, all the rules from the [apiDataSourceMappings table](#apiDataSourceMappings-Layout) are followed.  However, if a query string parameter is provided while using [cacheRefreshKeys](#refreshing-api-data-on-demand--cacherefreshkeys) or during [command processing calculations](#Command-Processing), the results are treated as 'temporary query' results.  The same mapping rules will be used, however, since a query string parameter was provided, it indicates that that KatApp is 'querying' a *subset* of the data and is only valid during the life cycle of that KatApp.  To accomplish this, all the mappings are massaged slightly, and thus references to 'xDS Data' in CalcEngine input tabs need to make the same changes.

All history table mappings are renamed by appending `Query` as a suffix.  So if a mapping specified that historical data should be placed in an `addresses` table, the temporary query will put results in an `addressesQuery` historical table.  

Similarily, all fields that would end up in the `Profile` element, will have a `Query` suffix as well.  If a field of `nameLast` is returned by the API, the field will now be named `nameLastQuery`.  When a [field namespacing](#Namespacing-Fields) is used, a prefix will be changed to append `Query` to the *prefix* so that a prefix of `employmentData*` and a field of `hireDate` normally would be `employmentDataHireDate`, but would now become `employmentDataQueryHireDate`.  If a suffix is provided, `Query` will be appended to the *suffix* (i.e. a suffix of `*Pension` would become `*PensionQuery`).  Note that *prefix* and *suffix* patterns provided for historical data containers will **not** have their patterns changed since the table name is already `*Query` (temporary and unique).

### Temp Query Lifespan

Temp queries only last during the life cycle of a single KatApp.  Once a navigation occurs and a new KatApp is created, all temp query data is deleted.

### Temp Query MergeMode

When temp queries are processed, the `mergeMode` is set to `Replace` by default regardless of what might be set in [apiDataSource table](#apiDataSource-Layout).  So, if a temp query is run multiple times, every time API results are processed into xDS data, the previous results will be removed before adding the current results.

Temp queries can be instructed to Merge instead of Replace processing.  To force a Merge during [command processing calculations](#command-Layout), add in a `.MERGE` segment when using the `.KEY` syntax to specify a command.  If `.MERGE` segment is present, it'll instruct temp query results to merge with existing results.  Normally, a normal `ID.KEY` command would be issues as well, so that previous data is cleared, and a second `ID.MERGE.KEY` command would be issued in conjunction to merge results with the `ID.KEY` results (i.e. estimate saved details when multiple scenarios are present).

Similarly, when [refreshing API data On demand](#refreshing-api-data-on-demand--cacherefreshkeys), a `.MERGE` flag following the key can be used to indicate that results should be merged. 

```javascript
// Both apis map to same xDS history tables, so instruct the dbSavedCalc2Details to MERGE with
// the results returned from the dbSavedCalcDetails call.
application.configure(config => {
	config.updateApiOptions = submitApiOptions => {
		submitApiOptions.configuration.cacheRefreshKeys = [ 
			"dbSavedCalcDetails?calcID=123",
			"dbSavedCalc2Details.MERGE?calcID=321"
		];
	};
});
```

## Refreshing API Data On Demand / cacheRefreshKeys

There are situations where KatApps want to refresh API data on demand before running a calculation.  This is accomplished by using the `cacheRefreshKeys` feature.  Before any client side calculation is ran, you can set this property and the specified API will be called and the current user's data model will be refreshed.  This is done using the [`updateApiOptions`](#https://github.com/terryaney/nexgen-documentation/blob/main/KatApp.Vue.md#ikatappupdateapioptions) event handler and setting the `submitApiOptions.configuration.cacheRefreshKeys` to an array of [apiDataSource IDs](#apiDataSource-Layout) to refresh before the next calculation is processed.

### Refreshing API Data Before Client Side Calculations

Below are several different examples/scenarios that are possible to use to refresh API data before a client side calculation.

```javascript
// Refresh hwBeneficiaries before *every* calculation
application.configure(config => {
	config.updateApiOptions = submitApiOptions => {
		submitApiOptions.configuration.cacheRefreshKeys = [ "hwBeneficiaries" ];
	};
});

// Refresh hwBeneficiaries before *every* calculation but treat results as a temporary query by appending an 'unused' querystring value
application.configure(config => {
	config.updateApiOptions = submitApiOptions => {
		submitApiOptions.configuration.cacheRefreshKeys = [ "hwBeneficiaries?isTemp=true" ];
	};
});

// Refresh hwBeneficiaries before *every* calculation and if current template rendering is 
// 'hw-open-existing-event' also refresh the hwLifeEvents API.
application.configure((config, rbl, model, inputs) => {
	config.updateApiOptions = submitApiOptions => {
		var refreshKeys = [ "hwBeneficiaries" ];

		switch (inputs.iTemplate) {
			case "hw-open-existing-event": {
				refreshKeys.push("hwLifeEvents");
				break;
			};
		}
		
		submitApiOptions.configuration.cacheRefreshKeys = refreshKeys;
	};
});

// Refresh hwBeneficiaries before *every* calculation
// If current template rendering is 'hw-open-existing-event' refresh the hwLifeEvents API
// If current template rendering is 'hw-benefit-select-type-hsa' refresh the hwHsaEligiblity API using the buildApiGET helper
application.configure((config, rbl, model, inputs) => {
	config.updateApiOptions = submitApiOptions => {
		var refreshKeys = [ "hwBeneficiaries" ];

		switch (inputs.iTemplate) {
			case "hw-open-existing-event": {
				refreshKeys.push("hwLifeEvents");
				break;
			};
			case "hw-benefit-select-type-hsa": {
				// buildApiGET takes a JSON object and turns it into a query string, so below would result in
				// hwHsaEligibility?benefitType=HSA&eventDate=2022-01-01&eventID=01&eventType=32.  buildApiGET
				// is simply a helper to avoid string concatenation coding in javascript.
				var qd = {
					benefitType: inputs.iBenefitType, // HSA
					eventDate: inputs.iEventDate, // 2022-01-01
					eventID: inputs.iEventId, // 01
					eventType: inputs.iEventType // 32
				};
				refreshKeys.push(camelot.katapp.buildApiGET("hwHsaEligibility", qd));
				break;
			};
		}
		submitApiOptions.configuration.cacheRefreshKeys = refreshKeys;
	};
});
```

### Refreshing API Data Before Command Processing

When endpoints are processed, a validation calculation (`iValidate=1`) is the first action taken to produce the `command` rows to process.  See [command processing calculations](#Command-Processing) for more information.

To refresh API responses before the `iValidate` calculation occurs, the same `updateApiOptions` event handler must be used.

```javascript
application.configure((config, rbl, model) => {
	config.updateApiOptions = (submitApiOptions, endpoint) => {
		var refreshKeys = [];

		switch (endPoint) {
			case "hw/life-event":
				// Sample: setting refresh keys before a rbl-action-link endpoint is called
				// NOTE: This could also 
				if (model.hwApiUpdated == undefined) {
					refreshKeys.push("hwLifeEvents");
					model.hwApiUpdated = false;
				}
				break;
		}
		
		submitApiOptions.configuration.cacheRefreshKeys = refreshKeys;
	};
});
```

### apiDataSource ID Advanced Segments

Normally just a list of apiDataSource IDs (with option query string parameters) are provided in the `cacheRefreshKeys` property.  There are two 'segments' that can be used to augment the processing logic.

Segment | Description
---|---
`.MERGE` | By default, [temp query processing](#Temp-Query-Processing) has its `mergeMode` set to `Replace`.  There are times when it is desired to have a temp query merge into existing rows without removing all existing rows beforehand (i.e. if you run two different temp queries that map to the same history table and you want both results available at the end of the process).  To accomplish this, you can use the `.MERGE` segment after the apiDataSource ID but before the query string (i.e. `apiId.MERGE?some=value`).
`.FORCE` | By default, APIs are only ran if they haven't been run already (during login or by another KatApp).  If you want to force an Api to run, you can use the `.FORCE` segment after the apiDataSource ID but before the query string (i.e. `apiId.FORCE?some=value`).<br/><br/>**NOTE**: If you use `.FORCE` with and ID that is *not* using a query string, it will refresh the api data and bust *all* RBLe cache results for all pages.  If an api with a querystring is re-ran, the RBLe caches will not be destroyed.

### Refresh Key Workflow During Calculation

Given the following cacheRefreshKeys scenario, when a calculation is submitted from a KatApp, the following workflow occurs.

```javascript
application.configure((config, rbl, model) => {
	config.updateApiOptions = (submitApiOptions, endpoint) => {
		submitApiOptions.configuration.cacheRefreshKeys = [ "hwLifeEvents", "hwEligEvents?date=2023-12-31" ];
	};
});
```

1. If *any* of the requested calculations are *not cached*, all `refreshCacheKeys` are processed, and the requested calculations are submitted.
1. If *all* of the requested calculations *are cached*, only the data cache refresh keys for temporary queries are processed (i.e. `apiId?some=value`).

**Determining Whether a Calculation is Cached**

When determining whether a RBLe calculation cached result is available, a 'cache key' is created via the calculation's submit options (inputs, configuration, etc.).  Since the string representation of `cacheRefreshKeys` are part of the generated cache key, apiDataSource IDs do not need to be run before checking for valid caches.  Consider the following:

1. The first visit of the page says to run `hwLifeEvents` (if it has not already been run) and `hwEligEvents?date=` (every time, since it is a data cache refresh key for temporary query).
1. No RBLe cache exists yet, so all apiDataSource IDs will be ran before running calculation.
1. After the calculation completes, store the results in the RBLe cache.
1. User then navigates away and come backs.
1. If no actions (visiting another page and saving data) have modified *any part* of data model (see [RBL Calculation Caching](#rbl-calculation-caching) for more information about when RBLe caches are cleared) the RBLe cache would still be intact and a generated cache key (since the values for `cacheRefreshKeys` have not changed) would find a valid result cache.
1. There is no need to invalidate RBLe caches since since the underlying data has not changed nor has the calculation configuration, so the same result would be returned.

**Handling Query String Refresh Keys**

Regardless of RBLe caching, data cache refresh keys for temporary queries (query strings) *always* have to run so that the data is always available.  This is because the Nexgen framework automatically destroys all `.Query` API results on every page navigation.  If a page has any interactions in it that trigger a calculation (in additional to the first/`iConfigureUI` calculation) that depend on the temporary queries, the Nexgen framework has to guarantee that the data is always available.  

Consider the following (without re-running the data cache refresh keys for temporary queries, using configuration above):

1. The first visit of the page says to run `hwLifeEvents` (if it has not already been run) and `hwEligEvents?date=` (every time, since it is a data cache refresh key for temporary query).
1. No RBLe cache exists yet, so all apiDataSource IDs will be ran before running calculation.
1. After the calculation completes, store the results in the RBLe cache.
1. User then navigates away and come backs.
1. If no actions (visiting another page and saving data) have modified *any part* of data model (see [RBL Calculation Caching](#rbl-calculation-caching) for more information about when RBLe caches are cleared) the RBLe cache would still be intact and a generated cache key (since the values for `cacheRefreshKeys` have not changed) would find a valid result cache.
1. The user continues to use the page, and clicks a button that does an additional calculation and expects the data from `hwEligEvents?date=` to be present...the results will be incorrect.

The correct flow, re-running the data cache refresh keys for temporary queries (using configuration above):

1. The first visit of the page says to run `hwLifeEvents` (if it has not already been run) and `hwEligEvents?date=` (every time, since it is a data cache refresh key for temporary query).
1. No RBLe cache exists yet, so all apiDataSource IDs will be ran before running calculation.
1. After the calculation completes, store the results in the RBLe cache.
1. User then navigates away and come backs.
1. If no actions (visiting another page and saving data) have modified *any part* of data model (see [RBL Calculation Caching](#rbl-calculation-caching) for more information about when RBLe caches are cleared) the RBLe cache would still be intact and a generated cache key (since the values for `cacheRefreshKeys` have not changed) would find a valid result cache.
1. After locating the cached results, re-run all the data cache refresh keys for temporary queries (*which do not destroy RBLe caches*) to ensure that the `hwEligEvents?date=` are available for any subsequent calculations on the current page.
1. The user continues to use the page, and clicks a button that does an additional calculation...with the `hwEligEvents?date=` present, the results will be correct.

# NexGen CalcEngines

Most of the CalcEngines, and their tables/formulas/macros, are standard CalcEngines that should be straight forward to pick up for someone with CalcEngine experience.  However, there are some CalcEngines that have special processing or logic specific to Nexgen that are worth noting.

## Command Processing

When transactions need to occur with the user's data in the Nexgen site, the KatApps communication with API endpoints of the site.  All endpoints support 'command processing'.  At the start of every endpoint hander, a calculation is ran passing the current KatApp inputs along with a `iValidate=1` input.  This allows the CalcEngine to return two types of results:

1. Return `errors` table with one or more rows of validation issues given the current KatApp state, or
1. Return `command` and `command-inputs` tables describing the Nexgen APIs that should be called.
1. Return `data-updates` table describing updates that should be applied to xDS after the API work is complete.

After the validation calculation returns successfully, command rows are processed in `order` batches.  Commands sharing the same `order` value are ran together, then the next batch starts only after the current batch completes.  Once command processing finishes without unhandled validation or API errors, the framework also processes any `data-updates` rows returned by the validation calculation.  Those update instructions are applied to xDS after the API work is complete, can mark the data cache as busted, and may trigger a profile xml rebuild before the endpoint response is returned.  If `canContinue` stops later command batches, custom response generation is skipped, but `data-updates` are still processed because the transaction did not fail.

### Command Processing CalcEngine Tables

There are three tables that describe the Nexgen APIs that should be called: `command`, `command-inputs`, and `data-updates`.  `command` is the 'parent' table of `command-inputs`.  That is, commands can exist in `command` without any inputs, however `command-inputs` rows are *always* associated with an existing `command` row.  `command-inputs` ara used to generate the payload/post data to send to an API (when the `verb` is not a `GET`).  The `data-updates` table is used to describe updates that should be applied to xDS after the API work is complete.  The table schemas are described below.

#### command Layout

Column | Description
---|---
id | The name of the command which is then referenced in the `command-inputs` table (additionally it is sometimes used during [custom processing of API responses](#QnA-Processing) as well).
verb | The Http Verb to use when sending the reqeust (`GET`, `POST`, `DELETE`, `PUT`, `CALC`).  Note `CALC` is special verb for BA7 backend clients to indicate to use the `/lwc/calculation` endpoint instead of the standard `/lwc` endpoint.
endpoint | The url endpoint to process.  See [command Verb Segments](#command-Verb-Segments) about using the preferred `.KEY` segement and API key pattern.
canContinue | (Optional) If the command has mapping processing, a valid XPath selector can be provided to run against to results to indicate whether command processing should stop gracefully (if the selector returns `null`).  This is similar to [apiDataSource.eligibility](#apidatasource-layout) syntax/processing.  If the selector returns `null` all subsequent commands provided by the CalcEngine will be ignored and if the API endpoint had a custom return type generated, the `getResponseContent` delegate will *not* be called.  This is helpful to avoid multiple calculation calls since the CalcEngine can access the results for verification without a subsequent calculation passing in the results.
order | (Optional) Only used by the CalcEngine via the `command/sort-field:order` table name and flag to aid in ordering the API calls in the proper manner to successfully complete a transaction when a command is used in more than one scenario. Additionally, commands are **grouped into a batch** via the `order` value.  So, if multiple commands can run asyncronously, use the same `order` value to batch them.
fail-immediately | (Optional) If there is more than one command to run during a transaction, and one or more of them could return errors/validations from the Nexgen API, by default, all commands will continue to process and return all validation errors across all commands ran.  Additionally, if a single command uses `[key]` array inputs and therefore runs multiple times, validation errors across those input groups are accumulated by default and returned together at the end of that command.  If you wish to immediately stop transactional processing when a command returns errors, put a value of `true` in each command you wish that should immediately stop transactional processing if errors occur.

#### command Verb Segments

As mentioned above, the values for the `command.verb' column are `GET`, `POST`, `DELETE`, `PUT`, or `CALC`.  However, the verb can also contain *segments* (`.` delimitted values) that provide more details on how to process the `endpoint`. When using sements, the 'action' must **always** be first and the `.KEY` segement must **always be present and last**, i.e. `GET.KEY`.

Segment | Description
---|---
`.KEY` | To reference an endpoint defined in the BRD CalcEngines (the preferred mechanism), the `verb` should end with a `.KEY` segment (i.e. `GET.KEY`) indicating that the endpoint will be a value matching the `id` column in the [apiDataSource table](#apiDataSource-Layout). This is the perferred method of referencing api endpoints vs providing an actual url in the `command.endpoint` column like `/businessapi-service-tbo/common/v1/{legalIdentifier}/invoke-sp/QaInitialize`).<br/><br/>When using `.KEY`, `command-inputs.command` rows can be associated by either the `command.id` or by the resolved apiDataSource key.  The runtime first looks for inputs whose `command` column matches the apiDataSource key and, if none are found, falls back to rows matching the `command.id`.<br/><br/>When using a *key* to indicate a apiDataSource endpoint, you can still append query string values after the *key* and they will be appended/merged to the endpoint, or used as substitution for [{QS.param} tokens](#apiDataSource-Selector-Support), specified in the `apiDataSource` table (i.e. `dbEstimatesHistoryDelete?savedID=11`).<br/><br/>Remember, whenever a query string is provided (with `.KEY` or full endpoint), even if the resulting endpoint url matches what was specified in BRD, the results will still be considered *temp query processing* (unless substituting into the endpoint route).
`.MAP` | By default, `GET` commands are the only commands that will process the response and mappings to generate instructions to merge results into xDS Model.  If other verb type responses (`POST` or `PUT`) should be process mappings, you can add the `.MAP` segment after the verb but before the `.KEY` segment (i.e. `POST.MAP.KEY`).  This will allow the response to be processed by mappings (usually the just default xDS [Profile mapping](#Default-Profile-Flattening)).
`.MERGE` | By default, [temp query processing](#Temp-Query-Processing) has its `mergeMode` set to `Replace`.  There are times when it is desired to have a temp query merge into existing rows without removing all existing rows beforehand (i.e. if you run two different temp queries that map to the same history table and you want both results available at the end of the process).  To accomplish this, you can use the `.MERGE` segment after the verb but before the `.KEY` segment (i.e. `GET.MERGE.KEY`).
`CLEAR.` | The `CLEAR.` **prefix** is a mechansim for busting API data caches.  If you need to manually trigger a refresh or simply remove a previously cached API result, you can use the `CLEAR.KEY` `command.verb` along with the `apiDataSource.id` value to indicate which cache(s) to clear.  When used, the `command.endpoint` can be a comma delimitted list of IDs to clear.<br/><br/>If `endpoint=RBL`, it will clear all cached RBLe Calculation results.  If `endpoint=RBL.{viewId}` it will clear cached RBLe Calculation results *only* for the provided `viewId` (usually accessed via `iCurrentPage` or `iParentPage`).  This command is needed when data is updated, and the data source for the current page was a [temp query](#Temp-Query-Lifespan) and therefore issuing a `GET` for new data did not automatically bust RBLe caches.<br/><br/>If `endpoint=BRD`, this is an instruction to re-run the current user's BRD Calculation immediately.  When issuing a command to re-run the BRD, it should always be the **last** command processed during the transaction.<br/><br/>If `endpoint=BRD.DELAY`, the BRD recalculation is deferred until command processing has completed.  All command batches that are allowed to run are completed first, then any optional `data-updates` instructions are applied, and only then is the current user's BRD Calculation run.  Use this when the BRD must be calculated against the xDS state produced by the transaction.  `BRD.DELAY` should be the last BRD-refresh command in the transaction; it reports a refresh only after the deferred calculation completes.<br/><br/>A transaction may provide either `BRD` or `BRD.DELAY`, but must not provide both.

#### command-inputs Layout

Column | Description
---|---
command | Usually the `id` of the `command` used to relate inputs to a command.  When the command uses `.KEY`, this column can also be the referenced apiDataSource key; input rows keyed that way take precedence and the command `id` is used as a fallback.
key | The name of the input when creating payload/post data.
value | The value of the input when createing payload/post data.
parse | (Optional) A `1` or `0` indicating whether or not the site should attempt to parse the value into an `int`, `double` or `boolean`.  The default is `0` meaning the value will be treated as a `string` and enclosed in quotes.

#### Accessing Previous Command Result Values

As mentioned above, when an `iValidate=1` calculation is ran, the CalcEngine returns a list of commands/apis to run.  This can be any combination of `GET`, `POST`, `PUT`, etc.  This one CalcEngine result containing the list of commands will be ran sequentially, but are considered to all execute within 'one command processing context'.

There are situations when one command contains information that needs to be used by a subsequent command.  This can be accomplisehd by using a `{{resultCommandId.jsonSelector}}` token.  `resultCommandId` refers to the `id` column from the `command` table and `jsonSelector` is a period delimitted property token string that drills into an API response.

Given the following sample response that came from a command with `id=sampleApi`:

```json
{
    "response": {
        "division": "01",
        "employment": {
            "yearStart": 2020,
        },
        "addresses": [
            {
                "addressType": "HOME",
                "address1": "123 Normal Way",
                "city": "New York",
                "postalCode": "12121",
                "state": "NY"
            },
            {
                "addressType": "MAILING",
                "address1": "999 Conduent Towers",
                "city": "Manhattan",
                "postalCode": "34343",
                "state": "NY"
            }
        ]
    }
}
```

You could use the following selectors<sup>1,2</sup>:

Selector | Value
---|---
`{{sampleApi.division}}` | `"01"`
`{{sampleApi.emloyment.yearStart}}` | `2020`
`{{sampleApi.addresses[0].city}}`<sup>3</sup> | `"New York"`

1. The `response` root property is always omitted.
1. If any [Custom API Reponse Processing](#Custom-API-Reponse-Processing) was performed, the selectors should be based on the custom results versus the original API results.
1. You can drill into array properties with a `[index]` syntax where `index` is an integer specifying a zero-based index row.  Future versions may allow for querying a specific array (e.g. `{{sampleApi.addresses[state=NY].city}}`).

`{{resultCommandId.jsonSelector}}` are often uses in conjunction with a [{QS.param}](#apiDataSource-Selector-Support) embedded in a endpoint.

`apiDataSource` endpoint: `/businessapi-service-db/db/calc/v1/{legalIdentifier}/{QS.calcID}/calc-details-dynamic`
`command` endpoint: `dbCalcDetails?calcID={{dbEstimatesRequest1.calcIndicative[0].calcID}}`

In this scenario, first the `{QS.param}` tokens will be processed and `{QS.calcID}` will be replaced with `{{dbEstimatesRequest1.calcIndicative[0].calcID}}`.  Then the `{{resultCommandId.jsonSelector}}` tokens will be processed and `{{dbEstimatesRequest1.calcIndicative[0].calcID}}` will be replaced with the value from the previous `dbEstimatesRequest1` results.

The above scenario was describing how a `{{resultCommandId.jsonSelector}}` token could be used in the route and/or query string of an endpoint, however the same mechanism can be used for `command-inputs` as well when performing a `POST` action.  If the `value` of a command input is in `{{resultCommandId.jsonSelector}}` format, it'll attempt to grab a value from a previous result.

#### command-inputs value Processing

The following scenarios for input values are supported.

Type | Description
---|---
`string` | By default, the value will be passed in the payload as a string value (regardless of what the value is).
parse | If the `parse` column is set to `1`, the `value` try to be parsed as `int`, `double`, and `boolean` (in that order) and fall back to a `string` value if all parse attempts fail.
`json:` prefix | If the `value` has a `json:` prefix, it is expected that following `json:` is string that is already formatted into json format (i.e. `{ "nameFirst": "John" }`) and represents the 'nested' json object to pass as a value.
`[key]` | If the `key` is enclosed in array brackets (`[]`), the `value` column will be a comma delimitted list of values to process.  For each value in the list, the command associated with this input (and/or others) will be ran one time for each value.<br/><br/>If multiple `command-inputs` are associated to the command with the `[key]` syntax, each `value` must have the same number of items in the delimitted lists of values.<br/><br/>If a `command-inputs` item is associated with a command where other `[key]` inputs are associated and does *not* use the `[key]` syntax itself, the same value will be passed in every time the command is submitted.
`null` | If the string `null` is returned in the `value` column, the `null` value will be assigned to the property (not an empty string).
`child.parent` | A child-parent container object can be constructed by using period delimitted property names.

##### command-inputs value Payload Creation

Below is a sample table displaying all the supported features of `command-inputs` and how they are processed into a API payload/post data.

command|key|value|parse
---|---|---|---
commandId | nameFirst | John
commandId | nameMiddle | null
commandId | division | 01
commandId | age | 54 | 1
commandId | employment | json:{ "yearStart": 2020, "status": "Active" }
commandId | [pay]* | 100,200,300,400 | 1
commandId | [hours] | 10,20,30,40 | 1
commandId | [code] | 01,22,B4,AA
commandId | phones.home | 866 555-1212
commandId | phones.work | 866 444-3333

The table above would generate the following payload:

```json
{
    "nameFirst": "John",
    "nameMiddle": null,
    "division": "01",
    "age": 54,
    "employment": {
        "yearStart": 2020,
        "status": "Active"
    },
    "pay": 100,
    "hours": 10,
    "code": "01",
    "phones": {
        "home": "866 555-1212",
        "work": "866 444-3333"
    }
}
```

\* The payload above would be created four times with `pay`, `hours` and `code` varying while processing each value in the `value` array.

##### command-inputs QnA Payload Creation

The QnA payload creation is done manually by the web site instead of using the default `command-inputs` payload creation.  All inputs are converted into an array row for a `procParams` property (note that the `parse` column is ignored and all values are treated as `string`).

command|key|value|parse
---|---|---|---
commandId | nameFirst | John
commandId | nameMiddle | null
commandId | division | 01
commandId | age | 54 | 1

The table above would generate the following payload:

```json
{
  "procParams": [
    {
      "name": "nameFirst",
      "value": "John"
    },
    {
      "name": "nameMiddle",
      "value": null
    },
    {
      "name": "division",
      "value": "01"
    },
    {
      "name": "age",
      "value": "54"
    }    
  ]
}
```

## RBL Calculation Caching

To help with performance, a small caching algorithm has been implemented to cache RBL calculation results.  To understand the algorithm, the following rules are applied when determining if a result can be returned from the cache.

1. A query string of `rblcache=0` can be used to disable caching.
1. The [`forceCalculation`](#forcecalculation) must not be `true`.
1. Only results from client side calculations will be considered for caching (i.e. calculations called during endpoint processing or other server side code are **never** cached).
1. The cache 'key' to uniquely identify a calculation is the combination of inputs, CalcEngine specifications (name, tabs, etc.), and other KatApp/calculation configuration options (such as current page, test or live CalcEngine, etc.).
1. Cached calculations are invalidated when 'data is updated' based on following:
  1. Results for *all pages* are invalidated when new API data is requested via a `GET` and **no** query string value during [Command Processing](#Command-Processing) or [Refreshing API Data On Demand](#refreshing-api-data-on-demand--cacherefreshkeys).
  1. Results for the *current view* will be invalidated when a [temporary API data](#Temp-Query-Processing) is requested _during endpoint processing_ via a `GET` and query string **is provided**.  'Current view' is the name of the Kaml file, so if it is used in multiple locations from the site menu, all pages will have caches invalidated.
  1. Cached results are **not** invalidated when temporary API data is requested via javascript in the KatApp via 'Refreshing API Data On Demand'.  It is assumed that once the data has been requested once, it will remain unchanged (i.e. calculation cache is valid) until server side API processing issues a normal or temporary `GET` (usually during endpoint processing).
1. If a debug CalcEngine is being generated, the calculation will not be considered for caching.
1. If a new CalcEngine is uploaded, the calculation will be ran and the cache will be updated.  CalcEngine versions are updated only when **any** user navigates to a different page.  Therefore, if only one user is on site, and not navigating page to page, even if a CalcEngine is uploaded, the cache will remain valid until the next validation. 

### forceCalculation

Usually, the above described caching process will handle everything you need.  Currently, the only situation that wouldn't result in correct data given the state of view/edit/delete flows in the site, is when the 'api data source' is modified from within another system of which Nexgen has no communication with.  In that scenario, the Nexgen data would be stale until a login cycle is performed, or unless the data that was updated *happened* to be requeried due to user interaction in the Nexgen site.

If you want to always ensure that the latest data is pulled down and used in a calculation, you can use the `forceCalculation` property of the `submitApiOptions.configuration` object.

1. `forceCalculation` ensures that previous cached calculation results cannot be served, and instead it should run a new calculation.
1. It will always run 'query string', so that data would be requested before running the new calculation.

```javascript
application.configure(config => {
	config.updateApiOptions = submitApiOptions => {
		submitApiOptions.configuration.cacheRefreshKeys = [ 
			"dbSavedCalc2Details?calcID=321"
		];
		submitApiOptions.configuration.forceCalculation = true;
	};
});

// If you need a 'non query string' apiDataSource ID to re-run, you'll need to use the .FORCE in conjunction with the forceCalculation
// .forceCalculation will skip the cache and process the cacheRefreshKeys and calculation as if it were the first time.
// .FORCE ensures that the dbSavedCalc2Details api is ran regardless of whether it has been run before
application.configure(config => {
	config.updateApiOptions = submitApiOptions => {
		submitApiOptions.configuration.cacheRefreshKeys = [ 
			"dbSavedCalc2Details"
		];
		submitApiOptions.configuration.forceCalculation = true;
	};
});
```


## Conduent_Nexgen_QnA_SE

The QnA CalcEngine is a bit different than other Nexgen CalcEngines because it was built to process/managage the 'generic' QnA legacy framework built by Conduent.

Each QnA KatApp application is identified by a unique `quest_key` and all QnA objects related to this key are returned from the [QnA APIs](#QnA-Processing).  Since each `quest_key` returns complete different objects (described in the `QaQuestionSelect` table), the CalcEngine can write specific logic for validation, input names, etc.

### Conduent_Nexgen_QnA_SE Tables

Input Tab|Description
---|---
`QaQuestionSelect` | xDS History Table.  Contains meta data for all QnA objects that will be rendered by the application.  Validation information, object type (question, display, etc.), current answers, etc. can be found in this table. The unique ID for this table is the `quest_seq` column.*
`QaAnswerSelect` | xDS History Table.  If a question (identified by the `quest_seq` column) has list of valid answers, each valid answer is provided in this table.
`QaInitialize` | xDS History Table.  Contains meta data for the entire QnA application (i.e. if cancel is allowed, submit button text, etc.).*
`updateValues` | Input Table.  When a calculation is triggered, the QnA KatApp will loop al 'UI Inputs' and build a table of inputs to pass to the CalcEngine.  The `quest_seq` column contains the key (prefixed with `q`) to identify the QnA object.

\* See the official QnA documentation for detailed documentation on different QnA meta data columns.

Result Tab|Description
---|---
`questionSelect` | The main KatApp `rbl-source` table used to render the QnA KatApp's UI.

### Passing Conduent_Nexgen_QnA_SE Data

See [QnA Processing](#QnA-Processing) for a detailed description on how xDS data is passed to the CalcEngine.  As described above, the table names are generic and not tied to a specific `quest_key`.  However, QnA API responses are cached with each history table having a `quest_key` *suffix*.  During the life span of the Nexgen site, the `quest_key` being processed is unknown, and to reduce the number of tables on the input tab, *only* the appropriate QnA response cache is massaged into the generic name and *only* rows from that response are passed to the CalcEngine for each calculation.

### Refreshing Conduent_Nexgen_QnA_SE API Data On Demand

Similar to the CalcEngine, the QnA KatApp has been built generically and therefore can not have specific javascript in the KatApp to refresh specific QnA API data.  To accomplish this, there is an `iCacheRefreshKeys` input that can be passed in with the value being in the same format as the [CacheRefreshKeys configuration property](#refreshing-api-data-on-demand--cacherefreshkeys).

When a value is passed in, the `refreshData` command will be turned on during endpoint calculations and provide the [apiDataSource](#apiDataSource-Layout) IDs to refresh.

To assign this value, normally the KatApp host application will provide the value via a `data-input-cache-refresh-keys=` attribute.
