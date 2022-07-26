const AWS = require("aws-sdk");
const { json } = require("express");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const WALKABILITY_TABLE = "walkability_table_dev_Walkability";
	
// const dynamoDbClientParams = {};
// if (process.env.IS_OFFLINE) {
//   dynamoDbClientParams.region = 'localhost'
//   dynamoDbClientParams.endpoint = 'http://localhost:8000'
// }
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();


app.use(express.json());

app.get("/v1/api/", async function (req, res) {
  const params = {
    TableName: WALKABILITY_TABLE,
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

app.get("/v1/api/data", async function (req, res) {
  const params = {
    TableName: WALKABILITY_TABLE,
  }
  const allowed_parameters = [
    "size", "scale", "congestion", "harbourfront", "ease_of_wayfinding", "connections", "connections_scaled", "connections_score", "choke_points", "choke_points_scaled", "choke_points_score", "breakdowns", "breakdowns_scaled", "breakdowns_score", "direction_signs", "direction_signs_scaled", "direction_signs_score", "average_walkability", "total_walkability", "total_weighted_walkability"
  ]
  try {
    var single_row = false
    var table_head = ["area"]
    for(var p in req.query){
      if(allowed_parameters.includes(p)) {
        table_head.push(p)
      } else if(p === "area"){
        single_row=true
      } else {
        console.log("Error: Invalid query parameter")
        res.status(400).json({ success: false, message: `Error: Invalid query parameter ${p}`})
      }
        
    }
    if(table_head.length === 1) {
      table_head = table_head.concat(allowed_parameters)
    }
    var items
    var row
    dynamoDbClient.scan(params, (err, data) => {
      items = []
      if (err) {
          console.log(err);
      } else {
          items.push(table_head)
          for (var i in data.Items) {
            row = []

            if(single_row){
              if(data.Items[i]["_airbyte_data"]["area"] === req.query["area"]){
                for (var p in table_head) {
                  row.push(data.Items[i]["_airbyte_data"][table_head[p]])
                }
                items.push(row)
                res.contentType= 'application/json'
                res.send(items)
                return
              }
              continue
            }
            for (var p in table_head) {
              row.push(data.Items[i]["_airbyte_data"][table_head[p]])
            }
            items.push(row)
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



// app.get("/users/:userId", async function (req, res) {
//   const params = {
//     TableName: USERS_TABLE,
//     Key: {
//       userId: req.params.userId,
//     },
//   };

//   try {
//     const { Item } = await dynamoDbClient.get(params).promise();
//     if (Item) {
//       const { userId, name } = Item;
//       res.json({ userId, name });
//     } else {
//       res
//         .status(404)
//         .json({ error: 'Could not find user with provided "userId"' });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: "Could not retreive user" });
//   }
// });

// app.post("/users", async function (req, res) {
//   const { userId, name } = req.body;
//   if (typeof userId !== "string") {
//     res.status(400).json({ error: '"userId" must be a string' });
//   } else if (typeof name !== "string") {
//     res.status(400).json({ error: '"name" must be a string' });
//   }

//   const params = {
//     TableName: USERS_TABLE,
//     Item: {
//       userId: userId,
//       name: name,
//     },
//   };

//   try {
//     await dynamoDbClient.put(params).promise();
//     res.json({ userId, name });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: "Could not create user" });
//   }
// });

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
