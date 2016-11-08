Overview
========
This repository provides example code for downloading a PlayCanvas
package application using Node.js and Gulp.

Credentials
===========
In-order to download a file from PlayCanvas you must have permission
to use the REST API supplied. To make use of this API you must have
an Organisation level account
(http://developer.playcanvas.com/en/user-manual/organizations/).
Once you have an organisation account you must create an API key by
visiting the appropriate section in your account settings. When you
create your API key, you will be provided an access key.

Create a file called .credentials.json and edit it with the following
information:

```
{
    "projectId": <your project id>,
    "packageName": "<filename to store the package file>",
    "projectName": "<project name in API key>",
    "accessToken": "<access token in API key>"
}
```
As an example, your file will look similar to:
```
{
    "projectId": 123457,
    "packageName": "my_project.zip",
    "projectName": "MYPROJECT",
    "accessToken": "fe73826aa264ccd"
}
```
The credentials file is specified within the .gitignore file to ensure
it is not stored within source-control. If you rename the file, you
should make sure your API keys are not exposed.

Once your credentials file is ready, you may then download your package
my initiating the gulp command.

This repository is intended for demonstration purposes and it is
expected that you will need to expand and customise the contained code.