/*
 * This file contains basic code template necessary for pulling data from a google sheet.
 * Every function before getSheetsValue() should remain relatively constant in every instance
 * of this js logic. All you really need to do is edit getSheetsValue() to be ingesting the right
 * range of data from the sheet(s), in a format that you can understand and parse into each browser source.
 * Then add other functions and logic stemming from the data you get to add animations, logic, update values,
 * etc.
 *
 * HIGHLY RECOMMEND SELECTING "Shutdown source when not visible" in OBS.
 */

// TODO: check API key, spreadsheet ID, range name and range values, discovery doc, parse info
//API key, need to change, make sure it works
const API_KEY = CFG_API_KEY;
// Discovery doc URL for APIs used by the quickstart, it's apparently useful
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
//Spreadsheet API call representation https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values

/*PULLRATE is how often (ms) info from the google sheet will be pulled. Max 1000ms, as google will start rate limiting
 * past 60 calls/second. */
const PULLRATE = 2000;

const SPREADSHEETID = '1Tme3Jjw46wLTV_obzmON0FB1e7vEam3JZvo_Ocnd8Vc';
//update sheet name in the Range definitions

const fadeTime = 400;
//Fade transition time in ms, used in setTimeout(). Make sure this matches the fade time in the css .root{} constants.


//-----------------------------------------------------
//GLOBAL VARIABLES (specific to use case of graphic)
let gapiInited = false;
let timeSet = false;
let pauseTimer=false;
let timerRef;
let fadeTimer = false;
let time = 0;
/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
    console.log('gapiLoaded()');
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    console.log('initializeGapiClient()');
    setInterval(getSheetsValue, PULLRATE);
}


async function getSheetsValue() {
    let response;
    try {
        //Fetching data values from spreadsheet
        response = await gapi.client.sheets.spreadsheets.values.get({
            //When changing sheets, update sheetID, and update the sheet name when updating range
            spreadsheetId: SPREADSHEETID,
            range: 'GFX Controller!C5:D15',
        });
    } catch(err) {
        //error check
        //document.getElementById('errorMessage').innerText=err.message;
        console.log('try catch error in getSheetsValue()');
        return;
    }

    const range = response.result;
    //error checking the values returned from the API check
    if (!range || !range.values || range.values.length == 0) {
        //document.getElementById('errorMessage').innerText = 'No values found.';
        console.log('Null values/invalid data received from gapi in getSheetsValue() second check');
        return;
    }
    console.log('successful getSheetsValue()');
    //If successfully extracted data with no errors, execute updateElements()
    updateElements(response);
    return;
}
/* getSheetsValue() has completed, it now sends the updated data to updateElements(), which you will have to
 * refactor with appropriate code and logic to update whichever HTML fields need to be updated, execute animations,
 * or do literally whatever you need to do with the new data. Consider updateElements() your blank slate.
 * Note: the values[][] array is default given as [row][column].
 */

function updateElements(response) {
    let responseVals = response.result.values;
    let currentTimer;
    //header
    fadeTextChange('headerTxt',responseVals[0][0]);

    //next up text
    fadeTextChange('nextUpText',responseVals[1][0]);

    //Timer
    if (responseVals[4][0]== 'TRUE' && !timeSet) {
        time = (parseInt(responseVals[3][0])*60) + parseInt(responseVals[3][1] + 1);
        timeSet=true;

        clearInterval(timerRef);
        timerRef = setInterval(startTimer,1000);
        fadeTimer=false;
    } else if (responseVals[4][0]=='FALSE') {
        timeSet = false;
    }
    if (responseVals[5][0]=='TRUE') {
        pauseTimer = true;
    }
    else {
        pauseTimer = false;
    }

    //Casters 2box text
    fadeTextChange('cast1',responseVals[9][0]);
    fadeTextChange('cast2',responseVals[9][1]);

    //Caster nameplates up/down
    if (responseVals[10][0]=='TRUE') {
        document.getElementById('casterBubbles').style.top='0px';
    }
    else if (responseVals[10][0]=='FALSE'){
        document.getElementById('casterBubbles').style.top='450px';
    }
    else {
        console.log("Error in detecting TRUE/FALSE condition in caster 2box pull up/down");
    }

}

function startTimer() {
    if (!pauseTimer) {
        time--;
    }
    let min = Math.floor(time/60);
    let sec = time%60;
    let out = '';

    if (time <= 0) {
         if (!fadeTimer) {
             document.getElementById('breakTimer').innerText = '0:00';
             setTimeout(() => {
                 fadeTextChange('breakTimer', '');
                 fadeTimer = true;
             }, 10000);
         }
         return;
    }
    if (sec < 10) {
        out = '' + min + ':0' + sec;
    }
    else {
        out = '' + min + ':' + sec;
    }

    console.log(document.getElementById('breakTimer').textContent);
    if (document.getElementById('breakTimer').textContent.trim()=='') {
        fadeTextChange('breakTimer',out);
        return;
    }
    document.getElementById('breakTimer').innerText = out;
}

async function fadeTextChange(elementID, newText) { //async so it doesn't delay the function that calls it
    let doc = document.getElementById(elementID);

    if (doc.textContent == newText) {
        //use textContent to compare element text, as it removes whitespace/hidden characters related to HTML tags
        return;
    }
    doc.style.color = 'rgba(255,255,255,0)';
    setTimeout(function() {
        doc.innerText = newText;
        doc.style.color = 'rgba(255,255,255,1)';
        },
        fadeTime);
    return;
}