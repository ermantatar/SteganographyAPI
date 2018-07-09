# SteganographyAPI
SteganographyAPI, Image Message Hider Web Service 


The aims of this project are as follows:
• To implement some simple web services.
• To expose you to using the express.js server framework.
• To give you some more experience with asynchronous code.

This project allows you to use web services which allow adding and retrieving images from a database as well as using the stored images to perform steganography.

An image is identified by two strings: 

-group A non-empty string which does not contain any NUL or / characters. 

-name A non-empty string which does not contain any NUL or / characters

Note that above restrictions on group and name allow them to be path components within a URL or a Unix filesystem path.
An example identification for an image might have group inputs and name rose. Since group and name cannot contain / characters, we can unambiguously use the single string group/name to identify an image, for example inputs/¬ rose.

Image store service: POST /api/images/group The body of this request should be of type multipart/form-data containing a field img which specifies a file upload of a PNG or PPM file. A new image should be created in the underlying database with id group/name where group is the group suffix of the request URL and name is a new name.

If the request is successful, it should return a response with status 201 CREATED and return a Location header where the uploaded image can be accessed using the next web service.

Image retrieval service: GET /api/images/group/name.type Return the type (either png or ppm) representation for the image with id group/name.

Image meta-information service: GET /api/images/group/name/meta If successful, the response body should consist of a JSON object contain- ing meta-information for the image with id group/name. The return’d JSON must have the following fields:

-"width" The width of the image.
-"height" The height of the image.
-"maxNColors" The maximum number of colors in the image.
-"nHeaderBytes" The number of bytes in the header of the PPM repre- sentation of the image.
-"creationTime" The time at which this image was stored in the under- lying database. The time is represented as the number of milliseconds since the epoch 1970-01-01T00:00:00Z.

Image list service: GET /api/images/group If successful, the response body should consist of a JSON list containing the names of all the images stored under group.

Message hide service: POST /api/steg/group/name This request is used to hide a message using the image identified by group/name which should already be in the database. The new image containing the hidden message will be stored in the database.

The body of this request should consists of a JSON object containing two fields:
outGroup A string which specifies a group for the newly created image containing the hidden message.
msg A string specifying the message to be hidden.

A new image containing the hidden message should be created in the
underlying database in the group specified by outGroup with a new name.

If the request is successful, it should return a response with status 201 CREATED and return a Location header which can be used to retrieve the hidden message using the next web service.

Message unhide service: GET /api/steg/group/name The response body should contain a JSON object with a single field msg which contains the message which is hidden in the image identified by group/name.

Any errors in the above requests should be reported using suitable HTTP status codes. The body of the error response should be a JSON object containing a code field with a suitable value which may be different from the HTTP status code and a message field giving details about the error. The server can also log a message to standard error.
