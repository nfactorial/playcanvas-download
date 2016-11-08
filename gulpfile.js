const fs = require('fs');
const url = require('url');
const gulp = require('gulp');
const https = require('https');

const CREDENTIALS_FILENAME = './.credentials.json';

// Maximum number of times we will poll the PlayCanvas server before giving up.
const MAXIMUM_ATTEMPT_COUNTER = 10;

// Time (in milliseconds) before we poll the PlayCanvas server
const PLAYCANVAS_ATTEMPT_DELAY = 10 * 1000;

// This code just verifies there is actually a credentials file for us to use.
// You must create your own, please see README.md for instructions on how to fill one out.
try {
    fs.statSync(CREDENTIALS_FILENAME);
} catch (error) {
    console.log('Unable to find credentials file \'' + CREDENTIALS_FILENAME + '\'.');
    process.exit(1);
}

const CREDENTIALS = require(CREDENTIALS_FILENAME);

/**
 * The default task causes the file to be downloaded from PlayCanvas.
 */
gulp.task('default', [
    'download:app'
]);


/**
 * This task asks the PlayCanvas server to build a .zip file package for our project.
 * Once the server has produced the package it then downloads the file to the local folder.
 */
gulp.task('download:app', (done) => {
    if (!CREDENTIALS.accessToken) {
        console.log('No PlayCanvas access token available for download operation.');
        process.exit(1);
    } else if (!CREDENTIALS.projectName) {
        console.log('No PlayCanvas project name to store file.');
        process.exit(1);
    } else {
        var bodyData = {
            project_id: CREDENTIALS.projectId,
            name: CREDENTIALS.projectName
        };

        var options = {
            host: 'playcanvas.com',
            path: '/api/apps/download',
            method: 'POST',
            port: 443,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + CREDENTIALS.accessToken
            }
        };

        var request = https.request(options, (response) => {
            response.on('data', (data) => {
                var result = JSON.parse(data);

                waitForJobStatus(result.id, (err, data) => {
                    if (err) {
                        done();
                    } else {
                        downloadPlayCanvasPackage(data.data.download_url, (err) => {
                            done();
                        });
                    }
                });
            });
        });

        request.write(JSON.stringify(bodyData));
        request.end();
    }
});

/**
 * This function polls the PlayCanvas server for the status of a job, the supplied
 * callback is invoked when the jobs status has switched to the 'complete' state.
 * @param {number} jobId - Identifier of the job to be checked.
 * @param {function} cb - Callback to be invoked when the job has completed or an error occurs.
 */
var waitForJobStatus = function(jobId, cb) {
    attemptJobStatus(0, jobId, cb);
};

/**
 * Performs a check for the status of a job running on the PlayCanvas servers. This method should not
 * be called directly, instead please use the waitForJobStatus method.
 * @param {number} attemptCounter - Index of the current poll attempt.
 * @param {number} jobId - Identifier of the job to be checked.
 * @param {function} cb - Callback to be invoked when the job has completed or an error occurs.
 */
var attemptJobStatus = function(attemptCounter, jobId, cb) {
    if (attemptCounter >= MAXIMUM_ATTEMPT_COUNTER) {
        cb('error', null);
    } else {
        queryJobStatus(jobId, (err, data) => {
            if (err) {
                // Error occurred
                cb(err, null);
            } else {
                switch (data.status) {
                    case 'running':
                        // Wait for timeout, try again
                        setTimeout(() => {
                            attemptJobStatus(attemptCounter + 1, jobId, cb);
                        }, PLAYCANVAS_ATTEMPT_DELAY);
                        break;

                    case 'complete':
                        cb(null, data);
                        break;

                    case 'error':
                        // Terminate
                        cb('error', null);
                        break;
                }
            }
        });
    }
};


/**
 * Downloads a PlayCanvas application package from the specified URL path.
 * @param {string} path - Web path where the package is located.
 * @param {function} cb - Callback to be invoked when the download has completed.
 */
var downloadPlayCanvasPackage = function(path, cb) {
    var parsedUrl = url.parse(path);

    var options = {
        host: parsedUrl.hostname,
        path: parsedUrl.path,
        method: 'GET',
        port: 443
    };

    const file = fs.createWriteStream('./' + CREDENTIALS.packageName);
    file.on('finish', cb);

    var request = https.request(options, (response) => {
        response.pipe(file);
    });
    request.end();
};


/**
 * Polls PlayCanvas for the status of a specific job.
 * @param {Number} jobId - Identifier of the job to be polled.
 * @param {function} cb - Callback to invoked when the operation has completed.
 */
var queryJobStatus = function(jobId, cb) {
    var options = {
        host: 'playcanvas.com',
        path: '/api/jobs/' + jobId,
        method: 'GET',
        port: 443,
        headers: {
            'Authorization': 'Bearer ' + CREDENTIALS.accessToken
        }
    };

    var request = https.request(options, (response) => {
        response.on('data', (data) => {
            var parsedData = JSON.parse(data);
            if (parsedData.error) {
                cb(parsedData.error, null);
            } else {
                cb(null, parsedData);
            }
        });
        response.on('error', () => {
            cb('error', null);
        });
    });
    request.end();
};
