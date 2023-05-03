const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const path = require('path');
const { debug } = require('console');
const { debuglog } = require('util');

// Starter Code Setup
const SPREADSHEET_ID = "1VD9UaSO4wZRCBtP0V3Qn0b_eOWazjVcWozK6I50_zYk"

// Set up authentication
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'privateSetting.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Create a new instance of the Sheets API
const sheets = google.sheets({ version: 'v4', auth });

// Create Express app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static pages on the base URL, on the root path
app.use(express.static('public'));

app.get('/', function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.sendFile(  'index.html');
});

// Handle GET requests on "/api"
async function onGet(req, res) {
    try {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A2:B',
      });
  
      const rows = result.data.values;
      const data = rows.map((row) => {

        return {
          name: row[0],
          email: row[1],
        };
      });
  
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).send('error on GET');
    }
  }

app.get('/api', onGet)


// Handle POST requests
async function onPost(req, res) {
    const { name, email } = req.body;
    
    try {
      const result = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:B',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[name, email]],
        },
      });
  
      res.json({ status: 'success' });
    } catch (err) {
      console.error(err);
      res.json({ status: 'Error on post' });
    }
  }

app.post('/api', onPost);

// Handle PUT requests
async function onPut(req, res) {
  const value = req.params.value;
  
  const {name, email} = req.body;

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:B',
    });

    const rows = result.data.values;
    const rowIndex = rows.findIndex((row) => row[0] === value);

    if (rowIndex === -1) {
      res.json({ status: 'No match found' });
      return;
    }

    if(email !== undefined && name !== undefined){
      const updateResult = await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Sheet1!A${rowIndex+1}:B${rowIndex+1}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[name,email]],
        },
      });
    }else{
      res.json({ status: 'Please fill all blanks!' });
      return;
    }
    
    res.json({ status: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).send('error on PUT');
  }
}

app.put('/api/name/:value', onPut);

// Handle DELETE requests
async function onDelete(req, res) {
    
    const name = req.params.name;
    try {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:B',
      });
  
      const rows = result.data.values;
      const rowIndex = rows.findIndex((row) => row[0] === name);
  
      if (rowIndex === -1) {
        res.json({ status: 'No match found'+ name });
        return;
      }
  
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0,
                  dimension: 'ROWS',
                  startIndex: rowIndex ,
                  endIndex: rowIndex + 1,
                },
              },
            },
          ],
        },
      });
  
      res.json({ status: 'success' });
    } catch (err) {
      console.error(err);
      res.json({ status: 'Error on DELETE' });
    }
  }

app.delete('/api/name/:name', onDelete);

async function onPatch(req, res) {
  const value = req.params.value;
  
  const {name, email } = req.body;

  

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:B',
    });

    const rows = result.data.values;
    const rowIndex = rows.findIndex((row) => row[0] === value);

    if (rowIndex === -1) {
      res.json({ status: 'No match found' });
      return;
    }
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet1!A${rowIndex+1}`,
      valueInputOption: 'RAW',
      resource: {
        values: [[name,email]],
        
      },
      
    });
    

    res.json({ status: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).send('error on PATCH');
  }
}

app.patch('/api/name/:value', onPatch);


const port = process.env.PORT || 3000;
const ip = "localhost";
app.listen(port, ip, () => {
    console.log(`Server running at http://${ip}:${port}`);
  });



