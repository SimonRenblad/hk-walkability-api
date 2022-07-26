# Integrate Airtable with AWS Lambda

In this guide, you will learn how to:

1. Use the `Serverless` framework to create a new `Express.js` project.
2. Install and run `Airbyte` as a local docker container.
3. Create an `Airtable` and enable connections.
4. Connect your table to a `DynamoDB` table.
5. Get data from your table in your API.

## Prerequisites

This guide assumes the following:

+ `Docker` installed and running locally.
+ `AWS` account set up with credentials. (We will use the free tier of AWS)
+ `Airtable` account created with a table populated with data.

## Installing Serverless

[Serverless](https://www.serverless.com/) is a build tool for boilerplating and deploying APIs to cloud services. 

To install `Serverless`, run:

    npm install -g serverless

Make sure to configure your `AWS` credentials by running:

    serverless config

After submitting your credentials, you should now be ready to create a new project.

## Create a new project

Creating a new project in `Serverless` is easy, just run:

    serverless

You will be prompted to select which boilerplate to start with. In this guide, we will use the standard `Express.js` boilerplate (without DynamoDB). We will implement the database connection manually later in the guide.

Make sure to enable your `AWS` credentials and create a new project for the `Serverless` webapp.

It's as simple as that! Now we are ready to get our database connection.

## Install Airbyte

[Airbyte](https://docs.airbyte.com/) is one of many database connection tools. One benefit of using `Airbyte` is that it has an open-source dockerized version that can be run locally. To install `Airbyte`, use the following commands:

```
git clone https://github.com/airbytehq/airbyte.git
cd airbyte
docker-compose up
```

When the installation is finished, you should be prompted to open the webapp. It is here that we will create a connection between `Airtable` and `DynamoDB`.

## Create Airbyte connection

1. In the webapp, under the `Connections` tab, click on `New Connection`.

### Source

2. Click on `Source Type` and choose `Airtable`. 

3. Choose a `Name`, then choose your table name and add it to `Tables`.

4. Navigate to the [Airtable account page](https://airtable.com/account) and generate a new API key (or use an existing one). Add it in `Airbyte` under `API Key`.

5. Navigate to the [Airtable API page](https://airtable.com/api) and click on the workspace to get data from. Grab the `Base ID` from this page and provide it in `Airbyte`.

6. Click on `Set up source`.

### Destination

7. Click on `Destination Type` and choose `DynamoDB`.

8. Choose a `Name`, then provide your `AWS` configuration information including credentials and location. Ignore `Endpoint`. 

9. Pick any `Table name prefix`.

10. Click on `Set up destination`.

### Sync

After the source and destination have been configured you will be prompted whether to sync immediately, and how often to sync the data. For our purposes, 24h sync is fine, but feel free to experiment. For testing you can also manually sync whenever needed.

Now you have created your database connection!

## Putting it all together

We are finally ready to access our data in `Express.js`. After syncing, visit the [DynamoDB Console](https://us-east-1.console.aws.amazon.com/dynamodbv2/) and click on the `Tables` tab. Note down the name of your synced table.

Now in your `handler.js` file, remove some of the boilerplate endpoints and add the following code:

```javascript
const TABLE_NAME = "<your-table-name-here>";
	
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());

app.get("/v1/api/", async function (req, res) {
  const params = {
    TableName: TABLE_NAME,
  }
  try {
    dynamoDbClient.scan(params, (err, data) => {
      if (err) {
          console.log(err);
      } else {
          var items = [];
          for (var i in data.Items) {
            items.push(data.Items[i]["_airbyte_data"])
          }
          res.contentType = 'application/json';
          res.send(items);
      }
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error });
  }
  
})
```

Save your work and run.

    serverless deploy

You can navigate to your lambda endpoint and if you access the route "/v1/api/" you should see all of your synced data displayed on screen.

Alternatively, for localhost testing you can install the plugin [serverless-offline](https://www.serverless.com/plugins/serverless-offline#installation):

```
npm install serverless-offline --save-dev
```

Make sure that in the `serverless.yml` file, the following two lines are added:

```
plugins:
  - serverless-offline
```

_Note: If other plugins are already installed, simply add serverless-offline to the list._



Recommended next steps:

+ Use `Express.js` to create more endpoints to filter and extract data from your table.
+ Create a [Swagger/OpenAPI](https://swagger.io/) specification to document your API.
+ Create a killer README to guide users on using your API.
+ Host your API for others to use on an API Marketplace like [OpenAPIHub](https://www.openapihub.com/en-us/)


Thank you for following this guide!

